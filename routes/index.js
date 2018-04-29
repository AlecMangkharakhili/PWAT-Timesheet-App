var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var bcrypt = require('bcrypt');
var passport = require('passport');

// Import database information and connection
const db = require('../db');

// Var for errors
router.use((req, res, next) => {
  res.locals.errors = null;
  next();
});

router.get('/', function(req, res, next) {
  res.redirect('/login');
});

router.get('/login', (req, res, next) => {
  res.render('login');
});

// Login authentication/render
router.post('/login', (req, res) => {

  let checkLogin = {
    username: req.body.username,
    password: req.body.password
  };
  let query = db.query('SELECT password FROM users WHERE username = ?', [checkLogin.username], (err, results) => {
    if(err){
      console.log(err);
    }
    else{
      // Checks if the user is in the database
      if(results != ''){
        if(bcrypt.compareSync(req.body.password, results[0].password)){
          db.query('SELECT employee_id,accesslevel,name FROM users WHERE username = ?', [checkLogin.username], (err, results) => {
            req.login(results[0], (err) => {
              res.redirect('/home');
            });
          });
        }
        else{
          res.render('login', {errors: 'Invalid username or password'});
        }
      }
      else{
        res.render('login', {errors: 'Invalid username or password'});
      }
    }
  });
});

router.get('/home', checkLoggedIn(), (req, res, next) => {
  res.render('home', {
    isManager: req.user.accesslevel,
    sidebarName: (req.user.name)
  });
});

router.get('/addentry', checkLoggedIn(), (req, res, next) => {
  if (req.user.accesslevel == 1)
  {
    db.query('SELECT name FROM users', (err, results) => {
      var nameArr = [];
      for (let i = 0; i < results.length; i++)
      {
        // Ignores admin account
        if (results[i].name != "Alec Mangkharakhili")
        {
          nameArr.push(results[i].name);
        }
      }
      res.render('addentry', {
        isManager: req.user.accesslevel,
        sidebarName: (req.user.name),
        selectName: nameArr
      });
    });
  }

  if (req.user.accesslevel == 0)
  {
    res.render('addentry', {
      isManager: req.user.accesslevel,
      sidebarName: (req.user.name)
    })
  }
});

router.post('/addentry', (req, res) => {
  // Removes empty elements from class_desc and comment array for query purposes
  var classDesc = req.body.class_desc.filter(function(x){
    return (x !== (undefined || null || ''));
  });
  var comments = req.body.comments.filter(function(x){
    return (x !== (undefined || null || ''));
  });
  var sketches = req.body.sketches.filter(function(x){
    return (x !== (undefined || null || ''));
  });
  if(req.user.accesslevel == 1)
  {
    let query = db.query("SELECT employee_id FROM users WHERE name = ?", [req.body.employeelist], (err, results) => {
      var formOutput = {
        employee_id: results[0].employee_id,
        job_id:  req.body.jobList,
        date: req.body.date,
        class_desc: classDesc[0],
        bonus: req.body.bonusList,
        num_seats: req.body.seats,
        tip: req.body.tips,
        sketches: sketches[0],
        hrs_worked: 0, // ADD WORK HOURS
        comments: comments[0]
      }
      let sql = 'INSERT INTO timesheet SET ?';
      let query = db.query(sql, formOutput, (err, result) => {
        res.redirect('/home');
      }); 
    });
  }
  if(req.user.accesslevel == 0)
  {
    var formOutput = {
      employee_id: req.user.employee_id,
      job_id:  req.body.jobList,
      date: req.body.date,
      class_desc: classDesc[0],
      bonus: req.body.bonusList,
      num_seats: req.body.seats,
      tip: req.body.tips,
      sketches: sketches[0],
      hrs_worked: 0, // ADD WORK HOURS
      comments: comments[0]
    }
    let sql = 'INSERT INTO timesheet SET ?';
    let query = db.query(sql, formOutput, (err, result) => {
      res.redirect('/home');
    }); 
  }
});

router.get('/adduser', checkLoggedIn(), isManager(), (req, res) => {
  res.render('adduser', {
    isManager: req.user.accesslevel,
    sidebarName: (req.user.name)
  });
});

router.post('/adduser', (req, res) => {
  
  // Form validation
  req.checkBody('firstname', 'First name is required').notEmpty();
  req.checkBody('lastname', 'Last name is required').notEmpty();
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('pwconfirm', 'Please confirm password').notEmpty(); // TODO Validate confirm password = password

  var errors = req.validationErrors();
  if(errors) {
    res.render('adduser', {
      isManager: req.user.accesslevel,
      sidebarName: (req.user.name),
      errors: errors
    });
  } 
  
  else {
  // hash encrypts the password and stores the hash + salt
    var hash = bcrypt.hashSync(req.body.password, 10);
    let post = {
      name: req.body.firstname + " " + req.body.lastname,
      username: req.body.username,
      email: req.body.email,
      password: hash,
      accesslevel: req.body.accessrole
    };
    let sql = 'INSERT INTO users SET ?';
    let query = db.query(sql, post, (err, result) => {
      res.redirect('/home');
    }); 
  };
});

router.get('/logout', (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/login');
});

// Passport serialization and deserialization in session
passport.serializeUser(function(employee_id, done) {
  done(null, employee_id);
});

passport.deserializeUser(function(employee_id, done) {
    done(null, employee_id);
});

// Function checks if a user is logged into the system
// Must be placed in all routes that are not the login route
function checkLoggedIn() {
  return (req, res, next) => {
    if (req.isAuthenticated()) return next();

    res.redirect('/login');
  }
}

// Function checks if the user is a manager and permits access to
// pages that use this function
function isManager() {
  return (req, res, next) => {
    if (req.user.accesslevel) return next();

    res.redirect('/home');
  }
}

module.exports = router;
