let jwt = require('jsonwebtoken')
require('dotenv').config();
var crypto = require('crypto');
const db = require("./db_config");

module.exports.ensureToken = function (req, res, next) {
    var bearerHeader = req.headers["authorization"]
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(" ")
        const bearerToken = bearer[1]

        const sql = "SELECT * FROM admin_token WHERE token = '" + bearerToken + "'";

        db.query(sql, function (err, result) {
            if (err) {
                res.sendStatus(403)
            }

            let MySQLDate = String(result[0].expired_at);
            let expired_at = MySQLDate.replace(/[-]/g, '/');
            expired_at = new Date(Date.parse(expired_at));
            let now = new Date();

            if (now > expired_at) {
                const sql = `DELETE FROM admin_token WHERE token = '` + bearerToken + `'`;

                db.query(sql, function (err, result) { });
                return res.status(500).json("Token expired.");
            }
            else {
                res.locals.user_id = result[0].id_admin;
                next()
            }
        })
    } else {
        res.sendStatus(403)
    }
}

// Generate secret hash with crypto to use for encryption
const key = crypto
    .createHash('sha512')
    .update(process.env.AES_SECRET)
    .digest('hex')
    .substring(0, 32)
const encryptionIV = crypto
    .createHash('sha512')
    .update(process.env.AES_IV)
    .digest('hex')
    .substring(0, 16)

// Encrypt data
module.exports.encryptData = function (data) {
    const cipher = crypto.createCipheriv(process.env.ENCRYPTION_METHOD, key, encryptionIV)
    return Buffer.from(
        cipher.update(data, 'utf8', 'hex') + cipher.final('hex')
    ).toString('base64') // Encrypts data and converts to hex and base64
}

// Decrypt data
module.exports.decryptData = function (encryptedData) {
    const buff = Buffer.from(encryptedData, 'base64')
    const decipher = crypto.createDecipheriv(process.env.ENCRYPTION_METHOD, key, encryptionIV)
    return (
        decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
        decipher.final('utf8')
    ) // Decrypts data and converts to utf8
}