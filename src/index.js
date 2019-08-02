'use strict';

const { connect } = require('lib/socket');
const { cipherSuites } = require('lib/constants');
const CookieManager = require('lib/cookie-manager');
const { createServer } = require('lib/server');

module.exports = {
  connect,
  createServer,
  constants: {
    cipherSuites: Object.assign({}, cipherSuites),
  },
  CookieManager,
};
