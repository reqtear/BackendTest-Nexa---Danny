var express = require('express');
var router = express.Router();
var methods = require("../methods")

/* GET home page. */
router.get('/', methods.ensureToken, (req, res, next) => {
  res.render('index', { title: 'Express' });
});

module.exports = router;
