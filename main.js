const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Validator Packages
const expressValidator = require('express-validator');

// Database Packages
const mysql = require('mysql');

// Authentication Packages
const bcrypt = require('bcrypt');
const passport = require('passport');
const session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

// Environment Variables
require('dotenv').config();

// Middleware for form validation
var app = express();
app.use(expressValidator());

var index = require('./routes/index');

var options = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  checkExpirationInterval: 1000 * 60 * 30, // Check for expired sessions every 30 minutes
  expiration: 1000 * 60 * 30 // Expire session cookie in 30 minute
};

var sessionStore = new MySQLStore(options);

app.use(session({
  secret: 'changethistorandomstringlater',
  resave: false,
  store: sessionStore,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 1000 * 60 * 30 // Set max age for cookies to 30 minute
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;