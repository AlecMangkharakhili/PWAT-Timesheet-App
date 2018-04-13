var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var bcrypt = require('bcrypt');
var expressValidator = require('express-validator');

router.get('/', function(req, res, next) {
  res.redirect('/login');
});

router.get('/login', (req, res, next) => {
  res.render('login');
});

// Login authentication/render
router.post('/login', (req, res) => {

  const db = require('../db');

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
          res.redirect('/home');
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

router.get('/home', (req, res, next) => {
  res.render('home');
});

module.exports = router;
