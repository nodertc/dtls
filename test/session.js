const Session = require('lib/session')

jest.mock('binary-data', () => ({
  encodingLength: jest.fn(() => 0),
  types: {
    buffer: jest.fn(),
    array: jest.fn()
  }
}))

describe('base session', () => {
  it('should send Alert', () => {
    const ses = new Session()
    ses.sendRecord = jest.fn()
    
    const ALERT = 21

    ses.sendAlert(1, 2)
    expect(ses.sendRecord).toHaveBeenCalledTimes(1)
    
    const args = ses.sendRecord.mock.calls[0]
    expect(args).toHaveLength(3)
    expect(args[0]).toEqual(ALERT)

    const expectedProps = [
      'level',
      'description'
    ]

    for(const property of expectedProps) {
      expect(args[1]).toHaveProperty(property)
      expect(args[2]).toHaveProperty(property)
    }
  })
  
  it('should send Handshake', () => {
    const ses = new Session()
    ses.sendRecord = jest.fn()
    
    const HANDSHAKE = 22
    
    ses.sendHandshake(322, null, null)
    expect(ses.sendRecord).toHaveBeenCalledTimes(1)
    
    const args = ses.sendRecord.mock.calls[0]
    expect(args).toHaveLength(3)
    expect(args[0]).toEqual(HANDSHAKE)
    
    const expectedProps = [
      'header.type',
      'header.length',
      'header.messageSeq',
      'header.fragment.offset',
      'header.fragment.length',
      'payload'
    ]
    
    for(const property of expectedProps) {
      expect(args[1]).toHaveProperty(property)
      expect(args[2]).toHaveProperty(property)
    }
  })
  
  it('should send record layer message', () => {
    const ses = new Session()
    ses.write = jest.fn()

    ses.sendRecord(322, null, null)
    expect(ses.write).toHaveBeenCalledTimes(1)

    const args = ses.write.mock.calls[0]
    expect(args).toHaveLength(2)

    const expectedProps = [
      'header.type',
      'header.version',
      'header.epoch',
      'header.sequenceNumber',
      'fragment'
    ]
    
    for(const property of expectedProps) {
      expect(args[0]).toHaveProperty(property)
      expect(args[1]).toHaveProperty(property)
    }
  })
})