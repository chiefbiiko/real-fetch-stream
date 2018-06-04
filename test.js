var realFetchStream = require('./index')
var tape = require('tape')

tape('get', function (t) {
  var rfs = realFetchStream('https://api.github.com/users')
  rfs.on('data', function (chunk) {
    t.ok(chunk.length, 'got sth')
  })
  rfs.on('end', function () {
    t.end()
  })
})

tape('post', function (t) {
  var endpoint = 'https://jsonplaceholder.typicode.com/posts'
  var rfs = realFetchStream(endpoint, { method: 'post' })
  rfs.on('data', function (chunk) {
    t.ok(chunk.length, 'got some response')
  })
  rfs.on('end', function () {
    t.end()
  })
  rfs.write('hello server')
  rfs.end('!')
})

tape('headers', function (t) {
  var rfs = realFetchStream('https://api.github.com/users/chiefbiiko')
  rfs.on('data', function (chunk) {
    t.ok(chunk.length, 'in chunks')
  })
  rfs.on('headers', function (headers) {
    t.is(headers.constructor, Object, 'normal pojo')
  })
  rfs.on('end', function () {
    t.end()
  })
})
