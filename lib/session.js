const { Readable } = require('stream')
const crypto = require('crypto')
const { encodingLength, types: { uint8, buffer }, createEncodeStream, encode } = require('binary-data')
const debug = require('debug')('dtls:session')
const { protocolVersion, contentType, handshakeState, handshakeType } = require('./constants')
const { DTLSPlaintextHeader, Alert, Handshake, Certificate } = require('./protocol')
const symbols = require('./symbols')

const EMPTY_BUFFER = Buffer.alloc(0)

module.exports = class Session extends Readable {
  constructor() {
    super({ objectMode: true })

    this[symbols.sessionType] = 0
    this[symbols.epoch] = 0
    this[symbols.sequenceNumber] = 0
    this[symbols.clientRandom] = EMPTY_BUFFER
    this[symbols.serverRandom] = EMPTY_BUFFER
    this[symbols.handshakeState] = handshakeState.STATE0
    this[symbols.handshakeInProgress] = true
    this[symbols.cookie] = EMPTY_BUFFER
    this[symbols.handshakeSequenceNumber] = 0
    this[symbols.sessionId] = EMPTY_BUFFER
    this[symbols.cipherSuite] = 0
    this[symbols.lastRecvRecord] = -1
    this[symbols.lastRecvHandshake] = -1
    this[symbols.serverPublicKey] = null  // Stored in PEM.
    this[symbols.serverWantCertificate] = false
    this[symbols.clientPremaster] = null
    this[symbols.masterSecret] = null
    this[symbols.handshakeEncoder] = createEncodeStream()
  }

  get epoch() {
    return this[symbols.epoch]
  }

  setNextEpoch() {
    ++this[symbols.epoch]
    this[symbols.sequenceNumber] = 0
  }

  get sequenceNumber() {
    return this[symbols.sequenceNumber]
  }

  get protocolVersion() {
    return protocolVersion.DTLS_1_2
  }

  get cookie() {
    return this[symbols.cookie]
  }

  get clientRandom() {
    return this[symbols.clientRandom]
  }

  get serverRandom() {
    return this[symbols.serverRandom]
  }

  get premaster() {
    return null
  }

  isProtocolVersionValid(version) {
    return version === this.protocolVersion
  }

  _read() { }

  /**
   * Writes data.
   * @param {object} payload
   * @param {object} schema
   */
  write(data, schema) {
    this.push([data, schema])
  }

  sendRecord(type, fragment, schema) {
    const record = {
      header: {
        type,
        version: this.protocolVersion,
        epoch: this.epoch,
        sequenceNumber: this[symbols.sequenceNumber]++,
        length: encodingLength(fragment, schema)
      },
      fragment
    }

    const protocol = {
      header: DTLSPlaintextHeader,
      fragment: schema
    }

    debug('send record message, type=%s', type)

    const isAppData = record.header.type === contentType.APPLICATION_DATA
    const isHandshake = record.header.type === contentType.HANDSHAKE
    const isFinished = isHandshake && record.fragment.header.type === handshakeType.FINISHED

    // If message need to encrypt, do it.
    if (isAppData || isFinished) {
      debug('encrypt message')
      const stream = createEncodeStream()

      encode(record.fragment, stream, protocol.fragment)
      const cipher = this[symbols.cipherSuite]
      const encrypted = cipher.encrypt(this, stream.slice(), record.header)

      record.header.length = encrypted.length
      record.fragment = encrypted

      protocol.fragment = buffer(encrypted.length)
    }

    debug('%O', record)
    this.write(record, protocol)
  }

  /**
   * @param {DTLSPlaintextHeader} record - record layer message
   * @param {Buffer} encrypted encrypted data
   * @returns {Buffer}
   */
  decryptRecord(recordHeader, encrypted) {
    const cipher = this[symbols.cipherSuite]

    return cipher.decrypt(this, encrypted, recordHeader)
  }

  sendHandshake(type, payload, schema) {
    const length = encodingLength(payload, schema)

    const handshake = {
      header: {
        type,
        length,
        sequence: this[symbols.handshakeSequenceNumber]++,
        fragment: {
          offset: 0,
          length
        }
      },
      payload
    }

    const protocol = {
      header: Handshake,
      payload: schema
    }

    // Store handshake messages for Finished computation.
    if (type !== handshakeType.FINISHED) {
      encode(handshake, this[symbols.handshakeEncoder], protocol)
    }

    this.sendRecord(contentType.HANDSHAKE, handshake, protocol)
  }

  sendAlert(level, description) {
    debug('send alert level=%s, description=%s', level, description)

    const message = {
      level,
      description
    }

    this.sendRecord(contentType.ALERT, message, Alert)
  }

  sendChangeCipherSpec() {
    debug('send Change Cipher Spec')

    this.sendRecord(contentType.CHANGE_CIPHER_SPEC, 1, uint8)
  }

  sendCertificate(cert) {
    debug('send Certificate')

    const certificate = {
      certificateList: []
    }

    if (Buffer.isBuffer(cert)) {
      certificate.certificateList.push(cert)
    }

    this.sendHandshake(handshakeType.CERTIFICATE, certificate, Certificate)
  }

  sendFinished(label) {
    debug('send Finished')

    const master = this[symbols.masterSecret]
    const cipher = this[symbols.cipherSuite]
    const hash = crypto.createHash(cipher.hash)

    hash.update(this[symbols.handshakeEncoder].slice())

    const final = cipher.prf(cipher.verify_data_length, master, label, hash.digest())

    this.sendHandshake(handshakeType.FINISHED, final, buffer(cipher.verify_data_length))
  }

  createPreMasterSecret() {
    throw new Error('not implemented')
  }

  createMasterSecret() {
    const seed = Buffer.concat([
      this.clientRandom,
      this.serverRandom
    ])

    const label = 'master secret'

    this[symbols.masterSecret] = this[symbols.cipherSuite].prf(48, this.premaster, label, seed)
    this[symbols.clientPremaster] = null
  }

  initCipherSuite() {
    const cipher = this[symbols.cipherSuite]

    cipher.init(this)
  }
}
