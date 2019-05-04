'use strict';

const dtls = require('../..');

const { CIPHER } = process.env;

const socket = dtls.connect({
  type: 'udp4',
  remotePort: 4444,
  remoteAddress: '127.0.0.1',
  maxHandshakeRetransmissions: 4,
  pskIdentity: 'travis',
  pskSecret: Buffer.from('deadbeef', 'hex'),
  cipherSuites: [CIPHER],
});

socket.once('error', err => {
  console.error(err);
  socket.close();
  process.exit(-1);
});

socket.once('connect', () => {
  socket.close();
});

socket.once('timeout', () => {
  console.log('got timeout');
  process.exit(-1);
});

socket.setTimeout(5e3);
