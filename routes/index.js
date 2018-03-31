var express = require('express');
var router = express.Router();

// Routes should be in one file??
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/routetest', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
