const { Readable } = require('stream')
const { encodingLength } = require('binary-data')
const debug = require('debug')('dtls:session')
const { protocolVersion, contentType } = require('./constants')
const { DTLSPlaintextHeader, Alert, Handshake } = require('./protocol')

const pEpoch = Symbol('epoch')
const pSequenceNumber = Symbol('sequence_number')
const pClientRandom = Symbol('clientRandom')
const pServerRandom = Symbol('serverRandom')

const EMPTY_BUFFER = Buffer.alloc(0)

module.exports = class Session extends Readable {
  constructor() {
    super({ objectMode: true })

    this[pEpoch] = 0
    this[pSequenceNumber] = 0
    this[pClientRandom] = EMPTY_BUFFER
    this[pServerRandom] = EMPTY_BUFFER
  }

  get epoch() {
    return this[pEpoch]
  }

  get sequenceNumber() {
    return this[pSequenceNumber]
  }

  get protocolVersion() {
    return protocolVersion.DTLS_1_2
  }

  get cookie() {
    return EMPTY_BUFFER
  }

  get clientRandom() {
    return this[pClientRandom]
  }

  set clientRandom(random) {
    assertRandom(random)
    this[pClientRandom] = random
  }

  get serverRandom() {
    return this[pServerRandom]
  }

  set serverRandom(random) {
    assertRandom(random)
    this[pServerRandom] = random
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
        sequenceNumber: this.sequenceNumber,
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
    nextSequenceNumber(this)
  }

  sendHandshake(type, payload, schema) {
    const length = encodingLength(payload, schema)

    const handshake = {
      header: {
        type,
        length,
        messageSeq: 0,
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

// TODO
// function nextEpoch(session) {
//   ++session[pEpoch]
//   session[pSequenceNumber] = 0
// }

function nextSequenceNumber(session) {
  ++session[pSequenceNumber]
}

function assertRandom(random) {
  if (Buffer.isBuffer(random) && random.length === 28) {
    return
  }

  throw new TypeError('Incorrect random value.')
}
