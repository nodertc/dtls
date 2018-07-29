'use strict';

Error.stackTraceLimit = Infinity;
const dgram = require('dgram');
const debugUDP = require('debug')('dtls:udp');
const debugDTLS = require('debug')('dtls:dtls');
const dtls = require('.');

const udp = dgram.createSocket('udp4');

udp.on('message', data => {
  debugUDP('got message %s bytes', data.length);
});

const socket = dtls.connect({
  socket: udp,
  remotePort: 4444,
  remoteAddress: '127.0.0.1',
});

socket.on('error', err => {
  throw err;
});

socket.on('data', data => {
  debugDTLS('got message "%s"', data.toString('ascii'));
});

process.on('warning', e => console.warn(e.stack)); // eslint-disable-line no-console
