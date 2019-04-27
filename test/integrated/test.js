'use strict';

const fs = require('fs');
const path = require('path');
const dtls = require('../..');

const { CIPHER, KEYFILE, CERTFILE } = process.env;

const socket = dtls.connect({
  type: 'udp4',
  remotePort: 4444,
  remoteAddress: '127.0.0.1',
  certificate: fs.readFileSync(
    path.resolve(__dirname, '../fixtures', CERTFILE)
  ),
  certificatePrivateKey: fs.readFileSync(
    path.resolve(__dirname, '../fixtures', KEYFILE)
  ),
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
