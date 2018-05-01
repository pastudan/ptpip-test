const ssdp = require('node-ssdp').Client
const convert = require('xml-js')
const request = require('request')

const ssdpClient = new ssdp()

ssdpClient.on('response', function (headers, statusCode, rinfo) {
  // Received a response to an m-search
  console.log(new Date(), headers.ST, headers.LOCATION)

  // TODO - also bypass XML lookup if we've already received a m-search response from the device / IP
  if (headers.ST === 'upnp:rootdevice' && headers.LOCATION) {
    // console.log(new Date(), headers.ST, headers.LOCATION)

    request(headers.LOCATION, function (error, response, body) {
      const deviceInfo = convert.xml2js(body, {compact: true})
      console.log(deviceInfo.root.device.modelName._text)
    });
  }
})

// // search for a service type
// client.search('urn:schemas-upnp-org:service:ContentDirectory:1');

// Or get a list of all services on the network

setInterval(function () {
  ssdpClient.search('ssdp:all')
}, 1000)
