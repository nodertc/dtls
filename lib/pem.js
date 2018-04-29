const PEM_PUBLIC_KEY = 1

module.exports = {
  to,
  PEM_PUBLIC_KEY
}

const startPublicKey = '-----BEGIN PUBLIC KEY-----'
const endPublicKey = '-----END PUBLIC KEY-----'

/**
 * Convert public key to PEM format.
 * @param {Buffer} buffer
 * @param {Number} format
 * @returns {String}
 */
function to(buffer, format) {
  let start
  let end

  if (format === PEM_PUBLIC_KEY) {
    start = startPublicKey
    end = endPublicKey
  } else {
    throw new Error('Unknown format')
  }

  const body = buffer.toString('base64').replace(/(.{64})/g, '$1\n').trimRight()
  const output = [start, body, end]

  // for (let i = 0; i < buffer.length; i += 48) {
  //   output.push(buffer.toString('base64', i, i + 48))
  // }
  // output.push(end)

  return output.join('\n')
}
