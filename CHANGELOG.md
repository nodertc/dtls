# Change Log
All notable changes to the "dtls" package will be documented in this file.

## unreleased
- Added [AES CCM](https://tools.ietf.org/html/rfc6655) cipers
  * TLS_RSA_WITH_AES_128_CCM
  * TLS_RSA_WITH_AES_256_CCM
- Added [Extended Master Secret](https://tools.ietf.org/html/rfc7627) tls extension
- Added [ECDHE_RSA](https://tools.ietf.org/html/draft-ietf-tls-rfc4492bis-17#section-2.2) key exchange.
  * TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
  * TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384

## [0.2.0] - 2018-08-11
- support set / get MTU, 1200 bytes by default.
- handshake retransmission, follow RFC's rules.
- merge outgoing handshakes to speed up handshake process.

## [0.1.0] - 2018-08-05
- First release. Client-side implementation only with limited ciphers:
  * TLS_RSA_WITH_AES_128_GCM_SHA256
  * TLS_RSA_WITH_AES_256_GCM_SHA384
