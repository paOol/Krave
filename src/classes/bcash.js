const conf = require('../../config/config.js');
const env = process.env.NODE_ENV || 'development';

const { WalletClient, NodeClient } = require('bclient');
const bsock = require('bsock');
const { Network, ChainEntry } = require('bcash');
const network = Network.get('main');

const walletOptions = {
  network: conf.node.host,
  walletAuth: true,
  apiKey: conf.node.apiKey,
  host: conf.node.host,
  port: conf.node.walletPort,
  ssl: conf.node.ssl
};

const wid = conf.node.walletID;

let walletSocket = bsock.connect(
  conf.node.walletPort,
  conf.node.host,
  conf.node.ssl
);

walletSocket.on('connect', async e => {
  try {
    console.log('Wallet - Attempting auth');
    await walletSocket.call('auth', conf.node.apiKey);

    console.log('Wallet - Attempting join ', wid);
    await walletSocket.call('join', wid);
  } catch (e) {
    console.log('Wallet - Connection Error:\n', e);
  }
});

// walletSocket.bind('tx', (wallet, tx) => {
//   let outputs = tx.outputs;
//   console.log('tx', tx);
//   console.log('outputs', outputs);
//   console.log('wallet', wallet);

//   let utxo = outputs[0];
//   let bcash;
//   outputs.map(x => {
//     if (x.path !== undefined) {
//       bcash = x.path;
//     }
//   });

//   let obj = {
//     utxo: utxo,
//     bcash: bcash
//   };
//   console.log('event obj', obj);

//   // let bcashclass = new Bcash();
//   // bcashclass.addCredits(obj);
// });

/** Class representing Bcash. */

class Bcash {
  constructor() {
    if (!this.wallet) {
      this.walletClient = new WalletClient(walletOptions);
      this.wallet = this.walletClient.wallet(wid);
    }
  }

  getWalletWithToken(wid, token) {
    //token = `f376zbz9731bcec37c13238dcd87edb9d603ba07f73d8be2b2e446a0f26`;
    return this.walletClient.wallet(wid, token);
  }

  /*
    get all main wallets (project names),
    @return {array} ['primary','test','asdf']
  */
  getAllWalletIds() {
    return this.walletClient.getWallets();
  }

  /*
    get a list of all accounts even outside project and their balances
    @param {int} mininum confs to be included in balance
    @param {boolean} watch only or not
    @return {obj} account name and balance
  */
  listAllAccounts(minconf = 0, watchonly = false) {
    return this.walletClient.execute('listaccounts', [minconf, watchonly]);
  }

  /*
    List all account names for this project / wid
    @return {array} ['default','n23432','n453453']
  */
  getAllAccounts() {
    return this.wallet.getAccounts();
  }

  /*
    get a summary of the main wallet (project),
    @return {obj} wid, name, depth, token, balance
  */
  getMainWallet() {
    return this.wallet.getInfo();
  }

  /*
    get transaction details in the wallet account,
    @return {obj} transaction details
  */
  getTransactionDetails(hash) {
    return this.wallet.getTX(hash);
  }

  /*
    get pending transactions for project wallet
    @return {array} array of tx details
  */
  getUnconfirmeds() {
    return this.wallet.getPending();
  }

  /*
    get a summary of the wallet, receiveAddrs, changeAddr, accountKey, and balance
    @param {string} wallet id / bcash_id
    @return {obj} account name and balance
  */
  getAccount(account) {
    return this.wallet.getAccount(account);
  }

  /*
    Get balace for acount
    @param {string} account name
    @return {obj} tx count, unconfirmed and conf
  */
  getBalance(account) {
    return this.wallet.getBalance(account);
  }

  /*
    Get blocks with wallet txs
    @param {string} id
    @return {array}
    [ 1179720, 1179721, 1180146, 1180147, 1180148, 1180149 ]
  */
  getBlocksWithTxs() {
    return this.wallet.getBlocks();
  }

  /*
    remove transactions older than age
    @param {string} account
    @param {number} age in unix time (3600)
    @return {boolean} success msg
  */
  removePendingTxs(account, age = 3600) {
    return this.wallet.zap(account, age);
  }

  /*
    Derive new receiving address for account.
    @param {string} account
    @return {obj} pubkey, addr, etc.
  */
  generateNewAddr(account) {
    return this.wallet.createAddress(account);
  }

  /*
    get a list of all UTXO for project/wid
    @return {obj} value, address, tx hash.
  */
  getWalletUTXOs() {
    return this.wallet.getCoins();
  }

  /*
    get al ist of all UTXO for project/wid
    @return {obj} value, address, tx hash.
  */
  getUTXOsByTX(txid) {
    return this.wallet.getCoin(txid, 0);
  }

  /*
    get wallet transaction history
    @return {array} transactions.
  */
  getTXsforAccount(account) {
    return this.wallet.getHistory(account);
  }

  /*
    Get wallet private key (WIF format) by address
    @param {string} address
    @param {string} passphrase
    @return {obj} pubkey, addr, etc.
  */
  getPrivateKey(address, passphrase = null) {
    return this.wallet.getWIF(address, passphrase);
  }

  /*
    Get pub key and account name by address
    @param {string} Address - non prefixed bch address
    @return {obj}
    {
    "name": "n1001340632577",
    "account": 2,
    "branch": 1,
    "index": 0,
    "publicKey": "0225af09806a584aa30baae0cab7ac1625ac854945b030efd98897277140c58379",
    "script": null,
    "type": "pubkeyhash",
    "address": "bitcoincash:qqxrrjlcea424tp2u4huguper4td5s6tf5drnzhns3"
    }
  */
  getPubKeyByAddr(addr) {
    return this.wallet.getKey(addr);
  }

  /*
    clean all unsent transactions
  */
  async zapAllTxs() {
    let accounts = await this.getAllAccounts();
    for (const each of accounts) {
      await this.removePendingTxs(each, 7000);
      console.log('zapped all txs for', each);
    }
    let check = await this.getUnconfirmeds();
    if (check.length >= 1) {
      return 'error when attempting to zap all transactions';
    }
    return true;
  }

  async createWalletAccount(name) {
    let result;

    name = name.toString();
    const options = { name: name, type: 'pubkeyhash' };

    let wallet = await this.wallet;
    const info = await wallet.getInfo();
    //console.log('wallet info', info);
    try {
      result = await wallet.createAccount(name, options);
    } catch (e) {
      console.log('err in createWalletAccount', e);
    }
    if (result === undefined) {
      result = await wallet.getAccount(name);
    }
    return result;
  }

  async send(ctx, value, address) {
    const options = {
      rate: 1000,
      outputs: [{ value: value, address: address }]
    };
    let wallet = await this.wallet;

    const result = await wallet.send(options);
  }

  async createWalletID(id) {
    const result = await this.walletClient.createWallet(id);
    return result;
  }
}

let container = new Bcash();
export default container;
