import React from 'react';
import axios from 'axios';
import localStorage from 'store';
import { QRCode } from 'react-qr-svg';
import uniqid from 'uniqid';

const BITBOXSDK = require('bitbox-sdk/lib/bitbox-sdk').default;
const BITBOX = new BITBOXSDK();
var socket;

class Payments extends React.Component {
  state = {
    uniqid: '',
    depositAddress: '',
    amount: '',
    transactionResponse: '',
    error: ''
  };

  assignUniqid = async () => {
    let uniqid = await uniqid();
    localStorage.set('user', { id: uniqid });
    return uniqid;
  };

  generateAddress = uniqid => {
    axios.post(`api/address`, { uniqid: uniqid }).then(x => {
      this.setState({
        depositAddress: x.data
      });
    });
  };

  componentDidMount() {
    let uniqid = localStorage.get('user').id;
    if (uniqid === undefined) {
      uniqid = this.assignUniqid();
    }
    this.setState({ uniqid: uniqid });
    if (this.props.jobStatus) {
      if (typeof window.web4bch !== 'undefined') {
        let web4bch = new window.Web4Bch(window.web4bch.currentProvider);
        this.setState({ web4bch: web4bch });
      }
      this.generateAddress(uniqid);

      socket = new BITBOX.Socket({
        restURL: 'https://datnode.com'
      });
      socket.listen('transactions', message => {
        this.handleNewTx(message);
      });
    }
  }

  handleNewTx = msg => {
    const { amount, depositAddress, uniqid } = this.state;
    const json = JSON.parse(msg);
    const outputs = json.outputs;
    let txid = json.format.txid;

    const addresses = this.getOutputAddresses(outputs);

    addresses.forEach(a => {
      let key = Object.keys(a)[0];

      if (key !== undefined) {
        let cashAddr = BITBOX.Address.toCashAddress(key);
        if (cashAddr === depositAddress) {
          if (a[key].value <= 0.0000008) {
            this.setState({
              error: 'amount received was less than 0.008 BCH'
            });
          } else {
            this.setState({
              amount: a[key].value,
              transactionResponse: txid
            });
            this.props.paymentReceived(uniqid, txid);
          }
        }
      }
    });
  };

  getOutputAddresses = outputs => {
    const addresses = outputs.reduce((prev, curr, idx) => {
      const txid = curr.scriptPubKey.hex;
      const addressArray = curr.scriptPubKey.addresses;
      const value = BITBOX.BitcoinCash.toBitcoinCash(curr.satoshi);
      const ret = addressArray.reduce((prev, curr, idx) => {
        return { ...prev, [curr]: { value } };
      }, {});
      return [...prev, { ...ret }];
    }, []);

    return addresses;
  };

  payWithBadger = amount => {
    let { web4bch, depositAddress, uniqid } = this.state;
    if (typeof window.web4bch === undefined) {
      window.open('https://badgerwallet.cash/#/install');
    } else {
      let transaction = {
        to: depositAddress,
        from: web4bch.bch.defaultAccount,
        value: amount
      };

      web4bch.bch.sendTransaction(transaction, (err, txid) => {
        if (err) {
          console.log(';err', err);
          return;
        }
        this.setState({
          amount: amount,
          transactionResponse: txid
        });

        this.props.paymentReceived(uniqid, txid);
      });
    }
  };

  render() {
    const { depositAddress, error, transactionResponse } = this.state;
    const { number, username } = this.props;
    const cost = 800000;

    return (
      <div className="wrapper centered">
        {transactionResponse ? (
          <div>
            success. you can view the tx here
            <a
              target="_blank"
              rel="nofollow"
              href={`https://blockchair.com/bitcoin-cash/transaction/${transactionResponse}`}
            >
              {transactionResponse}
            </a>
          </div>
        ) : (
          <div>
            <h2>{`${username}#${number}`} is available! </h2>
            <QRCode value={depositAddress} style={{ width: 200 }} />
            claim this Cash Account by sending 0.008 BCH to <br />
            <a href={`${depositAddress}`}>{depositAddress}</a>
            <br />
            <button
              onClick={() => {
                this.payWithBadger(cost);
              }}
            >
              <p>pay 0.008 BCH with Badger</p>
            </button>
            {error && <div className="error">{error}</div>}
          </div>
        )}
      </div>
    );
  }
}

export default Payments;
