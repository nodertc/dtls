const crypto = require('crypto')
const debug = require('debug')('dtls:client-session')
const Session = require('./session')
const { compressionMethod, handshakeType, handshakeState, protocolVersion, sessionType } = require('./constants')
const { ClientHello, EncryptedPreMasterSecret } = require('./protocol')
const symbols = require('./symbols')
const ciphers = require('./cipher-suites')

const EMPTY_BUFFER = Buffer.alloc(0)
const defaultCipherSuites = ciphers.defaults()
const defaultCompressionMethods = [compressionMethod.NULL]

module.exports = class ClientSession extends Session {
  constructor() {
    super()
    debug('start client session')

    this[symbols.sessionType] = sessionType.CLIENT

    this.once('ready', () => {
      this.sendClientHello()
      this[symbols.handshakeState] = handshakeState.STATE1
    })

    const clientRandom = Buffer.allocUnsafe(32)
    this[symbols.clientRandom] = clientRandom

    clientRandom.writeUInt32BE(unixtime(), 0)

    crypto.randomFill(clientRandom, 4, err => {
      if (err) {
        this.emit('error', err)
        return
      }

      this.emit('ready')
    })
  }

  get premaster() {
    return this[symbols.clientPremaster]
  }

  createPreMasterSecret() {
    const premaster = Buffer.allocUnsafe(48)
    this[symbols.clientPremaster] = premaster

    premaster.writeUInt16BE(protocolVersion.DTLS_1_2, 0)
    crypto.randomFillSync(premaster, 2)

    debug('create pre master secret', premaster)
  }

  sendClientHello() {
    debug('send ClientHello')
    /* eslint-disable camelcase */

    const clientHello = {
      clientVersion: this.protocolVersion,
      random: this.clientRandom,
      sessionId: EMPTY_BUFFER,
      cookie: this.cookie,
      cipherSuites: defaultCipherSuites,
      compressionMethods: defaultCompressionMethods
    }

    this.sendHandshake(handshakeType.CLIENT_HELLO, clientHello, ClientHello)
  }

  sendClientKeyExchange() {
    debug('send ClientKeyExchange')

    const pemkey = this[symbols.serverPublicKey]
    debug(pemkey)

    const encrypted = crypto.publicEncrypt(pemkey, this.premaster)
    debug('encrypt pre master secret', encrypted)

    this.sendHandshake(handshakeType.CLIENT_KEY_EXCHANGE, encrypted, EncryptedPreMasterSecret)
  }

  sendFinished() {
    super.sendFinished('client finished')
  }
}

function unixtime() {
  return parseInt(Date.now() / 1e3, 10)
}
