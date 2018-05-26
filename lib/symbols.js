const sequenceNumber = Symbol('sequence_number')
const clientRandom = Symbol('client_random')
const serverRandom = Symbol('server_random')
const handshakeState = Symbol('handshake_state')
const handshakeInProgress = Symbol('handshake_in_progress')
const cookie = Symbol('cookie')
const handshakeSequenceNumber = Symbol('handshake_sequence_number')
const sessionId = Symbol('session_id')
// Current active cipher suite.
const cipherSuite = Symbol('cipher_suite')
// Next cipher suite after success handshake.
const nextCipherSuite = Symbol('next_cipher_suite')

const lastRecvRecord = Symbol('last_recv_record')
const lastRecvHandshake = Symbol('last_recv_handshake')
const serverPublicKey = Symbol('server_public_key')
const serverWantCertificate = Symbol('server_want_certificate')
const clientPremaster = Symbol('client_premaster')
const masterSecret = Symbol('master_secret')
const handshakeEncoder = Symbol('handshake_encoder')
const sessionType = Symbol('session_type')

// Our internal epoch, incremented after CHANGE_CIPHER_SPEC.
const outgoingEpoch = Symbol('outgoing_epoch')

// Epoch of the connected peer.
const incomingEpoch = Symbol('incoming_epoch')

const clientFinished = Symbol('client_finished')
const serverFinished = Symbol('server_finished')

module.exports = {
  outgoingEpoch,
  incomingEpoch,
  sequenceNumber,
  clientRandom,
  serverRandom,
  handshakeState,
  handshakeInProgress,
  cookie,
  handshakeSequenceNumber,
  sessionId,
  cipherSuite,
  nextCipherSuite,
  lastRecvRecord,
  lastRecvHandshake,
  serverPublicKey,
  serverWantCertificate,
  clientPremaster,
  masterSecret,
  handshakeEncoder,
  sessionType,
  clientFinished,
  serverFinished
}
