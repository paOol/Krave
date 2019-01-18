import http from 'http';

let app = require('./server').default;
let shared = require('./classes/shared').default;

const conf = require('./../config/config.js');
const bsock = require('bsock');
const wid = conf.node.walletID;
const env = process.env.NODE_ENV || 'development';
let cost = env == 'production' ? 800000 : 800;
let walletSocket = bsock.connect(
  conf.node.walletPort,
  conf.node.host,
  conf.node.ssl
);
walletSocket.on('connect', async e => {
  try {
    await walletSocket.call('auth', conf.node.apiKey);

    console.log('Wallet - Attempting join ', wid);
    await walletSocket.call('join', wid);
  } catch (e) {
    console.log('Wallet - Connection Error:\n', e);
  }
});
walletSocket.on('disconnect', async e => {
  try {
    console.log('Wallet - closing connection ', wid);
    await walletSocket.call('leave', wid);
  } catch (e) {
    console.log('Wallet - disconnect Error:\n', e);
  }
});
const server = http.createServer(app);
const io = require('socket.io')(server);

io.on('connection', async client => {
  console.log('connected', client.conn.id);

  let resp;
  client.on('depositAddress', client => {
    console.log('client checking', client);
    resp = client;
  });

  client.on('disconnect', x => {
    console.log('disconnect x', x);
    //walletSocket.close();
  });

  walletSocket.bind('tx', async (wallet, tx) => {
    console.log('tx received', tx);
    console.log('ontx resp', resp);
    let txid = tx.hash;
    let outputs = tx.outputs;
    let msg;

    if (resp !== undefined) {
      //console.log('resp', resp);
      const match = outputs.find(x => x.address === resp.depositAddress);
      console.log('match', match);
      if (match !== undefined) {
        const utxo = match.value;
        if (utxo < cost) {
          msg = {
            success: false,
            status: `${utxo} satoshis was received, but the cost is 0.008 BCH`
          };
        } else {
          resp.txid = txid;
          let valid = await shared.addJob(resp);
          console.log('valid?', valid);
          if (valid.msg === undefined) {
            msg = {
              success: false,
              status: `${valid.status}`
            };
          } else {
            msg = {
              success: true,
              status: `Success! ${utxo} satoshis was received, and your username was reserved.`,
              txid: txid
            };
          }
        }
        resp = '';
        return client.emit('bcash', msg);
      }
    }
  });
});
let currentApp = app;

server.listen(process.env.PORT || 3000, error => {
  if (error) {
    console.log(error);
  }

  console.log('🚀 started');
});

if (module.hot) {
  console.log('✅  Server-side HMR Enabled!');

  module.hot.accept('./server', () => {
    console.log('🔁  HMR Reloading `./server`...');

    try {
      app = require('./server').default;
      server.removeListener('request', currentApp);
      server.on('request', app);
      currentApp = app;
    } catch (error) {
      console.error(error);
    }
  });
}
