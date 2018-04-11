
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('home'); //RENDER USES THE PUG TEMPLATES
});

module.exports = router;