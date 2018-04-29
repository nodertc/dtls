const epoch = Symbol('epoch')
const sequenceNumber = Symbol('sequence_number')
const clientRandom = Symbol('client_random')
const serverRandom = Symbol('server_random')
const handshakeState = Symbol('handshake_state')
const handshakeInProgress = Symbol('handshake_in_progress')
const cookie = Symbol('cookie')
const handshakeSequenceNumber = Symbol('handshake_sequence_number')
const sessionId = Symbol('session_id')
const cipherSuite = Symbol('cipher_suite')
const lastRecvRecord = Symbol('last_recv_record')
const lastRecvHandshake = Symbol('last_recv_handshake')
const serverPublicKey = Symbol('server_public_key')
const serverWantCertificate = Symbol('server_want_certificate')
const clientPremaster = Symbol('client_premaster')
const masterSecret = Symbol('master_secret')
const handshakeEncoder = Symbol('handshake_encoder')
const sessionType = Symbol('session_type')

module.exports = {
  epoch,
  sequenceNumber,
  clientRandom,
  serverRandom,
  handshakeState,
  handshakeInProgress,
  cookie,
  handshakeSequenceNumber,
  sessionId,
  cipherSuite,
  lastRecvRecord,
  lastRecvHandshake,
  serverPublicKey,
  serverWantCertificate,
  clientPremaster,
  masterSecret,
  handshakeEncoder,
  sessionType
}
