var realFetchStream = require('./index')

(async function () {
  console.log('node stream emits data')
  var rfs = await realFetchStream('http://www.linux-usb.org/usb.ids')
  rfs.on('data', function (chunk) {
    if (!chunk.length) throw Error('chunk.length is not truthy')
  })
})()
