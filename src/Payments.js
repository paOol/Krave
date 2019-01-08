import React from 'react';
import axios from 'axios';
import localStorage from 'store';
import { QRCode } from 'react-qr-svg';
import uniqid from 'uniqid';
import openSocket from 'socket.io-client';

const socketio = openSocket('http://localhost:4646');
let cost = 800000;

class Payments extends React.Component {
  state = {
    uniqid: '',
    depositAddress: '',
    transactionResponse: '',
    socketResponse: '',
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
        let obj = {
          ...this.props.data,
          depositAddress: x.data,
          uniqid: uniqid
        };
        socketio.emit('depositAddress', obj);
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

      socketio.on('bcash', x => {
        this.setState({
          socketResponse: x
        });
      });
    }
  }

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
      });
    }
  };

  render() {
    const { depositAddress, error, socketResponse } = this.state;
    const { number, username, paymentReceived } = this.props;

    return (
      <div className="wrapper centered">
        {socketResponse ? (
          <Response
            amount={this.state.amount}
            socketResponse={socketResponse}
            paymentReceived={paymentReceived}
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

  render() {
    let { socketResponse } = this.props;

    if (socketResponse.success) {
      this.props.paymentReceived();
      return (
        <div className="success">
          <h2>
            {socketResponse.status}
            <br />
            you can view the tx &nbsp;
            <a
              target="_blank"
              rel="nofollow"
              href={`https://blockchair.com/bitcoin-cash/transaction/${
                socketResponse.txid
              }`}
            >
              here
            </a>
          </h2>
          <h4>
            Click <span onClick={this.refresh}> here</span> to register another.
          </h4>
        </div>
      );
    } else {
      return (
        <div className="error">
          <h2>
            Error! <br />
            {socketResponse.status}
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
