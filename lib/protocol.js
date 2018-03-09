const { types: { uint8, uint16be, uint48be, uint24be, uint32be, buffer, array } } = require('binary-data')

// Record layer.

const ProtocolVersion = uint16be

const ContentType = uint8

const DTLSPlaintextHeader = {
  type: ContentType,
  version: ProtocolVersion,
  epoch: uint16be,
  sequenceNumber: uint48be,
  length: uint16be
}

const DTLSPlaintext = {
  ...DTLSPlaintextHeader,
  fragment: buffer(context => context.node.length)
}

const DTLSCompressed = DTLSPlaintext
const DTLSCiphertext = DTLSPlaintext

/*!
struct {
  ContentType type;
  ProtocolVersion version;
  uint16 epoch;                                     // New field
  uint48 sequence_number;                           // New field
  uint16 length;
  select (CipherSpec.cipher_type) {
    case block:  GenericBlockCipher;
    case aead:   GenericAEADCipher;                 // New field
  } fragment;
} DTLSCiphertext;

@link https://tools.ietf.org/html/rfc5246#section-6.2.3.2
struct {
  opaque IV[SecurityParameters.record_iv_length];
  block-ciphered struct {
      opaque content[TLSCompressed.length];
      opaque MAC[SecurityParameters.mac_length];
      uint8 padding[GenericBlockCipher.padding_length];
      uint8 padding_length;
  };
} GenericBlockCipher;

@link https://tools.ietf.org/html/rfc5246#section-6.2.3.3
struct {
  opaque nonce_explicit[SecurityParameters.record_iv_length];
  aead-ciphered struct {
      opaque content[TLSCompressed.length];
  };
} GenericAEADCipher;
*/

// alert messages

const AlertLevel = uint8
const AlertDescription = uint8

const Alert = {
  level: AlertLevel,
  description: AlertDescription
}

// Handshake Protocol

const HandshakeType = uint8

const Handshake = {
  type: HandshakeType,
  length: uint24be,
  messageSeq: uint16be,
  fragment: {
    offset: uint24be,
    length: uint24be
  }
}

/*!
struct {
  HandshakeType msg_type;
  uint24 length;
  uint16 message_seq;                               // New field
  uint24 fragment_offset;                           // New field
  uint24 fragment_length;                           // New field
  select (HandshakeType) {
    case server_key_exchange: ServerKeyExchange;
    case certificate_request: CertificateRequest;
    case server_hello_done:ServerHelloDone;
    case certificate_verify:  CertificateVerify;
    case client_key_exchange: ClientKeyExchange;
    case finished: Finished;
  } body;
} Handshake;
*/

const Random = {
  gmtUnixTime: uint32be,
  randomBytes: buffer(28)
}

const SessionID = buffer(uint8)

const CipherSuite = uint16be

const CompressionMethod = uint8

const ClientHello = {
  clientVersion: ProtocolVersion,
  random: Random,
  sessionId: SessionID,
  cookie: buffer(uint8),
  cipherSuites: array(CipherSuite, uint16be, 'bytes'),
  compressionMethods: array(CompressionMethod, uint8, 'bytes')
}

const HelloVerifyRequest = {
  serverVersion: ProtocolVersion,
  cookie: buffer(uint8)
}

const ExtensionType = uint16be

const Extension = {
  type: ExtensionType,
  data: buffer(uint16be)
}

const ExtensionList = array(Extension, uint16be, 'bytes')

const ServerHello = {
  serverVersion: ProtocolVersion,
  random: Random,
  sessionId: SessionID,
  cipherSuite: CipherSuite,
  compressionMethod: CompressionMethod
}

const ASN11Cert = buffer(uint24be)

const Certificate = {
  certificateList: array(ASN11Cert, uint24be, 'bytes')
}

module.exports = {
  DTLSPlaintextHeader,
  DTLSPlaintext,
  DTLSCompressed,
  DTLSCiphertext,
  Alert,
  Handshake,
  ClientHello,
  HelloVerifyRequest,
  ExtensionList,
  ServerHello,
  Certificate
}
