const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mysql = require('mysql');
const expressValidator = require('express-validator');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Initializes connection to database using environment variables
var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if(err){
    throw err;
  }
  console.log('Connection successful');
});

// Routes
var users = require('./routes/users');
var index = require('./routes/login');
var addUser = require('./routes/adduser');

var app = express();

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

// Pulls information from create adduser page and inserts it into the DB
// POSTS user information into the database
app.post('/users/add', (req, res) => {
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
  let query = connection.query(sql, post, (err, result) => {
    console.log(result);
  });
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