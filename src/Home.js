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
    userErr: '',
    numberErr: ''
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

  createAccount = () => {
    axios.post(`api/create`, this.state).then(x => {
      console.log('x', x);
    });
  };

  validateUsername = e => {
    let { value } = e.target;
    this.setState({ username: value });
    let valid = utils.validateUserName(value);
    if (valid.status !== undefined) {
      this.setState({ userErr: valid.status });
    } else {
      this.setState({ userErr: '' });
    }
  };

  validateNumber = e => {
    let { value } = e.target;
    this.setState({ number: value });
    if (value.length > 2) {
      let valid = utils.validateNumber(value, this.state.minNumber);
      if (valid.status !== undefined) {
        this.setState({ numberErr: valid.status });
      } else {
        this.setState({ numberErr: '' });
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
      userErr,
      numberErr,
      username,
      number
    } = this.state;
    return (
      <div className="wrapper">
        <div className="container">
          <form>
            <label for="username">Desired Username</label>
            <input onChange={this.validateUsername} id="username" type="text" />
            {userErr && <aside className="error"> {userErr}</aside>}
            <label for="number">Desired number</label>
            <input onChange={this.validateNumber} id="number" type="number" />
            {numberErr && <aside className="error"> {numberErr}</aside>}
            <small>
              Note: only cash accounts between #{minNumber} and #
              {minNumber + 200} are available
            </small>
          </form>
        </div>
        {username !== '' &&
        userErr === '' &&
        number !== '' &&
        numberErr === '' ? (
          <div className="submit" onClick={this.createAccount}>
            submit
          </div>
        ) : (
          ''
        )}
      </div>
    );
  }
}

export default Home;
