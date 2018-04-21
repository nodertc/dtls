const crypto = require('crypto')

// Ciphers: 'aes-128-gcm', 'aes-256-gcm'
// Hashes: 'RSA-SHA256', 'RSA-SHA384'

module.exports = {
  PRF
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
 * Pseudorandom Function.
 * @param {number} size - the number of required bytes
 * @param {string} algorithm- hmac hash algorithm
 * @param {Buffer} secret - hmac secret
 * @param {string} label - identifying label
 * @param {Buffer} seed - input data
 */
function PRF(size, algorithm, secret, label, seed) {
  if (typeof label === 'string') {
    label = Buffer.from(label, 'ascii')
  }

  return phash(size, algorithm, secret, Buffer.concat([label, seed]))
}
