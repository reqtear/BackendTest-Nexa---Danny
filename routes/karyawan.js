var express = require('express');
var router = express.Router();
var methods = require("../methods")
const db = require("../db_config");
var validator = require('validator');
const fs = require('fs');

router.get('/', methods.ensureToken, (req, res, next) => {
    if (validator.isEmpty(req.query.count)) {
        return res.status(400).json('count is required.');
    }

    if (!validator.isAlphanumeric(req.query.keyword)) {
        return res.status(400).json('Keyword must be alphanumeric');
    }

    if (validator.isEmpty(req.query.start)) {
        return res.status(400).json('start is required.');
    }

    if (!validator.isNumeric(req.query.count)) {
        return res.status(400).json('count must be numeric.');
    }

    if (!validator.isNumeric(req.query.start)) {
        return res.status(400).json('start must be numeric.');
    }

    var sql = "SELECT * FROM karyawan WHERE nama LIKE '%" + req.query.keyword + "%' LIMIT " + req.query.count + " OFFSET " + req.query.start;

    db.query(sql, (err, rows) => {
        if (err) {
            console.log(err)
            return res.status(500).json('Request data karyawan gagal.');
        }

        if (rows.length == 0) {
            return res.status(404).json('Data karyawan tidak ditemukan.');
        }

        res.send({
            ok: true,
            data: rows,
        })
    })
})

router.put('/update', methods.ensureToken, (req, res, next) => {
    if (validator.isEmpty(req.body.nip)) {
        return res.status(400).json('NIP is required.');
    }

    if (!validator.isNumeric(req.body.nip)) {
        return res.status(400).json('NIP must be numeric.');
    }

    if (!validator.isLength(req.body.nip, { min: 8, max: 8 })) {
        return res.status(400).json('NIP invalid length.');
    }

    if (req.body.nama && !validator.isAlphanumeric(req.body.nama)) {
        return res.status(400).json('Nama must be alphanumeric');
    }

    if (req.body.nama && !validator.isLength(req.body.nama, { min: 1, max: 200 })) {
        return res.status(400).json('Nama invalid length.');
    }

    if (req.body.alamat && !validator.isLength(req.body.alamat, { min: 1, max: 200 })) {
        return res.status(400).json('Alamat invalid length.');
    }

    if (req.body.gend && !validator.isIn(req.body.gend, ['L', 'P'])) {
        return res.status(400).json('Invalid Gender.');
    }

    if (req.body.tgl_lahir && !validator.isDate(req.body.tgl_lahir)) {
        return res.status(400).json('Birthdate must be in date format.');
    }

    var sql = "SELECT * FROM karyawan WHERE nip = '" + req.body.nip + "'";

    db.query(sql, (err, rows, fields) => {
        if (err) {
            return res.status(500).json('Update data karyawan gagal.');
        }
        if (rows.length == 0) {
            return res.status(404).json('Data karyawan tidak ditemukan.')
        }

        var base64Data = null;
        if (req.files) {
            const array_of_allowed_file_types = ['image/png', 'image/jpeg', 'image/jpg'];
            if (!array_of_allowed_file_types.includes(req.files.photo.mimetype)) {
                return res.status(400).json('photo file format is invalid.');
            }

            const allowed_file_size = 5;
            if ((req.files.photo.size / (1024 * 1024)) > allowed_file_size) {
                return res.status(400).json('photo too large (max 5mb).');
            }

            base64Data = "data:" + req.files.photo.mimetype + ";base64," + Buffer.from(req.files.photo.data).toString('base64')
        }

        var tgl_lahir = null;
        if (req.body.tgl_lahir) {
            tgl_lahir = new Date(req.body.tgl_lahir);
            tgl_lahir = tgl_lahir.toISOString().slice(0, 19).replace('T', ' ');
        }

        var update_at = new Date();
        update_at = update_at.toISOString().slice(0, 19).replace('T', ' ');

        var data = [
            req.body.nama ?? rows[0].nama,
            req.body.alamat ?? rows[0].alamat,
            req.body.gend ?? rows[0].gend,
            base64Data ?? rows[0].photo,
            tgl_lahir ?? rows[0].tgl_lahir,
            update_at,
            res.locals.user_id
        ]

        let sql = `UPDATE karyawan
                    SET nama = ?, alamat = ?, gend = ?, photo = ?, tgl_lahir = ?, update_at = ?, update_by = ?
                    WHERE nip = '`+ rows[0].nip + `'`;

        db.query(sql, data, (error, results, fields) => {
            if (error) {
                return res.status(500).json('Update data karyawan gagal');
            }

            res.send({
                ok: true,
                message: "Karyawan updated.",
            })
        });
    })
})

