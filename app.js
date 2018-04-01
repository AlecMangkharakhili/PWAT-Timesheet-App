const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mysql = require('mysql');
const expressValidator = require('express-validator');
require('dotenv').config();

// Initializes connection to database using environment variables
var connection = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Routes
var users = require('./routes/users');
var index = require('./routes/login');
var addUser = require('./routes/adduser');

var app = express();

// Middleware functions

// Express middleware
  // Middleware for form validation
app.use(expressValidator());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
//app.use('/routetest', users);
app.use('/adduser', addUser);

//Gets login from login page
app.get('/login', (req, res) => {
  console.log(req.body.username);
});

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

//DELETE THIS WHEN DEPLOYING TO EB
app.listen(3000, () => {
  console.log('Server started on localhost:3000');
});

module.exports = app;