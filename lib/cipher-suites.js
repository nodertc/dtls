const crypto = require('crypto')
const debug = require('debug')('dtls:cipher')
const { encode, createDecodeStream, createEncodeStream } = require('binary-data')
const { cipherSuites, sessionType, AEAD_AES_128_GCM, AEAD_AES_256_GCM } = require('./constants')
const symbols = require('./symbols')
const { AEADAdditionalData } = require('./protocol')

module.exports = {
  defaults,
  defaultCiphers
}

/**
 * Culculates HMAC using provided hash.
 * @param {string} algorithm - hash algorithm
 * @param {Buffer} secret - hmac seed
 * @param {Buffer} data - input data
 * @returns {Buffer}
 */
function hmac(algorithm, secret, data) {
  const hash = crypto.createHmac(algorithm, secret)
  hash.update(data)
  return hash.digest()
}

/**
 * A data expansion function for PRF.
 * @param {number} bytes - the number of bytes required by PRF
 * @param {string} algorithm - hmac hash algorithm
 * @param {Buffer} secret - hmac secret
 * @param {Buffer} seed - input data
 */
function phash(bytes, algorithm, secret, seed) {
  const totalLength = bytes
  const bufs = []
  let Ai = seed // A0

  do {
    Ai = hmac(algorithm, secret, Ai) // A(i) = HMAC(secret, A(i-1))
    const output = hmac(algorithm, secret, Buffer.concat([Ai, seed]))

    bufs.push(output)
    bytes -= output.length
  } while (bytes > 0)

  return Buffer.concat(bufs, totalLength)
}

/**
 * Get the list of default cipher suites.
 */
function defaults() {
  return [
    cipherSuites.TLS_RSA_WITH_AES_128_GCM_SHA256,
    cipherSuites.TLS_RSA_WITH_AES_256_GCM_SHA384
  ]
}

/**
 * Get the list of default cipher suites.
 */
function defaultCiphers() {
  return [
    createAEADCipher(
      cipherSuites.TLS_RSA_WITH_AES_128_GCM_SHA256,
      'TLS_RSA_WITH_AES_128_GCM_SHA256',
      'aes-128-gcm',
      'rsa',
      AEAD_AES_128_GCM
    ),

    createAEADCipher(
      cipherSuites.TLS_RSA_WITH_AES_256_GCM_SHA384,
      'TLS_RSA_WITH_AES_256_GCM_SHA384',
      'aes-256-gcm',
      'rsa',
      AEAD_AES_256_GCM,
      'sha384'
    )
  ]
}

class AEADCipher {
  constructor() {
    this.id = 0
    this.name = null
    this.hash = null
    this.verify_data_length = 12

    this.block_algorithm = null
    this.kx_algorithm = null

    this.key_length = 0
    this.nonce_length = 0
    this.iv_length = 0
    this.auth_tag_length = 0

    this.nonce_implicit_length = 0
    this.nonce_explicit_length = 0

    this.client_write_key = null
    this.server_write_key = null

    this.client_nonce = null
    this.server_nonce = null
  }

  /**
   * Initialize encryption and decryption parts.
   * @param {Session} session
   */
  init(session) {
    const size = (this.key_length * 2) + (this.iv_length * 2)
    const secret = session[symbols.masterSecret]
    const seed = Buffer.concat([session.serverRandom, session.clientRandom])
    const key_block = this.prf(size, secret, 'key expansion', seed)
    const stream = createDecodeStream(key_block)

    this.client_write_key = stream.readBuffer(this.key_length)
    this.server_write_key = stream.readBuffer(this.key_length)

    const client_nonce_implicit = stream.readBuffer(this.iv_length)
    const server_nonce_implicit = stream.readBuffer(this.iv_length)

    debug('client iv', client_nonce_implicit)
    debug('server iv', server_nonce_implicit)

    this.client_nonce = Buffer.alloc(this.nonce_length, 0)
    this.server_nonce = Buffer.alloc(this.nonce_length, 0)

    client_nonce_implicit.copy(this.client_nonce, 0)
    server_nonce_implicit.copy(this.server_nonce, 0)
  }

