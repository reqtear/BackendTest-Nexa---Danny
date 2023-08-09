var express = require('express');
var router = express.Router();
var methods = require("../methods")
const db = require("../db_config");
var validator = require('validator');

/* GET users listing. */
router.get('/', (req, res, next) => {
  const sql = "SELECT * FROM karyawan WHERE nip = '123123'";

  db.query(sql, function (err, result) {
    console.log(err, result)
  })
});

module.exports = router;
