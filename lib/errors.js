const { alertLevel } = require('./constants')

class AlertError extends Error {
  constructor(code, level = alertLevel.WARNING) {
    super()

    this.name = 'AlertError'
    this.level = level
    this.code = alertCodeToString(code)

    if (this.code) {
      this.message = `[${this.code}]`
    }
  }
}

function alertCodeToString(code) {
  switch (code) {
    case 0: return 'ERR_CLOSE_NOTIFY'
    case 10: return 'ERR_UNEXPECTED_MESSAGE'
    case 20: return 'ERR_BAD_RECORD_MAC'
    case 21: return 'ERR_DECRYPTION_FAILED_RESERVED'
    case 22: return 'ERR_RECORD_OVERFLOW'
    case 30: return 'ERR_DECOMPRESSION_FAILURE'
    case 40: return 'ERR_HANDSHAKE_FAILURE'
    case 41: return 'ERR_NO_CERTIFICATE_RESERVED'
    case 42: return 'ERR_BAD_CERTIFICATE'
    case 43: return 'ERR_UNSUPPORTED_CERTIFICATE'
    case 44: return 'ERR_CERTIFICATE_REVOKED'
    case 45: return 'ERR_CERTIFICATE_EXPIRED'
    case 46: return 'ERR_CERTIFICATE_UNKNOWN'
    case 47: return 'ERR_ILLEGAL_PARAMETER'
    case 48: return 'ERR_UNKNOWN_CA'
    case 49: return 'ERR_ACCESS_DENIED'
    case 50: return 'ERR_DECODE_ERROR'
    case 51: return 'ERR_DECRYPT_ERROR'
    case 60: return 'ERR_EXPORT_RESTRICTION_RESERVED'
    case 70: return 'ERR_PROTOCOL_VERSION'
    case 71: return 'ERR_INSUFFICIENT_SECURITY'
    case 80: return 'ERR_INTERNAL_ERROR'
    case 90: return 'ERR_USER_CANCELED'
    case 100: return 'ERR_NO_RENEGOTIATION'
    case 110: return 'ERR_UNSUPPORTED_EXTENSION'
    default: return 'ERR_UNKNOWN_ALERT'
  }
}

module.exports = {
  AlertError
}
