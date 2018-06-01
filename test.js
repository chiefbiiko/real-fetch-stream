var realFetchStream = require('./index')
var tape = require('tape')

tape('node stream emits data', async function (t) {
  var rfs = await realFetchStream('http://www.linux-usb.org/usb.ids')
  rfs.on('data', function (chunk) {
    t.ok(chunk.length, 'got sth')
  })
  rfs.on('end', function () {
    t.end()
  })
})
