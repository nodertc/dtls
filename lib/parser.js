const { Duplex } = require('stream')
const { decode, createDecodeStream, encode } = require('binary-data')
const debug = require('debug')('dtls:parser')
const {
  DTLSPlaintext,
  Handshake,
  HelloVerifyRequest,
  ServerHello,
  ExtensionList,
  Alert,
  Certificate
} = require('./protocol')
const symbols = require('./symbols')
const { handshakeState, contentType, handshakeType, alertLevel } = require('./constants')
const { AlertError } = require('./errors')
const ciphers = require('./cipher-suites')
const x509 = require('./x509')

const MAX_SESSION_ID_SIZE = 32

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

    // Drop replays.
    const currentSeq = record.sequenceNumber
    const lastSeq = this.session[symbols.lastRecvRecord]

    if (currentSeq <= lastSeq) {
      debug('warn: got msg seq=%s but last seq was %s, drop', currentSeq, lastSeq)
      return
    }

    this.session[symbols.lastRecvRecord] = record.sequenceNumber

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

  processError() {
    // ! debug(error)
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

      // Reassembly handshake.
      const queue = this.queue.map(handshake => handshake.body)

      queue.push(stream.readBuffer(stream.length))
      stream.append(queue)

      handshake.fragment.offset = 0
      handshake.fragment.length = stream.length

      if (handshake.length !== handshake.fragment.length) {
        throw new Error('Invalid fragment.')
      }

      // Reset queue.
      this.queue.length = 0

      debug('complete fragment, handshake length = %s, stream length = %s', handshake.length, stream.length)
    }

    // Remember handshake without fragmentation for Finished.
    encode(handshake, this.session[symbols.handshakeEncoder], Handshake)
    this.session[symbols.handshakeEncoder].append(stream)

    switch (this.session[symbols.handshakeState]) {
      // We sent `client hello` and waiting for answer.
      case handshakeState.STATE0:
      case handshakeState.STATE1:
        this.handleClientHelloAnswer(stream, handshake)
        break
      case handshakeState.STATE3:
        assertHandshake(handshakeType.CERTIFICATE, handshake.type)
        this.handleServerCertificate(stream)
        break
      case handshakeState.STATE4:
        assertHandshake(handshakeType.SERVER_HELLO_DONE, handshake.type)
        this.handleServerHelloDone()
      case handshakeState.STATE5: // eslint-disable-line no-fallthrough
        this.session.createPreMasterSecret()
        this.session.sendClientKeyExchange()
        this.session[symbols.handshakeState] = handshakeState.STATE6
      case handshakeState.STATE6: // eslint-disable-line no-fallthrough
        this.session.createMasterSecret()
        this.session.initCipherSuite()
        this.session[symbols.handshakeState] = handshakeState.STATE7
      case handshakeState.STATE7: // eslint-disable-line no-fallthrough
        this.session.sendChangeCipherSpec()
        this.session.setNextEpoch()
        this.session[symbols.handshakeState] = handshakeState.STATE8
      case handshakeState.STATE8: // eslint-disable-line no-fallthrough
        this.session.sendFinished()
        this.session[symbols.handshakeState] = -1
        break
      default:
        debug('invalid handshake state')
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
        assertHandshake(-1, handshake.type)
        break
    }
  }

  handleHelloVerifyRequest(stream) {
    debug('>>> got HelloVerifyRequest')

    // Forget initial ClientHello and HelloVerifyRequest.
    const handshakeQueueLength = this.session[symbols.handshakeEncoder].length
    this.session[symbols.handshakeEncoder].consume(handshakeQueueLength)

    const helloVerifyRequest = decode(stream, HelloVerifyRequest)
    debug('%O', helloVerifyRequest)

    this.session[symbols.cookie] = helloVerifyRequest.cookie

    this.session.sendClientHello()
    this.session[symbols.handshakeState] = handshakeState.STATE1
  }

  handleServerHello(stream, handshake) {
    debug('>>> got Server Hello')

    // Magic number got from GnuTLS#read_server_hello.
    if (handshake.length < 38) {
      throw new Error('Unexpected packet length.')
    }

    const serverHello = decode(stream, ServerHello)
    debug('%O', serverHello)

    let extensions = []

    if (stream.length > 0) {
      debug('extensions')

      extensions = decode(stream, ExtensionList)
      debug('%O', extensions)
    }

    this.session[symbols.serverRandom] = serverHello.random

    if (serverHello.sessionId.length > MAX_SESSION_ID_SIZE) {
      throw new Error('Illegal parameter.')
    }

    this.session[symbols.sessionId] = serverHello.sessionId

    const defaultCipherSuites = ciphers.defaultCiphers()
    const cipher = defaultCipherSuites.find(cipherSuite => cipherSuite.id === serverHello.cipherSuite)

    if (cipher === undefined) {
      throw new Error('Invalid cipher suite.')
    }

    this.session[symbols.cipherSuite] = cipher
    // cipher.init(this.session)
  }

  handleServerCertificate(stream) {
    debug('>>> got Certificate')

    const serverCertificate = decode(stream, Certificate)
    debug('%O', serverCertificate)

    if (serverCertificate.certificateList.length === 0) {
      throw new Error('Invalid certificate.')
    }

    const firstCertificate = serverCertificate.certificateList[0]
    const x509Cert = x509.parse(firstCertificate)

    debug('print server cert')
    debug('%O', x509Cert)

    // ! check signatures
    // ! check algo

    this.session[symbols.serverPublicKey] = x509.getPublicKeyPem(x509Cert)
    this.session[symbols.handshakeState] = handshakeState.STATE4

    this.session.emit('certificate', x509Cert, firstCertificate)
  }

  handleServerHelloDone() {
    debug('>>> got Server Hello Done')
    this.session[symbols.handshakeState] = handshakeState.STATE5
  }

  _destroy() {
    this.stream.destroy()
  }
}

function assertHandshake(expected, received) {
  if (expected === received) {
    return
  }

  throw new Error(`Invalid handshake ${received}`)
}

module.exports = (session, decodeStream) => new Parser(session, decodeStream)
