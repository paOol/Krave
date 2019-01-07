import React from 'react';
import axios from 'axios';

class Upcoming extends React.Component {
  state = {
    registered: ''
  };

  getRegistered = () => {
    axios.get(`api/registered`).then(x => {
      this.setState({
        registered: x.data
      });
    });
  };

  componentDidMount() {
    this.getRegistered();
  }

  render() {
    const { registered } = this.state;
    if (!registered) {
      return null;
    }
    return (
      <div className="wrapper centered">
        <h2>Completed Registrations </h2>
        <div className="container">
          {registered.map((x, i) => {
            let txid = x.registrationtxid.startsWith('{')
              ? '#'
              : x.registrationtxid;
            return (
              <div className="account" key={i}>
                <a
                  className="completed"
                  target="_blank"
                  rel="nofollow"
                  href={`https://blockchair.com/bitcoin-cash/transaction/${txid}`}
                >
                  {`${x.username}#${x.number}`}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default Upcoming;
