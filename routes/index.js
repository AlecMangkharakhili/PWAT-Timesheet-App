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

// TODO
// ALLOW MANAGERS TO SORT BY USER, ASC/DESC AND DATE
// CREATE NONMANAGER PAGE

router.get('/home', checkLoggedIn(), (req, res, next) => {
  var rowName = ['Name', 'Job', 'Date', 'Class Description', 'Bonus', '# of Seats', 'Tip', 'Hours Worked', 'Comments'];
  if (req.user.accesslevel = 1)
  {
    db.query('SELECT users.name, timesheet.job_id, timesheet.date, timesheet.class_desc, timesheet.bonus, timesheet.num_seats, timesheet.tip, timesheet.hrs_worked, timesheet.comments FROM timesheet JOIN users ON timesheet.employee_id = users.employee_id ORDER BY date DESC;', (err, results) => {
      var rowArr = [];
      var timesheetArr = [];
      for (let i = 0; i < results.length; i++)
        {
          let dateFmat = new Date(results[i].date);
          dateFmat = dateFmat.toISOString().substring(0, 10);
          rowArr.push(results[i].name);
          rowArr.push(results[i].job_id);
          rowArr.push(dateFmat);
          rowArr.push(results[i].class_desc);
          if (results[i].bonus == "NULL")
          {
            rowArr.push("None");
          }
          else
          {
            rowArr.push(results[i].bonus);
          }
          rowArr.push(results[i].num_seats);
          rowArr.push('$' + results[i].tip);
          rowArr.push(results[i].hrs_worked);
          rowArr.push(results[i].comments);
          timesheetArr.push(rowArr);
          rowArr = [];
        }
      res.render('home', {
        isManager: req.user.accesslevel,
        sidebarName: (req.user.name),
        timesheetRows: rowName,
        timesheetData: timesheetArr
      });
    });
  }
});

router.post('/entrydelete', checkLoggedIn(), (req, res, next) => {
  var timesheetObj = entryArrToObjArr(req.body['values']);
  console.log(timesheetObj);
  for (let i = 0; i < timesheetObj.length; i++)
  {
    db.query('SELECT employee_id FROM users WHERE name = ?', [timesheetObj[i].name], (err, results) => {
      timesheetObj[i].name = String(results[0].employee_id);
      if (timesheetObj[i].desc == "")
      {
        var params = [timesheetObj[i].name, timesheetObj[i].job, timesheetObj[i].date, timesheetObj[i].hrs];
        console.log(params);
        db.query('DELETE FROM timesheet WHERE employee_id = ? AND job_id = ? AND date = ? AND hrs_worked = ? AND class_desc IS NULL', params, (err, res) => {
          console.log(res);
          console.log(err);
        })
      }
      if (timesheetObj[i].hrs == "")
      {
        var params = [timesheetObj[i].name, timesheetObj[i].job, timesheetObj[i].date, timesheetObj[i].desc];
        console.log(params);
        db.query('DELETE FROM timesheet WHERE employee_id = ? AND job_id = ? AND date = ? AND class_desc = ? AND hrs_worked IS NULL', params, (err, res) => {
          console.log(res);
          console.log(err);
        })
      }
    });
  }
  res.redirect('/home');
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

  // Figure out a way to validate time without required keyword in html
  var workHrs = timeConversion(req.body.timein, req.body.timeout);

  // Fixes query failure do to workHrs being assigned NaN with jobs that don't need workHrs
  if (isNaN(workHrs))
  {
    workHrs = null;
  }

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
        hrs_worked: workHrs,
        comments: comments[0]
      }
      console.log(formOutput);
      let sql = 'INSERT INTO timesheet SET ?';
      let query = db.query(sql, formOutput, (err, result) => {
        console.log(err);
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
      hrs_worked: workHrs,
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

// Parses the array from timesheet deletion selections and returns an array of objects
// Objects consist of name, job, date, and description for precise querying
function entryArrToObjArr(sheetStr) {

  // Removes double quote marks from string for querying purposes and removes bracket from beginning and end of the string
  var arr = sheetStr.slice(1, -1).replace(/['"]+/g, '').split(",");
  var outArr = [];

  while(arr.length != 0)
  {
    var inName = arr.shift();
    var inJob = arr.shift();
    var inDate = arr.shift();
    var inDesc = arr.shift(); 

    arr.splice(0, 3);

    var inHrs = arr.shift();

    arr.splice(0, 1);

    var queryObj = {
      name: inName,
      job: inJob,
      date: inDate,
      desc: inDesc,
      hrs: inHrs
    }

    outArr.push(queryObj);
  }

  return outArr;
}

// Time conversion function for time worked
function timeConversion(timeIn, timeOut) {
  var convTimeIn = timeIn.split(':');
  var convTimeOut = timeOut.split(':');
  var inHr = parseInt(convTimeIn[0]);
  var inMin = parseInt(convTimeIn[1]);
  var outHr = parseInt(convTimeOut[0]);
  var outMin = parseInt(convTimeOut[1]);
  var inTot = (inHr * 60 * 60) + (inMin * 60);
  var outTot = (outHr * 60 * 60) + (outMin * 60);

  // Timeworked is in seconds
  var timeWorked = outTot - inTot;
  var hours = timeWorked / 3600;
  
  return hours;
}

module.exports = router;
