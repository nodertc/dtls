# Change Log
All notable changes to the "dtls" package will be documented in this file.

## [0.6.0] - 2019-05-05
- Update binary-data@0.6.0
- Added PSK key exchange, [RFC4279](https://tools.ietf.org/html/rfc4279), [RFC5487](https://tools.ietf.org/html/rfc5487). Ciphers:
  * TLS_PSK_WITH_AES_128_GCM_SHA256
  * TLS_PSK_WITH_AES_256_GCM_SHA384
- Added CHACHA20-POLY1305 ciphers:
  * TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256 (_nodejs v11+ only_)
  * TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256 (_nodejs v11+ only_)
  * TLS_PSK_WITH_CHACHA20_POLY1305_SHA256 (_nodejs v11+ only_)
- Users may change ciphers list sent to the server using `options.cipherSuites`
- Security fixes
- Added ECDHE_PSK key exchange [#16](https://github.com/nodertc/dtls/issues/16). Ciphers:
  * TLS_ECDHE_PSK_WITH_AES_128_GCM_SHA256
  * TLS_ECDHE_PSK_WITH_AES_256_GCM_SHA384
  * TLS_ECDHE_PSK_WITH_CHACHA20_POLY1305_SHA256

## [0.5.0] - 2018-11-17
- Drop AES-CCM block cipher
- Added `timeout` event to detect inactive connections
- Added `ALPN` ([RFC 7301](https://tools.ietf.org/html/rfc7301)) extension
- Update dependencies
- Bug fixes

## [0.4.0] - 2018-09-10
- Added ECDHE_ECDSA key exchange. Ciphers:
  * TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
  * TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
  * TLS_ECDHE_ECDSA_WITH_AES_128_CCM
  * TLS_ECDHE_ECDSA_WITH_AES_256_CCM
- Support for message reordering.
- Added ability to verify server (incoming) certificate.
- Added support for client-side certificate.
- [bug] retransmitted messages don't ignore it's epoch.

## [0.3.0] - 2018-08-22
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
