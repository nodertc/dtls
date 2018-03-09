const { Duplex } = require('stream')
const unicast = require('unicast')
const isDtls = require('is-dtls')
const { createDecodeStream, createEncodeStream } = require('binary-data')
const streamfilter = require('streamfilter')
const pump = require('pump')
const debug = require('debug')('dtls:socket')
const Session = require('./client-session')
const createParser = require('./parser')
const createEncoder = require('./encoder')

const pSocket = Symbol('socket')
const pSession = Symbol('session')
const pClosed = Symbol('closed')

class Socket extends Duplex {
  constructor(options = {}) {
    super()

    if (!isUnicastSocket(options.socket)) {
      throw new Error('Expected `unicast` socket.')
    }

    if (!isSession(options.session)) {
      throw new Error('Expected session.')
    }

    debug('create socket to %s:%s', options.socket.remoteAddress, options.socket.remotePort)

    this[pSocket] = options.socket
    this[pSession] = options.session
    this[pClosed] = false

    const input = createDecodeStream()
    const output = createEncodeStream()

    const encoder = createEncoder(output)
    const parser = createParser(this[pSession], input)

    pump(this[pSession], encoder, this[pSocket], err => {
      if (err) {
        this.emit('error', err)
      }
    })
    pump(this[pSocket], streamfilter(chunkFilter), parser, err => {
      if (err) {
        this.emit('error', err)
      }
    })
  }

  _read() {
    this[pSocket].resume()
  }

  _write() {}

  close() {
    if (this[pClosed]) {
      return
    }

    this[pSocket].close()
  }
}

function connect(options = {}) {
  if (!isUnicastSocket(options.socket)) {
    options.socket = unicast.createSocket(options)
  }

  options.session = new Session()

  return new Socket(options)
}

function isUnicastSocket(s) {
  return s instanceof unicast.Socket
}

function chunkFilter(data, enc, callback) {
  const isCorrect = isDtls(data)
  debug('got message, check=%s', isCorrect)
  callback(!isCorrect)
}

function isSession(s) {
  return s instanceof Session
}

module.exports = {
  connect,
  Socket
}
