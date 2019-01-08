import React from 'react';

class Upcoming extends React.Component {
  render() {
    const { jobs } = this.props;

    return (
      <div className="wrapper centered">
        <h2>Upcoming Registrations</h2>
        <div className="container">
          {jobs &&
            jobs.map((x, i) => {
              return (
                <div className="account" key={i}>
                  {`${x.username}#${x.number}`}
                </div>
              );
            })}
        </div>
      </div>
    );
  }
}

export default Upcoming;
