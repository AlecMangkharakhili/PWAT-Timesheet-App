
var express = require('express');
var router = express.Router();

/* GET login page. */
router.get('/', function(req, res, next) {
  res.render('adduser'); //RENDER USES THE PUG TEMPLATES
});

router.post('/', (req, res, next) => {
  console.log(res.body.first-name);
});

module.exports = router;