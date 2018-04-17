const epoch = Symbol('epoch')
const sequenceNumber = Symbol('sequence_number')
const clientRandom = Symbol('client_random')
const serverRandom = Symbol('server_random')
const handshakeState = Symbol('handshake_state')
const handshakeInProgress = Symbol('handshake_in_progress')
const cookie = Symbol('cookie')
const handshakeSequenceNumber = Symbol('handshake_sequence_number')
const sessionId = Symbol('session_id')

module.exports = {
  epoch,
  sequenceNumber,
  clientRandom,
  serverRandom,
  handshakeState,
  handshakeInProgress,
  cookie,
  handshakeSequenceNumber,
  sessionId
}
