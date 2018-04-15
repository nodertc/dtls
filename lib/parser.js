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
const pHandshakeQueue = Symbol('handshake_queue')

class Parser extends Duplex {
  constructor(session, input) {
    super({ readableObjectMode: true })

    this[pSession] = session
    this[pInputStream] = input
    this[pHandshakeQueue] = []
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

  get queue() {
    return this[pHandshakeQueue]
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

    const endOffset = handshake.fragment.offset + handshake.fragment.length

    // Check for invalid fragment.
    const isInvalidLength = endOffset > handshake.length
    const isInvalidRemainder = handshake.fragment.length > stream.length

    if (handshake.length > 0 && (isInvalidLength || isInvalidRemainder)) {
      throw new RangeError('Unexpected packet length.')
    }

    // Handle fragments.
    if (handshake.length > handshake.fragment.length) {
      // Incomplete message, waiting for next fragment.
      if (handshake.length > endOffset) {
        debug('got incomplete fragment')

        handshake.body = stream.readBuffer(handshake.fragment.length)
        this.queue.push(handshake)

        return
      }

      debug('got final fragment')

      // Complete message.
      const queue = this.queue.map(handshake => handshake.body)

      queue.push(stream.readBuffer(stream.length))
      stream.append(queue)

      // Reset queue.
      this.queue.length = 0

      debug('complete fragment, handshake length = %s, stream length = %s', handshake.length, stream.length)
    }

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
        break
      case handshakeType.SERVER_HELLO:
        this.handleServerHello(stream, handshake)
        this.session[symbols.handshakeState] = handshakeState.STATE3
        break
      default:
        break
    }
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

module.exports = (session, decodeStream) => new Parser(session, decodeStream)
