var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.redirect('/login');
});

router.get('/login', (req, res, next) => {
  res.render('login');
});

module.exports = router;
