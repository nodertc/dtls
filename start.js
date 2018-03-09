Error.stackTraceLimit = Infinity
const dgram = require('dgram')
const debug = require('debug')('dtls:udp')
const dtls = require('.')

const udp = dgram.createSocket('udp4')

udp.on('message', data => {
  debug('got message %s bytes', data.length)
})

const socket = dtls.connect({
  socket: udp,
  remotePort: 4444,
  remoteAddress: '127.0.0.1'
})

socket.on('error', err => {
  throw err
})

process.on('warning', e => console.warn(e.stack))
