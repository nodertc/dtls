const ClientSession = require('lib/client-session')
jest.mock('lib/session');

describe('client session', () => {
  const next = process.nextTick

  beforeEach(() => {
    process.nextTick = jest.fn()
  })

  afterEach(() => {
    process.nextTick = next
  })

  it('should send ClientHello', () => {
    const session = new ClientSession()
    expect(process.nextTick).toBeCalled()

    session.sendClientHello()
    expect(session.sendHandshake).toHaveBeenCalledTimes(1)

    const args = session.sendHandshake.mock.calls[0]
    expect(args).toHaveLength(3)
    expect(args[0]).toEqual(1)

    const expectedProps = [
      'clientVersion',
      'random.gmtUnixTime',
      'random.randomBytes',
      'sessionId',
      'cookie',
      'cipherSuites',
      'compressionMethods'
    ]

    for(const property of expectedProps) {
      expect(args[1]).toHaveProperty(property)
      expect(args[2]).toHaveProperty(property)
    }
  })
})
