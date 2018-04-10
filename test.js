const net = require('net')

const port = 15740
const host = '192.168.1.132'

const PTPPacketType = {
  Invalid:            0,
  InitCommandRequest: 1,
  InitCommandAck:     2,
  InitEventRequest:   3,
  InitEventAck:       4,
  InitFail:           5,
  OperationRequest:   6,
  OperationResponse:  7,
  Event:              8,
  StartDataPacket:    9,
  DataPacket:         10,
  CancelTransaction:  11,
  EndDataPacket:      12,
  Ping:               13,
  Pong:               14,
}

const PTPVersion = Buffer.from([0x00, 0x00, 0x01, 0x00])

const PTPPacketGenerator = {
  initCommandRequest (guid, hostname) {
    // allocate buffer with space for length, type, guid, hostname, and version
    const payload = Buffer.alloc(4 + 4 + 16 + (hostname.length * 2 + 2) + 4)
    payload.writeInt32LE(payload.length, 0)
    payload.writeInt32LE(PTPPacketType.InitCommandRequest, 4)
    payload.fill(guid, 8, 24, 'hex')
    payload.fill(hostname, 24, 24 + hostname.length * 2, 'utf16le')
    payload.fill(PTPVersion, 24 + hostname.length * 2 + 2) // +2 leaves null reference character to indicate end of hostname
    return payload
  },

  InitEventRequest (connectionNumber) {
    // allocate buffer with length, type, and command connection number
    const payload = Buffer.alloc(12)
    payload.writeInt32LE(payload.length, 0)
    payload.writeInt32LE(PTPPacketType.InitEventRequest, 4)
    payload.writeInt32LE(connectionNumber, 8)
    return payload
  }
}

const commandClient = new net.Socket()
const eventClient = new net.Socket()

commandClient.connect(port, host, function () {
  console.log('Command Connected')
  const payload = PTPPacketGenerator.initCommandRequest('ffffffffffffffffffffffffffffffff', 'slider')
  commandClient.write(payload)
})

commandClient.on('data', function (data) {
  const typeInt = data.readUInt16LE(4)
  const type = Object.keys(PTPPacketType).find(key => PTPPacketType[key] === typeInt)

  console.log(type)

  switch (typeInt) {
    case PTPPacketType.InitCommandAck:
      const connectionNumber = data.readUInt16LE(8)
      const guid = data.toString('hex', 12, 28)
      const hostname = data.toString('utf16le', 28, data.length - 6)
      console.log(`Received: ${type} | Con# ${connectionNumber} | ${guid} | ${hostname}`)
      eventClient.connect(port, host, function () {
        console.log('Event Connected')
        const payload = PTPPacketGenerator.InitEventRequest(connectionNumber)
        eventClient.write(payload)
      })
      break
  }
})

commandClient.on('close', function () {
  console.log('Command Connection Closed')
  eventClient.destroy() // kill client on close..?
  commandClient.destroy() // kill client on close..?
})

eventClient.on('data', function (data) {
  const typeInt = data.readUInt16LE(4)
  switch (typeInt) {
    case PTPPacketType.InitEventAck:
      commandClient.write(Buffer.from('120000000600000002000000109101000000', 'hex'))
      commandClient.write(Buffer.from('1400000009000000010000000c00000000000000', 'hex'))
      commandClient.write(Buffer.from('180000000c000000930000000c000000b0d1000008000000', 'hex'))
      setInterval(function () {

        // G7X extend lens

        commandClient.write(Buffer.from('1a000000060000000100000028919a0100000300000001000000', 'hex')) // 9a01
        // then release: 16000000060000000100000029919c01000003000000
        commandClient.write(Buffer.from('16000000060000000100000029919c01000003000000', 'hex')) // 9a01

      }, 3000)

      break
  }
})

eventClient.on('close', function () {
  console.log('Event Connection Closed')
  eventClient.destroy() // kill client on close..?
  commandClient.destroy() // kill client on close..?
})