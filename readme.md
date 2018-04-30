# dtls

Datagram Transport Layer Security Version 1.2 in pure js.

### Suppored ciphers:

* TLS_RSA_WITH_AES_128_GCM_SHA256
* TLS_RSA_WITH_AES_256_GCM_SHA384

### Work in progress

### How to debug?

Start openssl dtls server:

```sh
npm run openssl-server
```

or start GnuTLS dtls server (more debug messages):

```sh
# tested in Ubuntu 16, use docker if you are Windows / MacOS user.
npm run gnutls-server
```

Start client:

```sh
npm start
```

## Lincense

2018, (c) Dmitriy Tsvettsikh
