const schedule = require('node-schedule');
const bch = require('bitcore-lib-cash');
const bchRPC = require('bitcoin-cash-rpc');
const base58check = require('base58check');
const cashaddr = require('cashaddrjs');
const bchaddr = require('bchaddrjs');
const shared = require('./shared').default;
const config = require('../../knexfile.js');
const knex = require('knex')(config);
const cost = 800000;

const env = process.env.NODE_ENV || 'development';

let host =
  env == 'production'
    ? process.env.RAZZLE_PROD_NODE_HOST
    : process.env.RAZZLE_NODE_HOST;

const bchNode = new bchRPC(
  host,
  process.env.RAZZLE_NODE_USERNAME,
  process.env.RAZZLE_NODE_PASSWORD,
  process.env.RAZZLE_NODE_PORT,
  3000
);
const genesisBlock = 563720;

class Transactions {
  async run() {
    schedule.scheduleJob('0-59/15 * * * * *', () => {
      this.registerJobs();
      //console.log('ran registerJobs on  ', Date());
    });
  }
  async calculateDiff(current) {
    let currentHeight = await bchNode.getBlockCount();

    let diff = current - genesisBlock + 101;
    return diff;
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
  async createCashAccount(body) {
    const { address, username } = body;
    let txString = await shared.generateTxString(address, username);
    let hex = await bchNode.signRawTransaction(txString);
    let txid = await bchNode.sendRawTransaction(hex.hex);
    return txid;
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
    const currentHeight = await bchNode.getBlockCount();
    return knex('Jobs')
      .select('number', 'username', 'blockheight')
      .where('blockheight', '>', currentHeight)
      .orderBy('blockheight', 'asc')
      .limit(125)
      .catch(er => {
        console.log('error getJobs', er);
      });
  }

  async getUncompletedJobs() {
    const currentHeight = await bchNode.getBlockCount();
    return knex('Jobs')
      .where('blockheight', '>', currentHeight)
      .where({ completed: false })
      .orderBy('blockheight', 'asc')
      .limit(250)
      .catch(er => {
        console.log('error getUncompletedJobs', er);
      });
  }

  async getRegistered() {
    const currentHeight = await bchNode.getBlockCount();
    return knex('Jobs')
      .select('username', 'number', 'registrationtxid', 'completed', 'address')
      .where('blockheight', '<=', currentHeight)
      .where({ completed: true })
      .orderBy('blockheight', 'desc')
      .limit(25)
      .catch(er => {
        console.log('error getUncompletedJobs', er);
      });
  }
  async registerJobs() {
    const currentHeight = await bchNode.getBlockCount();
    const jobs = await this.getUncompletedJobs();

    jobs.map(async x => {
      if (x.blockheight == currentHeight + 1) {
        //console.log('registering', x);
        if (x.paidwithtxid !== undefined || x.paidwithtxid !== null) {
          let txid = await this.createCashAccount(x);
          console.log('registered', `${x.username}#${x.number}`, txid);
          this.markCompleted(x.id, txid, x.blockheight);
        }
      }
    });

    // for (const each of jobs) {

    //   if (each.blockheight == currentHeight + 1) {
    //     //console.log('registering', each);
    //     if (each.paidwithtxid !== undefined || each.paidwithtxid !== null) {
    //       let txid = await this.createCashAccount(each);
    //       console.log('registered', `${each.username}#${each.number}`, txid);
    //       this.markCompleted(each.id, txid, each.blockheight);
    //     }
    //   }
    // }
    return;
  }

  async markCompleted(id, txid, blockheight) {
    blockheight = blockheight - 1;
    const blockHash = await bchNode.getBlockHash(blockheight);

    return knex('Jobs')
      .where({ id: id })
      .update({ registrationtxid: txid, completed: true, blockhash: blockHash })
      .catch(er => {
        console.log('error markCompleted', er);
      });
  }

  wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
      end = new Date().getTime();
    }
  }
}

let contain = new Transactions();
export default contain;
