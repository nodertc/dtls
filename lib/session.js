const { Readable } = require('stream')
const { encodingLength } = require('binary-data')
const debug = require('debug')('dtls:session')
const { protocolVersion, contentType, handshakeState } = require('./constants')
const { DTLSPlaintextHeader, Alert, Handshake } = require('./protocol')
const symbols = require('./symbols')

const EMPTY_BUFFER = Buffer.alloc(0)

module.exports = class Session extends Readable {
  constructor() {
    super({ objectMode: true })

    this[symbols.epoch] = 0
    this[symbols.sequenceNumber] = 0
    this[symbols.clientRandom] = EMPTY_BUFFER
    this[symbols.serverRandom] = EMPTY_BUFFER
    this[symbols.handshakeState] = handshakeState.STATE0
    this[symbols.handshakeInProgress] = true
    this[symbols.cookie] = EMPTY_BUFFER
    this[symbols.handshakeSequenceNumber] = 0
  }

  get epoch() {
    return this[symbols.epoch]
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

  set clientRandom(random) {
    assertRandom(random)
    this[symbols.clientRandom] = random
  }

  get serverRandom() {
    return this[symbols.serverRandom]
  }

  set serverRandom(random) {
    assertRandom(random)
    this[symbols.serverRandom] = random
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
    debug('%O', record)

    this.write(record, protocol)
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
}

function assertRandom(random) {
  if (Buffer.isBuffer(random) && random.length === 28) {
    return
  }

  throw new TypeError('Incorrect random value.')
}
