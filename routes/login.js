
var express = require('express');
var router = express.Router();

/* GET login page. */
router.get('/', function(req, res, next) {
  res.render('login'); //RENDER USES THE PUG TEMPLATES
});

module.exports = router;