'use strict';

const { connect } = require('lib/socket');
const { cipherSuites } = require('lib/constants');

module.exports = {
  connect,
  constants: {
    cipherSuites: Object.assign({}, cipherSuites),
  },
};
