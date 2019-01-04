const env = process.env.NODE_ENV || 'development';
const express = require('express');
const axios = require('axios');
const router = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const bcashClass = require('../classes/bcash').default;

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
  let valid = bcashClass.validateHeight(req.body);
  console.log('valid', valid);
  return res.status(200).send(valid);
});

router.delete('/examples/:exampleID', (req, res) => {
  console.log('delete test');
  return res.status(200).send('test');
});

//export default router;
module.exports = router;
