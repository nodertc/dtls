const { Transform } = require('stream')
const { encode } = require('binary-data')
const debug = require('debug')('dtls:encoder')

const pOutput = Symbol('output')

class Encoder extends Transform {
  constructor(output) {
    super({ writableObjectMode: true })

    this[pOutput] = output
  }

  _transform(chunk, encoding, callback) {
    debug('send message')

    if (Buffer.isBuffer(chunk)) {
      callback(null, chunk)
      return
    }

    if (Array.isArray(chunk) && chunk.length >= 2) {
      const data = chunk[0]
      const schema = chunk[1]

      try {
        encode(data, this[pOutput], schema)

        const size = this[pOutput].length
        const buf = this[pOutput].slice(0, size)

        debug('create packet %s bytes', size)

        this[pOutput].consume(size)
        callback(null, buf)
      } catch (err) {
        debug(err)
        callback(err)
      }

      return
    }

    callback(new TypeError('Unsupported chunk type.'))
  }

  _destroy() {
    this[pOutput].destroy()
  }
}

module.exports = output => new Encoder(output)
