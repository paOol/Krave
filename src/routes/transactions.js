const env = process.env.NODE_ENV || 'development';
const express = require('express');
const axios = require('axios');
const router = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const shared = require('../classes/shared').default;
const bcash = require('../classes/bcash').default;

router.get('/blockheight', (req, res) => {
  let p = bcash.getBlockCount();
  p.then(x => {
    return res.status(200).send({ blocks: x });
  }).catch(err => {
    console.log('err', err);
    return res.status(500).send(err);
  });
});

router.get('/jobs', (req, res) => {
  let p = bcash.getJobs();
  p.then(x => {
    return res.status(200).send(x);
  }).catch(err => {
    console.log('err', err);
    return res.status(500).send(err);
  });
});

router.get('/registered', (req, res) => {
  let p = bcash.getRegistered();
  p.then(x => {
    return res.status(200).send(x);
  }).catch(err => {
    console.log('err', err);
    return res.status(500).send(err);
  });
});

router.post('/job', jsonParser, (req, res) => {
  let p = shared.addJob(req.body);
  p.then(x => {
    return res.status(200).send(x);
  }).catch(err => {
    console.log('err', err);
    return res.status(500).send(err);
  });
});

router.post('/check', jsonParser, (req, res) => {
  let p = bcash.checkJob(req.body);
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
