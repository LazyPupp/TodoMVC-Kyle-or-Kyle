'use strict';

require('dotenv').config();
const DATABASE_URL = process.env.DATABASE_URL || global.DATABASE_URL;

exports.DATABASE = {
  client: 'pg',
  connection: DATABASE_URL,
  pool: { min: 0, max: 3 },
  // debug: true
};

exports.PORT = 8080; 