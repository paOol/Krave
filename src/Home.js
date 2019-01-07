import React from 'react';
import Upcoming from './Upcoming';
import Payments from './Payments';
import Registered from './Registered';
const axios = require('axios');
const utils = require('./utils').default;

class Home extends React.Component {
  state = {
    blockheight: '',
    address: '',
    minNumber: '',
    username: '',
    number: '',
    usernameErr: '',
    numberErr: '',
    addressErr: '',
    jobStatus: '',
    jobs: '',
    uniqid: '',
    txid: '',
    success: false
  };

  getBlockHeight = () => {
    axios.get(`api/blockheight`).then(x => {
      let minNumber = utils.calculateDiff(x.data.blocks);
      this.setState({
        blockheight: x.data.blocks,
        minNumber: minNumber
      });
    });
  };

  getJobs = () => {
    axios.get(`api/jobs`).then(x => {
      this.setState({
        jobs: x.data
      });
    });
  };

  checkAvailability = () => {
    axios.post(`api/check`, this.state).then(x => {
      this.setState({
        jobStatus: x.data.success ? x.data.success : x.data.status
      });
    });
  };

  paymentReceived = (uniqid, txid) => {
    this.setState({ uniqid: uniqid, txid: txid });
    return axios.post(`api/job`, this.state).then(x => {
      this.setState({
        success: true
      });
      this.getJobs();
    });
  };

  validateForm = e => {
    let { value, id } = e.target;
    let valid, field;
    if (id === 'username') {
      field = 'username';
      valid = utils.validateUserName(value);
    }
    if (id === 'number') {
      field = 'number';
      valid = utils.validateNumber(value, this.state.minNumber);
    }
    if (id === 'address') {
      field = 'address';
      valid = utils.validateBchAddress(value);
    }
    this.setState({ [field]: value });
    if (value.length > 2) {
      if (valid.status !== undefined) {
        this.setState({ [`${field}Err`]: valid.status });
      } else {
        this.setState({ [`${field}Err`]: '' });
      }
    }
  };

  componentDidMount() {
    this.getBlockHeight();
    this.getJobs();
  }

  render() {
    let {
      blockheight,
      minNumber,
      usernameErr,
      numberErr,
      addressErr,
      username,
      number,
      address,
      jobStatus,
      jobs
    } = this.state;
    return (
      <div className="wrapper">
        <div className="centered">
          <h1>Krave</h1>
          <h3>
            Cash account numbers go up as each block is mined. Once a
            blockheight has passed, that alias is gone forever. Not everyone is
            available to time the one they want. That's where Krave comes in.
          </h3>
        </div>
        <div className="container">
          <form>
            <label for="username">Desired Username</label>
            <input onChange={this.validateForm} id="username" type="text" />
            {usernameErr && <aside className="error"> {usernameErr}</aside>}
            <label for="number">Desired number</label>
            <input onChange={this.validateForm} id="number" type="number" />
            {numberErr && <aside className="error"> {numberErr}</aside>}
            <small>
              Note: only cash accounts between #{minNumber} and #
              {minNumber + 400} are available currently
            </small>
            <label for="address">Your BCH address</label>
            <input onChange={this.validateForm} id="address" type="text" />
            {addressErr && <aside className="error"> {addressErr}</aside>}
          </form>
        </div>
        {username !== '' &&
        usernameErr === '' &&
        address !== '' &&
        addressErr === '' &&
        number !== '' &&
        numberErr === '' ? (
          <div className="submit" onClick={this.checkAvailability}>
            check
          </div>
        ) : (
          ''
        )}

        {jobStatus ? (
          <Payments
            jobStatus={jobStatus}
            username={username}
            number={number}
            paymentReceived={this.paymentReceived}
          />
        ) : (
          ''
        )}

        {jobs && <Upcoming jobs={jobs} />}
        {<Registered />}
      </div>
    );
  }
}

export default Home;
