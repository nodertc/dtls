# dtls

### Work in progress

### Current status

Able to send / receive and encode / decode packets.

### How to test?

Start openssl dtls server with default certs:

```sh
openssl s_server -cert cacert.pem -key cakey.pem -dtls1_2 -accept 4444 -msg -debug
```