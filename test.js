var tape = require('tape')
var realFeetchStream = require('./index')

tape('streamin', function (t) {
  var rfs = await realFetchStream('...')
  rfs.on('data', function (chunk) {
    t.ok(chunk.length, 'gettin bytes')
  })
  rfs.on('end', function () {
    t.end()
  })
})

tape('encoding', function (t) {
  t.ok(false)
  t.end()
})
