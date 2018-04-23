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
          db.query('SELECT employee_id,accesslevel,first_name,last_name FROM users WHERE username = ?', [checkLogin.username], (err, results) => {
            req.login(results[0], (err) => {
              console.log(results[0]);
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

router.get('/logout', (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/login');
});

router.get('/home', checkLoggedIn(), (req, res, next) => {
  res.render('home', {
    isManager: req.user.accesslevel,
    sidebarName: (req.user.first_name + " " + req.user.last_name)
  });
});

router.get('/adduser', checkLoggedIn(), isManager(), (req, res) => {
  res.render('adduser', {
    isManager: req.user.accesslevel,
    sidebarName: (req.user.first_name + " " + req.user.last_name)
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
      sidebarName: (req.user.first_name + " " + req.user.last_name),
      errors: errors
    });
  } 
  
  else {
  // hash encrypts the password and stores the hash + salt
    var hash = bcrypt.hashSync(req.body.password, 10);
    let post = {
      first_name: req.body.firstname,
      last_name: req.body.lastname,
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

// Passport serialization and deserialization in session
passport.serializeUser(function(employee_id, done) {
  done(null, employee_id);
});

passport.deserializeUser(function(employee_id, done) {
    done(null, employee_id);
});

// Function checks if a user is logged into the system
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
