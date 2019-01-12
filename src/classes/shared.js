const schedule = require('node-schedule');
const bch = require('bitcore-lib-cash');
const bchRPC = require('bitcoin-cash-rpc');
const base58check = require('base58check');
const cashaddr = require('cashaddrjs');
const bchaddr = require('bchaddrjs');
const config = require('../../knexfile.js');
const knex = require('knex')(config);

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

class Shared {
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
    let txString = await this.generateTxString(address, username);
    let hex = await bchNode.signRawTransaction(txString);
    let txid = await bchNode.sendRawTransaction(hex.hex);
    return txid;
  }

  async generateTxString(addr, username) {
    let paymentData = this.id_payment_data(addr);
    let payload = {
      alias: username,
      payment_data: paymentData
    };
    let script = this.build_script(payload);

    let unspent = await bchNode.listUnspent(1);
    if (unspent === undefined || unspent.length === 0) {
      await this.wait(200);
      unspent = await bchNode.listUnspent(0);
    }
    if (unspent === undefined || unspent.length === 0) {
      return { status: 'no UTXOs available' };
    }

    const rand = unspent[(Math.random() * unspent.length) | 0];
    if (rand === undefined || rand.length === 0) {
      console.log('no random UTXOs found');
      return { status: 'no random UTXOs available' };
    }

    const changeAddr = await bchNode.getRawChangeAddress();

    let tx = new bch.Transaction().from(rand).feePerKb(1002);
    tx.addOutput(new bch.Transaction.Output({ script: script, satoshis: 0 }));
    tx.change(changeAddr);

    return tx.toString();
  }

  async validateBody(body) {
    let { address, blockheight, number, username, minNumber } = body;
    number = parseInt(number);

    let currentHeight = await bchNode.getBlockCount();
    let diff = currentHeight - genesisBlock + 101;

    if (address === undefined || address === '') {
      return { success: false, status: `missing address` };
    }
    if (username === undefined) {
      return { success: false, status: `missing username` };
    }

    if (blockheight < currentHeight) {
      return { success: false, status: `blockheight for #${diff} expired` };
    }

    if (number < minNumber) {
      return { success: false, status: `that block has been mined already` };
    }

    return { success: true };
  }

  async checkExistingTx(txid) {
    return knex('Jobs').where({ paidwithtxid: txid });
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

  build_script(alias) {
    let data_map = {
      p2pkh: '01',
      p2sh: '02',
      p2pc: '03',
      p2sk: '04'
    };

    const s = new bch.Script();
    s.add(bch.Opcode.OP_RETURN);
    s.add(Buffer.from('01010101', 'hex'));
    s.add(Buffer.from(alias.alias, 'utf8'));

    for (let [key, value] of Object.entries(alias.payment_data)) {
      s.add(Buffer.from(data_map[key] + value, 'hex'));
    }
    return s;
  }

  s2h(script) {
    let parts = script
      .toString()
      .replace('OP_RETURN', '0x6a')
      .split(' ');
    let string = '';
    for (let p of parts) {
      if (p.indexOf('0x') === 0) {
        string += p.substring(2);
      } else {
        let hc = p.toString(16);
        if (hc.length % 2) hc = '0' + hc;
        string += hc;
      }
    }

    return string;
  }

  id_payment_data(pd) {
    if (typeof pd === 'string') pd = [pd];
    const id = {};

    for (let item of pd) {
      try {
        //p2pkh/p2sh
        const type = bchaddr.detectAddressType(item);
        id[type] = Buffer.from(
          cashaddr.decode(bchaddr.toCashAddress(item)).hash
        ).toString('hex');
        continue;
      } catch (err) {}

      try {
        //bip47 payment code
        const b58 = base58check.decode(item);
        if (b58.prefix.toString('hex') === '47' && b58.data.length == 80) {
          id['p2pc'] = b58.data.toString('hex');
          continue;
        }
      } catch (err) {}

      // failed to detect an address
      return false;
    }

    return id;
  }
  wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
      end = new Date().getTime();
    }
  }
}

let contain = new Shared();
export default contain;
