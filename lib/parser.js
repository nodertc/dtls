const { Duplex } = require('stream')
const { decode, createDecodeStream } = require('binary-data')
const debug = require('debug')('dtls:parser')
const {
  DTLSPlaintext,
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
        this.process(decode(this.stream, DTLSPlaintext))
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

    switch (record.type) {
      case contentType.ALERT:
        this.handleAlert(record)
        break
      case contentType.HANDSHAKE:
        this.handleHandshake(record)
        break
      default:
        break
    }
  }

  processError(error) {
    debug(error)
  }

  handleAlert(record) {
    const alert = decode(record.fragment, Alert)
    const error = new AlertError(alert.description, alert.level)

    if (alert.level === alertLevel.FATAL) {
      throw error
    } else {
      this.session.emit('warning', error)
    }
  }

  handleHandshake(record) {
    const stream = createDecodeStream(record.fragment)
    const handshake = decode(stream, Handshake)

    debug('got Handshake')
    debug('%O', handshake)

    switch (this.session[symbols.handshakeState]) {
      // We sent `client hello` and waiting for answer.
      case handshakeState.STATE0:
      case handshakeState.STATE1:
        this.handleClientHelloAnswer(stream, handshake)
        break
      default:
        break
    }
  }

  handleClientHelloAnswer(stream, handshake) {
    switch (handshake.type) {
      case handshakeType.HELLO_VERIFY_REQUEST:
        this.handleHelloVerifyRequest(stream)
        this.session[symbols.handshakeState] = handshakeState.STATE0
        return
      case handshakeType.SERVER_HELLO:
        this.handleServerHello(stream, handshake)
        this.session[symbols.handshakeState] = handshakeState.STATE3
        return
      default:
        break
    }

    assertHandshake(handshake.type, -1)
  }

  handleHelloVerifyRequest(stream) {
    debug('got HelloVerifyRequest')

    const helloVerifyRequest = decode(stream, HelloVerifyRequest)
    debug('%O', helloVerifyRequest)

    this.session[symbols.cookie] = helloVerifyRequest.cookie

    this.session.sendClientHello()
    this.session[symbols.handshakeState] = handshakeState.STATE1
  }

  handleServerHello(stream, handshake) {
    debug('got Server Hello')

    // Magic number got from GnuTLS#read_server_hello.
    if (handshake.length < 38) {
      throw new Error('Unexpected packet length.')
    }

    const serverHello = decode(stream, ServerHello)
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

function assertHandshake(type, expectdType) {
  if (type !== expectdType) {
    throw new Error('Unexpected handshake type.')
  }
}

module.exports = (session, decodeStream) => new Parser(session, decodeStream)
