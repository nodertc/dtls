const { Duplex } = require('stream')
const { decode } = require('binary-data')
const debug = require('debug')('dtls:parser')
const {
  DTLSPlaintextHeader,
  Handshake,
  HelloVerifyRequest,
  ServerHello,
  ExtensionList,
  Alert
} = require('./protocol')
const symbols = require('./symbols')
const { handshakeState, contentType, handshakeType, alertLevel } = require('./constants')
const { AlertError } = require('./errors')

const pInputStream = Symbol('input')
const pSession = Symbol('session')

class Parser extends Duplex {
  constructor(session, input) {
    super({ readableObjectMode: true })

    this[pSession] = session
    this[pInputStream] = input
  }

  /**
   * @return {Session}
   */
  get session() {
    return this[pSession]
  }

  /**
   * @returns {DecodeStream}
   */
  get stream() {
    return this[pInputStream]
  }

  _read() {}

  _write(chunk, encoding, callback) {
    this.stream.write(chunk)
    debug('got message %s bytes', chunk.length)

    while (this.stream.length > 0) {
      try {
        this.process(decode(this.stream, DTLSPlaintextHeader))
      } catch (err) {
        this.processError(err)
        callback(err)

        return
      }
    }

    callback()
  }

  /**
   * Handle each record layer message.
   * @param {object} record
   */
  process(record) {
    debug('%O', record)

    if (record.type === contentType.ALERT) {
      this.handleAlert()
      return
    }

    switch (this.session[symbols.handshakeState]) {
      // We sent `client hello` and waiting for answer.
      case handshakeState.STATE0:
      case handshakeState.STATE1:
        this.handleClientHelloAnswer(record)
        break
      default:
        break
    }
  }

  processError(error) {
    debug(error)
  }

  handleAlert() {
    const alert = decode(this.stream, Alert)
    const error = new AlertError(alert.description, alert.level)

    if (alert.level === alertLevel.FATAL) {
      throw error
    } else {
      this.session.emit('warning', error)
    }
  }

  handleClientHelloAnswer(record) {
    assertPacket(record.type, contentType.HANDSHAKE)

    const handshake = decode(this.stream, Handshake)
    printHandshake(handshake)

    switch (handshake.type) {
      case handshakeType.HELLO_VERIFY_REQUEST:
        this.handleHelloVerifyRequest()
        this.session[symbols.handshakeState] = handshakeState.STATE0
        return
      case handshakeType.SERVER_HELLO:
        this.handleServerHello()
        this.session[symbols.handshakeState] = handshakeState.STATE3
        return
      default:
        break
    }

    assertHandshake(handshake.type, -1)
  }

  handleHelloVerifyRequest() {
    debug('got HelloVerifyRequest')

    const helloVerifyRequest = decode(this.stream, HelloVerifyRequest)
    debug('%O', helloVerifyRequest)

    this.session[symbols.cookie] = helloVerifyRequest.cookie

    this.session.sendClientHello()
    this.session[symbols.handshakeState] = handshakeState.STATE1
  }

  handleServerHello() {
    debug('got Server Hello')

    const serverHello = decode(this.stream, ServerHello)
    debug('%O', serverHello)

    let extensions = []

    if (this.stream.length > 0) {
      debug('extensions')

      extensions = decode(this.stream, ExtensionList)
      debug('%O', extensions)
    }
  }

  _destroy() {
    this.stream.destroy()
  }
}

function assertPacket(type, expectdType) {
  if (type !== expectdType) {
    throw new Error('Unexpected packet type.')
  }
}

function assertHandshake(type, expectdType) {
  if (type !== expectdType) {
    throw new Error('Unexpected handshake type.')
  }
}

function printHandshake(message) {
  debug('got handshake')
  debug('%O', message)
}

module.exports = (session, decodeStream) => new Parser(session, decodeStream)
