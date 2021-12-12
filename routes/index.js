const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const qs = require('qs');
const userData = require('../data/users')
const { getData } = require('./whois');
require('dotenv').config();

const verifySignature = function (req) {
    const signature = req.headers['x-slack-signature'];
    const timestamp = req.headers['x-slack-request-timestamp'];
    const hmac = crypto.createHmac('sha256', process.env.SIGNING_SECRET);
    const requestBody = qs.stringify(req.body, { format: 'RFC1738' });

    const [version, hash] = signature.split('=');

    hmac.update(`${version}:${timestamp}:${requestBody}`);
    return hmac.digest('hex') === hash
};

/* GET home page. */
router.get('/', function (req, res, next) {
    res.send("OK");
});

/* POST home page. */
router.post('/', function (req, res, next) {
    const body = req.body;
    if (body) {
        if (verifySignature(req)) {
            getData(body).then(function (result) {
                // console.log(result);
                res.json(result);
            }).catch(function (err) {
                console.error("Failed to get data", err);
                res.sendStatus(500);
            });
        } else {
            console.error("Failed to verify slack signature")
            res.sendStatus(500);
        }
    }
});

/* GET user data. */
router.get('/users', function (req, res, next) {
    res.json(userData);
});

/* POST query users */
// curl -vv -H "Content-Type: application/json" -d '{"search": "leia"}' http://localhost:3333/users
router.post('/users', function (req, res, next) {
    const queryString = req.body?.search ?? ""
    res.json(userData.filter(e => [e.name, e.grewUp, e.slackId].map(e => e && e.toLowerCase().indexOf(queryString.toLowerCase()) >= 0).some(e => e))
    );
});

module.exports = router;
