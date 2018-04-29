/**
 * Alert protocol.
 * @link https://tools.ietf.org/html/rfc5246#section-7.2
 */
const alertLevel = {
  WARNING: 1,
  FATAL: 2
}

const alertDescription = {
  CLOSE_NOTIFY: 0,
  UNEXPECTED_MESSAGE: 10,
  BAD_RECORD_MAC: 20,
  DECRYPTION_FAILED_RESERVED: 21,
  RECORD_OVERFLOW: 22,
  DECOMPRESSION_FAILURE: 30,
  HANDSHAKE_FAILURE: 40,
  NO_CERTIFICATE_RESERVED: 41,
  BAD_CERTIFICATE: 42,
  UNSUPPORTED_CERTIFICATE: 43,
  CERTIFICATE_REVOKED: 44,
  CERTIFICATE_EXPIRED: 45,
  CERTIFICATE_UNKNOWN: 46,
  ILLEGAL_PARAMETER: 47,
  UNKNOWN_CA: 48,
  ACCESS_DENIED: 49,
  DECODE_ERROR: 50,
  DECRYPT_ERROR: 51,
  EXPORT_RESTRICTION_RESERVED: 60,
  PROTOCOL_VERSION: 70,
  INSUFFICIENT_SECURITY: 71,
  INTERNAL_ERROR: 80,
  USER_CANCELED: 90,
  NO_RENEGOTIATION: 100,
  UNSUPPORTED_EXTENSION: 110
}

const sessionType = {
  CLIENT: 1,
  SERVER: 2
}

/**
 * Handshake Protocol
 * @link https://tools.ietf.org/html/rfc6347#section-4.3.2
 */
const handshakeType = {
  HELLO_REQUEST: 0,
  CLIENT_HELLO: 1,
  SERVER_HELLO: 2,
  HELLO_VERIFY_REQUEST: 3,
  CERTIFICATE: 11,
  SERVER_KEY_EXCHANGE: 12,
  CERTIFICATE_REQUEST: 13,
  SERVER_HELLO_DONE: 14,
  CERTIFICATE_VERIFY: 15,
  CLIENT_KEY_EXCHANGE: 16,
  FINISHED: 20
}

const contentType = {
  CHANGE_CIPHER_SPEC: 20,
  ALERT: 21,
  HANDSHAKE: 22,
  APPLICATION_DATA: 23
}

const protocolVersion = {
  DTLS_1_0: 0xFEFF,
  DTLS_1_2: 0xFEFD
}

const cipherSuites = {
  TLS_RSA_WITH_AES_128_GCM_SHA256: 0x009C,
  TLS_RSA_WITH_AES_256_GCM_SHA384: 0x009D
}

const compressionMethod = {
  NULL: 0
}

/**
 * Handshake states, taken from GnuTLS.
 */
const handshakeState = {
  STATE0: 0,  // Default state.
  STATE1: 1,  // Client hello sent.
  STATE2: 2,
  STATE3: 3,
  STATE4: 4,
  STATE5: 5,
  STATE6: 6,
  STATE7: 7,
  STATE8: 8,
  STATE9: 9,
  STATE10: 10,
  STATE11: 11,
  STATE12: 12,
  STATE13: 13,
  STATE14: 14,
  STATE15: 15,
  STATE16: 16,
  STATE17: 17,
  STATE18: 18,
  STATE19: 19,
  STATE20: 20,
  STATE21: 21,
  STATE22: 22,
  STATE30: 30,
  STATE31: 31,
  STATE40: 40,
  STATE41: 41,
  STATE50: 50
}

const AEAD_AES_128_GCM = {
  K_LEN: 16, // Length of a key.
  N_MIN: 12, // Min nonce length.
  N_MAX: 12, // Max nonce length.
  P_MAX: (2 ** 36) - 31, // Max length of a plaintext.

  // Max safe int in js is 2 ** 53. So, use this value
  // instead of 2 ** 61 as described in rfc5116.
  A_MAX: (2 ** 53) - 1, // Max length of an additional data.
  C_MAX: (2 ** 36) - 15 // Cipher text length.
}

const AEAD_AES_256_GCM = {
  K_LEN: 32, // Length of a key.
  N_MIN: 12, // Min nonce length.
  N_MAX: 12, // Max nonce length.
  P_MAX: (2 ** 36) - 31, // Max length of a plaintext.

  // Note: see above.
  A_MAX: (2 ** 53) - 1, // Max length of an additional data.
  C_MAX: (2 ** 36) - 15 // Cipher text length.
}

module.exports = {
  alertLevel,
  alertDescription,
  sessionType,
  handshakeType,
  contentType,
  protocolVersion,
  cipherSuites,
  compressionMethod,
  handshakeState,
  AEAD_AES_128_GCM,
  AEAD_AES_256_GCM
}
