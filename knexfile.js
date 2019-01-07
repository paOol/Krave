const conf = require('./config/config.js');
const env = process.env.NODE_ENV || 'development';

let host =
  env == 'production' ? conf.connection.productionHost : conf.connection.host;

module.exports = {
  client: 'postgresql',
  connection: {
    host: `${host}`,
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