  /**
   * Encrypt message.
   * @param {Session} session
   * @param {Buffer} data message to encrypt
   * @param {Object} header record layer message header.
   * @returns {Buffer}
   */
  encrypt(session, data, header) {
    const isClient = session[symbols.sessionType] === sessionType.CLIENT
    const iv = isClient ? this.client_nonce : this.server_nonce

    const write_key = isClient ? this.client_write_key : this.server_write_key

    iv.writeUInt16BE(header.epoch, this.nonce_implicit_length)
    iv.writeUIntBE(header.sequenceNumber, this.nonce_implicit_length + 2, 6)

    const explicit_nonce = iv.slice(this.nonce_implicit_length)

    const additional_data_stream = createEncodeStream()
    const additional_data = {
      epoch: header.epoch,
      sequence: header.sequenceNumber,
      type: header.type,
      version: header.version,
      length: data.length
    }

    encode(additional_data, additional_data_stream, AEADAdditionalData)

    const cipher = crypto.createCipheriv(
      this.block_algorithm,
      write_key,
      iv
    )

    cipher.setAAD(additional_data_stream.slice())

    const head_part = cipher.update(data)
    const final_part = cipher.final()
    const authtag = cipher.getAuthTag()

    return Buffer.concat([explicit_nonce, head_part, final_part, authtag])
  }

  /**
   * Decrypt message.
   * @param {Buffer} data encrypted message
   * @param {Buffer} explicit_nonce explicit part of AEAD nonce.
   * @param {Buffer} additional_data additional authenticated data
   * @returns {Buffer}
   */
  decrypt(session, data, header) {
    const isClient = session[symbols.sessionType] === sessionType.CLIENT
    const iv = isClient ? this.server_nonce : this.client_nonce
    const final = createDecodeStream(data)

    const explicit_nonce = final.readBuffer(this.nonce_explicit_length)
    explicit_nonce.copy(iv, this.nonce_implicit_length)

    const encryted = final.readBuffer(final.length - this.auth_tag_length)
    const auth_tag = final.readBuffer(this.auth_tag_length)
    const write_key = isClient ? this.server_write_key : this.client_write_key

    const additional_data_stream = createEncodeStream()
    const additional_data = {
      epoch: header.epoch,
      sequence: header.sequenceNumber,
      type: header.type,
      version: header.version,
      length: encryted.length
    }

    encode(additional_data, additional_data_stream, AEADAdditionalData)

    const decipher = crypto.createDecipheriv(
      this.block_algorithm,
      write_key,
      iv
    )

    decipher.setAAD(additional_data_stream.slice())
    decipher.setAuthTag(auth_tag)

    const head_part = decipher.update(encryted)
    const final_part = decipher.final()

    return final_part.length ? Buffer.concat([head_part, final_part]) : head_part
  }

  /**
   * Pseudorandom Function.
   * @param {number} size - the number of required bytes
   * @param {Buffer} secret - hmac secret
   * @param {string} label - identifying label
   * @param {Buffer} seed - input data
   */
  prf(size, secret, label, seed) {
    if (typeof label === 'string') {
      label = Buffer.from(label, 'ascii')
    }

    return phash(size, this.hash, secret, Buffer.concat([label, seed]))
  }
}

function initCipher(cipher, id, name, block, kx, hash = 'sha256') {
  cipher.id = id
  cipher.name = name
  cipher.block_algorithm = block
  cipher.kx_algorithm = kx
  cipher.hash = hash
}

function createAEADCipher(id, name, block, kx, constants, hash = 'sha256') {
  const cipher = new AEADCipher()

  initCipher(cipher, id, name, block, kx, hash)

  cipher.key_length = constants.K_LEN
  cipher.nonce_length = constants.N_MAX

  // RFC5288, sec. 3
  cipher.nonce_implicit_length = 4
  cipher.nonce_explicit_length = 8

  cipher.iv_length = cipher.nonce_implicit_length

  cipher.auth_tag_length = 16

  return cipher
}
