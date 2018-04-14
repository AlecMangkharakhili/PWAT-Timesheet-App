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
          db.query('SELECT employee_id,accesslevel FROM users WHERE username = ?', [checkLogin.username], (err, results) => {
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
  console.log(req.user);
  console.log(req.isAuthenticated());
  res.render('home');
});

router.get('/adduser', checkLoggedIn(), (req, res) => {
  res.render('adduser');
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

function checkLoggedIn() {
  return (req, res, next) => {
    if (req.isAuthenticated()) return next();

    res.redirect('/login');
  }
}

module.exports = router;
