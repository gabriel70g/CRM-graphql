require('dotenv').config();

const config = {
  mongo: {
    user: process.env.MONGO_INITDB_ROOT_USERNAME,
    password: process.env.MONGO_INITDB_ROOT_PASSWORD,
    database: process.env.MONGO_DB,
    port: process.env.MONGO_PORT,
    host: process.env.MONGO_HOST,
    connection: process.env.MONGO_CONNECTION,
    db_mongo: process.env.DB_MONGO,
  },
  api: {
    key: process.env.TOKEN_ID
  },
};

module.exports = {config}