const env = process.env.NODE_ENV || 'development';
const express = require('express');
const axios = require('axios');
const router = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const transactions = require('../classes/transactions').default;

router.get('/blockheight', (req, res) => {
  try {
    return axios
      .get(`${process.env.RAZZLE_RESTURL}/v1/control/getInfo`)
      .then(x => {
        return res.status(200).send({ blocks: x.data.blocks });
      });
  } catch (e) {
    console.log('err', e);
    return res.status(500).send(e);
  }
});

router.post('/create', jsonParser, (req, res) => {
  let { blockheight, number, username } = req.body;
  let valid = transactions.validateUserName(username);
  console.log('valid', valid);
  if (valid) {
    let p = transactions.createCashAccount(req.body);
    p.then(x => {
      return res.status(200).send(x);
    }).catch(err => {
      console.log('err', err);
      return res.status(500).send(err);
    });
  }
});

router.delete('/examples/:exampleID', (req, res) => {
  console.log('delete test');
  return res.status(200).send('test');
});

//export default router;
module.exports = router;
