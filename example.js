'use strict';

const dgram = require('dgram');
const dtls = require('.');

const serverSocket = dgram.createSocket('udp4');
serverSocket.bind(4444);

const socket = dtls.connect({
  type: 'udp4',
  remotePort: 4444,
  remoteAddress: '127.0.0.1',
  maxHandshakeRetransmissions: 4,
});

socket.on('error', err => {
  console.error('client:', err);
});

socket.on('data', data => {
  console.log('client: got message "%s"', data.toString('ascii'));
  socket.close();
});

socket.once('connect', () => {
  socket.write('Hello from Node.js!');
});

socket.once('timeout', () => {
  console.log('client: got timeout');
});

socket.setTimeout(5e3);

const server = dtls.createServer({ socket: serverSocket });

server.on('error', err => {
  console.error('server:', err);
});

server.on('data', data => {
  console.log('server: got message "%s"', data.toString('ascii'));
  server.write(data, () => server.close());
});

socket.once('connect', () => {
  console.log('server: got connecton');
});
