const structuredLog = require('structured-log');


const config = require('./config.json');
const environment = process.env.NODE_ENV || 'development';
if (environment !== 'development') {
  config.database.port = process.env.DATABASE_PORT || 6379;
  config.database.host = process.env.DATABASE_HOST || 'redis';
  config.database.catalogName = process.env.DATABASE_NAME || null;
  config.database.password = process.env.DATABASE_PASS || null;
  config.database.username = process.env.DATABASE_USER || null;
  config.broker.host = process.env.BROKER_HOST || 'redis';
  config.broker.port = process.env.BROKER_PORT || 6379;
  config.broker.user = process.env.BROKER_USER || null;
  config.broker.pass = process.env.BROKER_PASS || null;
  config.logger.logLevel = process.env.LOG_LEVEL || null;
  config.mockMode = process.env.MOCK_MODE || false;
  config.mockDataPath = process.env.MOCK_DATA_PATH || '/';
  config.auth.authority = process.env.AUTH_URL || null;
  config.auth.type = process.env.AUTH_TYPE || 'mock';
}

global.gConfig = config;