router.post('/add', methods.ensureToken, (req, res, next) => {
    if (validator.isEmpty(req.body.nip)) {
        return res.status(400).json('NIP is required.');
    }

    if (!validator.isNumeric(req.body.nip)) {
        return res.status(400).json('NIP must be numeric.');
    }

    if (!validator.isLength(req.body.nip, { min: 8, max: 8 })) {
        return res.status(400).json('NIP invalid length.');
    }

    if (validator.isEmpty(req.body.nama)) {
        return res.status(400).json('Nama is required.');
    }

    if (!validator.isAlphanumeric(req.body.nama)) {
        return res.status(400).json('Nama must be alphanumeric');
    }

    if (!validator.isLength(req.body.nama, { min: 1, max: 200 })) {
        return res.status(400).json('Nama invalid length.');
    }

    if (validator.isEmpty(req.body.alamat)) {
        return res.status(400).json('Alamat is required.');
    }

    if (!validator.isLength(req.body.alamat, { min: 1, max: 200 })) {
        return res.status(400).json('Alamat invalid length.');
    }

    if (validator.isEmpty(req.body.gend)) {
        return res.status(400).json('Gender is required.');
    }

    if (!validator.isIn(req.body.gend, ['L', 'P'])) {
        return res.status(400).json('Invalid Gender.');
    }

    if (!req.files.photo) {
        return res.status(400).json('photo is required.');
    }

    const array_of_allowed_file_types = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!array_of_allowed_file_types.includes(req.files.photo.mimetype)) {
        return res.status(400).json('photo file format is invalid.');
    }

    const allowed_file_size = 5;
    if ((req.files.photo.size / (1024 * 1024)) > allowed_file_size) {
        return res.status(400).json('photo too large (max 5mb).');
    }

    if (validator.isEmpty(req.body.tgl_lahir)) {
        return res.status(400).json('Birthdate is required.');
    }

    if (!validator.isDate(req.body.tgl_lahir)) {
        return res.status(400).json('Birthdate must be in date format.');
    }

    var sql = "SELECT nip FROM karyawan WHERE nip = '" + req.body.nip + "'";

    db.query(sql, (err, rows, fields) => {
        if (err) {
            return res.status(500).json('Create karyawan failed.');
        }

        if (rows.length > 0) {
            return res.status(400).json('NIP already exists.');
        }
        else {
            const base64Data = "data:" + req.files.photo.mimetype + ";base64," + Buffer.from(req.files.photo.data).toString('base64')

            var tgl_lahir = new Date(req.body.tgl_lahir);
            tgl_lahir = tgl_lahir.toISOString().slice(0, 19).replace('T', ' ');

            var insert_at = new Date();
            insert_at = insert_at.toISOString().slice(0, 19).replace('T', ' ');

            sql = `INSERT INTO karyawan (nip, nama, alamat, gend, photo, tgl_lahir, status, insert_at, insert_by, update_at, update_by) 
                    VALUES ('`+ req.body.nip + `', '` + req.body.nama + `','` + req.body.alamat + `','` + req.body.gend + `','` + base64Data + `','` + tgl_lahir + `',1,'` + insert_at + `','` + res.locals.user_id + `','` + insert_at + `','` + res.locals.user_id + `')`;

            db_res = db.query(sql, (err, rows) => {
                if (err) {
                    return res.status(500).json('Create karyawan failed.');
                }
                res.send({
                    ok: true,
                    message: "Karyawan created.",
                })
            });

        }
    });



});

router.post('/nonaktif', methods.ensureToken, (req, res, next) => {
    if (validator.isEmpty(req.body.nip)) {
        return res.status(400).json('NIP is required.');
    }

    if (!validator.isNumeric(req.body.nip)) {
        return res.status(400).json('NIP must be numeric.');
    }

    if (!validator.isLength(req.body.nip, { min: 8, max: 8 })) {
        return res.status(400).json('NIP invalid length.');
    }

    var sql = "SELECT * FROM karyawan WHERE nip = '" + req.body.nip + "'";

    db.query(sql, (err, rows, fields) => {
        if (err) {
            return res.status(500).json('Penonaktifan karyawan gagal.');
        }
        if (rows.length == 0) {
            return res.status(404).json('Data karyawan tidak ditemukan.')
        }

        let sql = `UPDATE karyawan
                    SET status = 9
                    WHERE nip = '`+ rows[0].nip + `'`;

        db.query(sql, (error, results, fields) => {
            if (error) {
                return res.status(500).json('Penonaktifan karyawan gagal.');
            }

            res.send({
                ok: true,
                message: "Karyawan berhasil di nonaktifkan.",
            })
        });
    })
})

module.exports = router;
