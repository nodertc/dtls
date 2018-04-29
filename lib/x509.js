const asn = require('asn1.js')
const pem = require('./pem')

module.exports = {
  parse,
  getPublicKeyPem
}

const AlgorithmIdentifier = asn.define('AlgorithmIdentifier', function () {
  this.seq().obj(
        this.key('algorithm').objid(),
        this.key('parameters').optional()
    )
})

const X509Certificate = asn.define('X509Certificate', function () {
  this.seq().obj(
        this.key('tbsCertificate').use(TBSCertificate),
        this.key('signatureAlgorithm').use(AlgorithmIdentifier),
        this.key('signatureValue').bitstr()
    )
})

const AttributeTypeValue = asn.define('AttributeTypeValue', function () {
  this.seq().obj(
        this.key('type').objid(),
        this.key('value').any()
    )
})

const RelativeDistinguishedName = asn.define('RelativeDistinguishedName', function () {
  this.setof(AttributeTypeValue)
})

const RDNSequence = asn.define('RDNSequence', function () {
  this.seqof(RelativeDistinguishedName)
})

const Name = asn.define('Name', function () {
  this.choice({
    rdnSequence: this.use(RDNSequence)
  })
})

const Time = asn.define('Time', function () {
  this.choice({
    utcTime: this.utctime(),
    generalTime: this.gentime()
  })
})

const Validity = asn.define('Validity', function () {
  this.seq().obj(
        this.key('notBefore').use(Time),
        this.key('notAfter').use(Time)
    )
})

const SubjectPublicKeyInfo = asn.define('SubjectPublicKeyInfo', function () {
  this.seq().obj(
        this.key('algorithm').use(AlgorithmIdentifier),
        this.key('subjectPublicKey').bitstr()
    )
})

const Extension = asn.define('Extension', function () {
  this.seq().obj(
        this.key('extnID').objid(),
        this.key('critical').bool().def(false),
        this.key('extnValue').octstr()
    )
})

const RSAPublicKey = asn.define('RSAPublicKey', function () {
  this.seq().obj(
        this.key('modulus').int(),
        this.key('publicExponent').int()
    )
})

const TBSCertificate = asn.define('TBSCertificate', function () {
  this.seq().obj(
        this.key('version').explicit(0).int(),
        this.key('serialNumber').int(),
        this.key('signature').use(AlgorithmIdentifier),
        this.key('issuer').use(Name),
        this.key('validity').use(Validity),
        this.key('subject').use(Name),
        this.key('subjectPublicKeyInfo').use(SubjectPublicKeyInfo),
        this.key('issuerUniqueID').implicit(1).bitstr().optional(),
        this.key('subjectUniqueID').implicit(2).bitstr().optional(),
        this.key('extensions').explicit(3).seqof(Extension).optional()
    )
})

/**
 * Parse x509 certificate.
 * @param {Buffer} data
 */
function parse(data) {
  return X509Certificate.decode(data, 'der')
}

/**
 * Get public key from certificate in PEM format.
 * @param {Buffer|Object} data
 * @returns {String}
 */
function getPublicKeyPem(data) {
  if (Buffer.isBuffer(data)) {
    data = parse(data)
  }

  const subjectPublicKey = data.tbsCertificate.subjectPublicKeyInfo
  const publicKeyDer = SubjectPublicKeyInfo.encode(subjectPublicKey, 'der')

  return pem.to(publicKeyDer, pem.PEM_PUBLIC_KEY)
}

