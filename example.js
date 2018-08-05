'use strict';

Error.stackTraceLimit = Infinity;
const dgram = require('dgram');
const dtls = require('.');

const udp = dgram.createSocket('udp4');

const socket = dtls.connect({
  socket: udp,
  remotePort: 4444,
  remoteAddress: '127.0.0.1',
});

socket.on('error', err => {
  console.error(err);
});

socket.on('data', data => {
  console.log('got message "%s"', data.toString('ascii'));
  socket.close();
});

socket.once('connect', () => {
  socket.write('Hello from Node.js!');
});
