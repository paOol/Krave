import React from 'react';
import axios from 'axios';
import localStorage from 'store';
import { QRCode } from 'react-qr-svg';
import uniqid from 'uniqid';

const BITBOXSDK = require('bitbox-sdk/lib/bitbox-sdk').default;
const BITBOX = new BITBOXSDK();
var socket;
let cost = 800000;

class Payments extends React.Component {
  state = {
    uniqid: '',
    depositAddress: '',
    amount: '',
    transactionResponse: '',
    error: ''
  };

  assignUniqid = () => {
    let rand = uniqid();
    localStorage.set('user', { id: rand });
    return rand;
  };

  generateAddress = uniqid => {
    return axios
      .post(`api/address`, { uniqid: uniqid })
      .then(x => {
        return this.setState({
          depositAddress: x.data
        });
      })
      .catch(err => {
        console.log('err', err);
      });
  };

  componentDidMount() {
    const uniqid = this.assignUniqid() || 'placeholder';
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

    return (
      <div className="wrapper centered">
        {transactionResponse ? (
          <Response
            amount={this.state.amount}
            transactionResponse={transactionResponse}
          />
        ) : (
          <div className="qr">
            <h2>{`${username}#${number}`} is available! </h2>
            <QRCode value={depositAddress} style={{ width: 200 }} />
            <p>claim this Cash Account by sending 0.008 BCH to </p>
            <br />
            <a
              onClick={() => {
                navigator.clipboard.writeText(depositAddress);
              }}
              href={`${depositAddress}`}
            >
              {depositAddress}
            </a>
            <div
              className="copy"
              onClick={() => {
                navigator.clipboard.writeText(depositAddress);
              }}
            >
              click to copy
            </div>
            <br />
            <div
              className="submit"
              onClick={() => {
                this.payWithBadger(cost);
              }}
            >
              <p>pay with Badger</p>
            </div>
            {error && <div className="error">{error}</div>}
            <small style={{ color: '#93a1ad' }}>
              Cost is around $1 and is in place to prevent spammers from filling
              up the 25 possible slots per block.
            </small>
          </div>
        )}
      </div>
    );
  }
}

class Response extends React.Component {
  refresh = () => {
    window.location.reload();
  };
  toSatoshis(n) {
    var result = n - Math.floor(n) !== 0;
    if (result) {
      return n * 100000000;
    }
    return n;
  }
  render() {
    let { amount, transactionResponse } = this.props;
    let newamount = this.toSatoshis(amount);
    let newcost = this.toSatoshis(cost);

    if (newamount >= newcost) {
      return (
        <div className="success">
          <h2>
            success! <br />
            you can view the tx &nbsp;
            <a
              target="_blank"
              rel="nofollow"
              href={`https://blockchair.com/bitcoin-cash/transaction/${transactionResponse}`}
            >
              here
            </a>
          </h2>
          <h4>
            Click <span onClick={this.refresh}> here</span> to register another.
          </h4>
        </div>
      );
    } else if (newamount < newcost) {
      return (
        <div className="error">
          <h2>
            Error! <br />
            The amount sent was under 0.008 BCH.
          </h2>
          <h4>
            Click <span onClick={this.refresh}> here</span> to try again.
          </h4>
        </div>
      );
    }
  }
}
export default Payments;
