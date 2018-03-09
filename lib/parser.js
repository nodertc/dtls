const { Duplex } = require('stream')
const { decode } = require('binary-data')
const debug = require('debug')('dtls:parser')
const { DTLSPlaintext } = require('./protocol')

const pInputStream = Symbol('input')
const pSession = Symbol('session')

class Parser extends Duplex {
  constructor(session, input) {
    super({ readableObjectMode: true })

    this[pSession] = session
    this[pInputStream] = input
  }

  _read() {}

  _write(chunk, encoding, callback) {
    this[pInputStream].write(chunk)

    try {
      this.process()
    } catch (err) {
      this.processError(err)
    }

    callback()
  }

  process() {
    while (this[pInputStream].length > 0) {
      const recordMessage = decode(this[pInputStream], DTLSPlaintext)
      debug('got message %s bytes %O', decode.bytes)
      debug('%O', recordMessage)
    }
  }

  processError(error) {
    debug(error)
  }

  _destroy() {
    this[pInputStream].destroy()
  }
}

module.exports = (session, decodeStream) => new Parser(session, decodeStream)
