const env = process.env.NODE_ENV || 'development';
const express = require('express');
const axios = require('axios');
const router = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const transactions = require('../classes/transactions').default;
const bcash = require('../classes/bcash').default;

console.log('environment: ', env);
let url =
  env == 'production'
    ? process.env.RAZZLE_PRODRESTURL
    : process.env.RAZZLE_RESTURL;

router.get('/blockheight', (req, res) => {
  try {
    return axios.get(`${url}/v1/control/getInfo`).then(x => {
      return res.status(200).send({ blocks: x.data.blocks });
    });
  } catch (e) {
    console.log('err', e);
    return res.status(500).send(e);
  }
});

router.get('/jobs', (req, res) => {
  let p = transactions.getJobs();
  p.then(x => {
    return res.status(200).send(x);
  }).catch(err => {
    console.log('err', err);
    return res.status(500).send(err);
  });
});

router.get('/registered', (req, res) => {
  let p = transactions.getRegistered();
  p.then(x => {
    return res.status(200).send(x);
  }).catch(err => {
    console.log('err', err);
    return res.status(500).send(err);
  });
});

router.post('/job', jsonParser, (req, res) => {
  let p = transactions.addJob(req.body);
  p.then(x => {
    return res.status(200).send(x);
  }).catch(err => {
    console.log('err', err);
    return res.status(500).send(err);
  });
});

router.post('/check', jsonParser, (req, res) => {
  let p = transactions.checkJob(req.body);
  p.then(x => {
    return res.status(200).send(x);
  }).catch(err => {
    console.log('err', err);
    return res.status(500).send(err);
  });
});

router.post('/address', jsonParser, (req, res) => {
  let { uniqid } = req.body;
  let p = bcash.createWalletAccount(uniqid);
  p.then(x => {
    return res.status(200).send(x.receiveAddress);
  }).catch(err => {
    console.log('err', err);
    return res.status(500).send(err);
  });
});

router.delete('/examples/:exampleID', (req, res) => {
  console.log('delete test');
  return res.status(200).send('test');
});

//export default router;
module.exports = router;
