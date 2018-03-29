/*ROUTES ARE THE DIFFERENT PAGES*/

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' }); //RENDER USES THE PUG TEMPLATES
});

module.exports = router;
