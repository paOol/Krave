import React from 'react';
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
    jobStatus: ''
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

  checkAvailability = () => {
    axios.post(`api/check`, this.state).then(x => {
      console.log('x', x);
      console.log('x.data.success', x.data.success);
      this.setState({
        jobStatus: x.data.success ? x.data.success : x.data.status
      });
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
    console.log('valid', valid);
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
      jobStatus
    } = this.state;
    return (
      <div className="wrapper">
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
              {minNumber + 200} are available
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

        {jobStatus ? <div> true {jobStatus} </div> : ''}
      </div>
    );
  }
}

export default Home;
