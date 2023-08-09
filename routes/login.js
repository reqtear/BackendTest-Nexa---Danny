var express = require("express")
var router = express.Router()
var jwt = require("jsonwebtoken")
require('dotenv').config();
var validator = require('validator');
const db = require("../db_config");
var methods = require("../methods");

router.post('/', (req, res, next) => {
    let p_username = req.body.username
    let p_password = req.body.password

    if (validator.isEmpty(p_username) || validator.isEmpty(p_password)) {
        return res.status(400).json('Username & Password is required.');
    }

    var enc_pass = methods.encryptData(p_password);

    const sql = "SELECT * FROM admin WHERE username = '" + p_username + "'";

    db.query(sql, function (err, result) {
        if (err) {
            return res.status(404).json('User not found.');
        }

        if (result[0].password != enc_pass) {
            return res.status(404).json('Wrong Password.');
        }

        const data = methods.encryptData(p_username + enc_pass);

        var token = jwt.sign(
            { data: data },
            process.env.JWT_SECRET,
            (err, token) => {
                var date = new Date();
                date.setDate(date.getDate() + 7);
                date = date.toISOString().slice(0, 19).replace('T', ' ');

                const sql = `INSERT INTO admin_token (id_admin, token, expired_at) 
            VALUES ('`+ result[0].id + `', '` + token + `','` + date + `')`;

                db.query(sql, function (err, result) {
                    if (!err) {
                        res.send({
                            ok: true,
                            message: "Login successful",
                            token: token
                        })
                    }
                    else {
                        console.log(err)
                        return res.status(500).json("Token creation failed.");
                    }
                });

            })
    });
})
module.exports = router;