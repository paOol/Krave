const conf = require('./config/config.js');

module.exports = {
  client: 'postgresql',
  connection: {
    host: `${conf.connection.host}`,
    database: `${conf.connection.database}`,
    port: `${conf.connection.port}`,
    user: `${conf.connection.user}`,
    password: `${conf.connection.password}`
  },
  pool: {
    min: 2,
    max: 100
  },
  migrations: {
    tableName: 'krave_migrations'
  }
};
