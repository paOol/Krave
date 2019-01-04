const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const transactions = require('./transactions');
if (process.env.NODE_ENV !== 'production') {
}

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.use('/api', transactions);

module.exports = router;
