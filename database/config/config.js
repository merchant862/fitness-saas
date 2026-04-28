require('dotenv').config();

const pool = {
  max: Number(process.env.DB_POOL_MAX || 10),
  min: Number(process.env.DB_POOL_MIN || 0),
  acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
  idle: Number(process.env.DB_POOL_IDLE || 10000)
};

const baseConfig = {
  dialectOptions: {
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 10000)
  },
  pool,
  logging: process.env.DB_LOGGING === 'true' ? console.log : false
};

let config = 
{
  "development": 
  {
    "username": process.env.DB_USER,
    "password": process.env.DB_PASS,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "dialect": process.env.DB_DIALECT,
    ...baseConfig
  },
  "test": 
  {
    "username": process.env.DB_USER,
    "password": process.env.DB_PASS,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "dialect": process.env.DB_DIALECT,
    ...baseConfig
  },
  "production": 
  {
    "username": process.env.DB_USER,
    "password": process.env.DB_PASS,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "dialect": process.env.DB_DIALECT,
    ...baseConfig
  },
}

module.exports = config;
