import React from 'react';
import axios from 'axios';
import { QRCode } from 'react-qr-svg';
import uniqid from 'uniqid';
import io from 'socket.io-client';
import localStorage from 'store';
require('events').EventEmitter.prototype._maxListeners = 100;
const env = process.env.NODE_ENV || 'development';
let cost = env == 'production' ? 800000 : 800;

class Payments extends React.Component {
  state = {
    uniqid: '',
    socket: '',
    depositAddress: '',
    socketResponse: localStorage.get('response')
  };
  assignUniqid = () => {
    let rand = uniqid();
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
        delete obj.jobs;
        delete obj.success;
        delete obj.txid;
        this.state.socket.emit('depositAddress', obj);

        return this.setState({
          depositAddress: x.data
        });
      })
      .catch(err => {
        console.log('err', err);
      });
  };

  componentDidMount() {
    if (this.props.jobStatus) {
      const uniqid = this.assignUniqid() || 'placeholder';
      const socketio = io();
      this.setState({ uniqid: uniqid, socket: socketio });

      if (typeof window.web4bch !== 'undefined') {
        let web4bch = new window.Web4Bch(window.web4bch.currentProvider);
        this.setState({ web4bch: web4bch });
      }
      this.generateAddress(uniqid);

      socketio.on('bcash', x => {
        if (x.success) {
          localStorage.set('response', x);
        }
        this.setState({
          socketResponse: x
        });
      });
    }
  }

  closeSocket = () => {
    console.log('closing', this.state.socket.close());
  };
  componentWillUnmount() {
    //this.state.socket.close();
  }

  payWithBadger = amount => {
    let { web4bch, depositAddress, uniqid } = this.state;
    if (typeof window.web4bch === 'undefined') {
      const win = window.open('https://badger.bitcoin.com/', '_blank');
      win.focus();
    } else {
      if (!web4bch.bch.defaultAccount) {
        alert('please unlock your badgerwallet');
      }
      let transaction = {
        to: depositAddress,
        from: web4bch.bch.defaultAccount,
        value: amount
      };

      web4bch.bch.sendTransaction(transaction, (err, txid) => {
        if (err) {
          console.log('err', err);
          return;
        }
      });
    }
  };

  render() {
    const { depositAddress, socketResponse } = this.state;
    let { number, username, paymentReceived, jobStatus } = this.props;

    if (jobStatus !== true) {
      return (
        <div className="wrapper centered">
          <div className="qr">
            <h2>
              That username is unavailble or the number is no longer available.
            </h2>
            <p>Please edit and try again.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="wrapper centered">
        {socketResponse ? (
          <Response
            amount={this.state.amount}
            socketResponse={socketResponse}
            paymentReceived={paymentReceived}
            closeSocket={this.closeSocket}
          />
        ) : (
          <div className="qr">
            <h2>{`${username}#${number}`} is available! </h2>
            <QRCode
              value={`${depositAddress}?amount=0.008`}
              style={{ width: 200 }}
            />
            <p>claim this Cash Account by sending 0.008 BCH to </p>
            <br />
            <a
              onClick={() => {
                navigator.clipboard.writeText(depositAddress);
              }}
              href={`${depositAddress}?amount=0.008`}
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
    localStorage.remove('response');
    window.location.reload();
  };
  render() {
    let { socketResponse } = this.props;

    if (socketResponse.success) {
      this.props.paymentReceived(socketResponse);
      this.props.closeSocket;
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
