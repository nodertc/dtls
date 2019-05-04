'use strict';

Error.stackTraceLimit = Infinity;
const dtls = require('.');

const socket = dtls.connect({
  type: 'udp4',
  remotePort: 4444,
  remoteAddress: '127.0.0.1',
  maxHandshakeRetransmissions: 4,
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

socket.once('timeout', () => {
  console.log('got timeout');
});

socket.setTimeout(5e3);
