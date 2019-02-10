const conf = require('../../config/config.js');
const env = process.env.NODE_ENV || 'development';
const config = require('../../knexfile.js');
const knex = require('knex')(config);
const shared = require('./shared').default;
const schedule = require('node-schedule');

const { WalletClient, NodeClient } = require('bclient');
const { Network, Script, Input, Output, Stack, Outpoint } = require('bcash');
const network = Network.get('main');

const genesisBlock = 563720;

const walletOptions = {
  walletAuth: true,
  apiKey: conf.node.apiKey,
  host: conf.node.host,
  port: conf.node.walletPort,
  ssl: conf.node.ssl
};
const clientOptions = {
  apiKey: conf.node.apiKey,
  host: conf.node.host,
  port: conf.node.clientPort
};

const wid = conf.node.walletID;

/** Class representing Bcash. */

class Bcash {
  constructor() {
    if (!this.wallet) {
      this.walletClient = new WalletClient(walletOptions);
      this.client = new NodeClient(clientOptions);
      this.wallet = this.walletClient.wallet(wid);
    }
  }
  async run() {
    schedule.scheduleJob('0-59/12 * * * * *', () => {
      this.registerJobs();
      //console.log('ran registerJobs on  ', Date());
    });

    schedule.scheduleJob('0 2 * * *', () => {
      // everyday 2am
      this.zapAllTxs();
    });
  }

  async createCashAccount(address, username) {
    let protocolCode = {
      p2pkh: '01',
      p2sh: '02',
      p2pc: '03',
      p2sk: '04'
    };

    let addressType = shared.id_payment_data(address);
    if (!addressType) {
      console.log('address:', address, ' invalid');
      return;
    }
    let protocolIdentifier = Buffer.from('01010101', 'hex');
    let accountName = Buffer.from(username, 'utf8');
    let paymentData;
    for (let [key, value] of Object.entries(addressType)) {
      paymentData = Buffer.from(protocolCode[key] + value, 'hex');
    }

    let script = new Script();
    script.pushSym('OP_RETURN');
    script.pushData(protocolIdentifier);
    script.pushData(accountName);
    script.pushData(paymentData);
    script.compile();

    let output = new Output();
    output.fromScript(script, 0);
    const options = {
      smart: true,
      rate: 1001,
      outputs: [output]
    };

    let txid = await this.wallet.send(options);
    return txid.hash;
  }

  /*
    get current block height
    @return {integer} 565028
  */
  getBlockCount(wid, token) {
    return this.client.execute('getblockcount');
  }
  /*
    get blockhash by height
    @return {string} "51726259de9560e1924f3cb554ad16e889b6170eb4d01d01f5a4ca8a81d1e318"
  */
  getBlockHash(blockheight) {
    return this.client.execute('getblockhash', [blockheight]);
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
    }
    console.log('zapped all txs on', Date());
    let check = await this.getUnconfirmeds();
    if (check.length >= 1) {
      return 'error when attempting to zap all transactions';
    }
    return true;
  }

  // creates account to generate unique deposit address
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

  async send(value, address) {
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

  async getRegistered() {
    const currentHeight = await this.getBlockCount();
    return knex('Jobs')
      .select(
        'username',
        'number',
        'registrationtxid',
        'completed',
        'blockhash'
      )
      .where('blockheight', '<=', currentHeight)
      .where({ completed: true })
      .orderBy('blockheight', 'desc')
      .limit(265)
      .catch(er => {
        console.log('error getUncompletedJobs', er);
      });
  }
  async registerJobs() {
    const currentHeight = await this.getBlockCount();
    const jobs = await this.getUncompletedJobs();

    jobs.map(async x => {
      if (x.blockheight == currentHeight) {
        console.log('updated blockhash', `${x.username}#${x.number}`);
        this.updateBlockHash(x.id, currentHeight);
      }
      if (x.blockheight == currentHeight + 1) {
        if (x.paidwithtxid !== undefined || x.paidwithtxid !== null) {
          if (!x.completed) {
            let txid = await this.createCashAccount(x.address, x.username);
            console.log('registered', `${x.username}#${x.number}`, txid);
            if (typeof txid === 'string') {
              this.markCompleted(x.id, txid);
            }
          }
        }
      }
    });
  }

  async getUncompletedJobs() {
    const currentHeight = await this.getBlockCount();
    return knex('Jobs')
      .where('blockheight', '>', currentHeight - 1)
      .where({ blockhash: null })
      .orderBy('blockheight', 'asc')
      .limit(250)
      .catch(er => {
        console.log('error getUncompletedJobs', er);
      });
  }

  async checkJob(body) {
    const maxLimit = 23;
    let status = await shared.validateBody(body);
    if (!status.success) {
      return status;
    }
    const count = await knex('Jobs')
      .where({
        blockheight: body.blockheight
      })
      .then(x => {
        return x.length;
      });
    if (count >= maxLimit) {
      return {
        success: false,
        status: `too many queued jobs for #${body.number}`
      };
    } else {
      return { success: true };
    }
  }

  async getJobs() {
    const currentHeight = await this.getBlockCount();
    return knex('Jobs')
      .select('number', 'username', 'blockheight')
      .where('blockheight', '>', currentHeight)
      .orderBy('blockheight', 'asc')
      .limit(125)
      .catch(er => {
        console.log('error getJobs', er);
      });
  }

  wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
      end = new Date().getTime();
    }
  }

  async updateBlockHash(id, blockheight) {
    const blockHash = await this.getBlockHash(blockheight);
    return knex('Jobs')
      .where({ id: id })
      .update({ blockhash: blockHash })
      .catch(er => {
        console.log('error markCompleted', er);
      });
  }

  async markCompleted(id, txid) {
    console.log('in marked completed');
    return knex('Jobs')
      .where({ id: id })
      .update({ registrationtxid: txid, completed: true })
      .catch(er => {
        console.log('error markCompleted', er);
      });
  }
}

let container = new Bcash();
export default container;
