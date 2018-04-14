const crypto = require('crypto')
const debug = require('debug')('dtls:client-session')
const Session = require('./session')
const { cipherSuites, compressionMethod, handshakeType, handshakeState } = require('./constants')
const { ClientHello } = require('./protocol')
const symbols = require('./symbols')

const EMPTY_BUFFER = Buffer.alloc(0)

const defaultCipherSuites = [
  cipherSuites.TLS_DHE_RSA_WITH_AES_128_GCM_SHA256,
  cipherSuites.TLS_DHE_RSA_WITH_AES_256_GCM_SHA384
]

const defaultCompressionMethods = [compressionMethod.NULL]

// AES_GCM => https://tools.ietf.org/html/rfc5288
// AEAD => https://tools.ietf.org/html/rfc5116

module.exports = class ClientSession extends Session {
  constructor() {
    super()
    debug('start client session')

    this.once('ready', () => {
      this.sendClientHello()
      this[symbols.handshakeState] = handshakeState.STATE1
    })

    crypto.randomBytes(28, (err, bytes) => {
      if (err) {
        this.emit('error', err)
        return
      }

      this.clientRandom = bytes
      this.emit('ready')
    })
  }

  sendClientHello() {
    debug('send ClientHello')
    /* eslint-disable camelcase */

    const clientHello = {
      clientVersion: this.protocolVersion,
      random: {
        gmtUnixTime: unixtime(),
        randomBytes: this.clientRandom
      },
      sessionId: EMPTY_BUFFER,
      cookie: this.cookie,
      cipherSuites: defaultCipherSuites,
      compressionMethods: defaultCompressionMethods
    }

    this.sendHandshake(handshakeType.CLIENT_HELLO, clientHello, ClientHello)
  }
}

function unixtime() {
  return parseInt(Date.now() / 1e3, 10)
}
