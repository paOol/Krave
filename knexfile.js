require('dotenv').config();

console.log('check env:', process.env.NODE_ENV);
if (process.env.NODE_ENV == 'production') {
}

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.RAZZLE_DB_HOST,
      database: process.env.RAZZLE_DB_NAME,
      port: process.env.RAZZLE_DB_PORT,
      user: process.env.RAZZLE_DB_USER,
      password: process.env.RAZZLE_DB_PASSWORD
    },
    pool: {
      min: 2,
      max: 1000
    },
    migrations: {
      tableName: 'krave_migrations'
    }
  },
  production: {
    client: 'postgresql',
    connection: {
      host: process.env.RAZZLE_DB_HOST,
      database: process.env.RAZZLE_DB_NAME,
      port: process.env.RAZZLE_DB_PORT,
      user: process.env.RAZZLE_DB_USER,
      password: process.env.RAZZLE_DB_PASSWORD
    },
    pool: {
      min: 2,
      max: 1000
    },
    migrations: {
      tableName: 'krave_migrations'
    }
  }
};
