const conf = require('../../config/config.js');
const env = process.env.NODE_ENV || 'development';
const config = require('../../knexfile.js');
const knex = require('knex')(config);

const { WalletClient, NodeClient } = require('bclient');
const { Network, ChainEntry } = require('bcash');
const network = Network.get('main');

const genesisBlock = 563720;

const walletOptions = {
  walletAuth: true,
  apiKey: conf.node.apiKey,
  host: conf.node.host,
  port: conf.node.walletPort,
  ssl: conf.node.ssl
};

const wid = conf.node.walletID;

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
    get a list of all accounts even outside project and their balances
    @param {int} mininum confs to be included in balance
    @param {boolean} watch only or not
    @return {obj} account name and balance
  */
  listUnspent(minconf = 0, maxconf = null, addresses = null) {
    return this.walletClient.execute('listunspent', [
      minconf,
      maxconf,
      addresses
    ]);
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
    create new change address for account.
    @return {obj} address details
  */
  generateChangeAddress(account) {
    return this.wallet.createChange(account);
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

  async validateBody(body) {
    let { address, blockheight, number, username, minNumber } = body;
    number = parseInt(number);

    if (address === undefined || address === '') {
      return { success: false, status: `missing address` };
    }
    if (username === undefined) {
      return { success: false, status: `missing username` };
    }

    if (number < minNumber) {
      return { success: false, status: `that block has been mined already` };
    }

    return { success: true };
  }
  async antiCheat(body) {
    let { uniqid, txid } = body;
    if (txid === undefined) {
      return { success: false, status: `missing txid` };
    }
    if (uniqid === undefined) {
      return { success: false, status: `missing uniqid` };
    }
    let exists = await this.checkExistingTx(txid);
    if (exists.length) {
      return {
        success: false,
        status: `transaction paid for a registration already`
      };
    }
    return { success: true };
  }
  async addJob(body) {
    let status = await this.validateBody(body);
    if (!status.success) {
      return status;
    }

    let cheatStatus = await this.antiCheat(body);
    if (!cheatStatus.success) {
      return cheatStatus;
    }
    const registerAt = parseInt(body.number) + genesisBlock - 100;

    return knex('Jobs')
      .insert({
        username: body.username,
        address: body.address,
        number: body.number,
        uniqid: body.uniqid,
        paidwithtxid: body.txid,
        blockheight: registerAt
      })
      .then(x => {
        delete body.jobs;
        delete body.usernameErr;
        delete body.numberErr;
        delete body.addressErr;
        delete body.success;
        console.log('job added for', body, 'at block', registerAt);
      })
      .catch(er => {
        console.log('error inserting job', er);
      });
  }
  async checkExistingTx(txid) {
    return knex('Jobs').where({ paidwithtxid: txid });
  }
}

let container = new Bcash();
export default container;
