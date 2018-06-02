var realFetchStream = require('./index')
var tape = require('tape')

tape('get', async function (t) {
  var endpoint = 'https://api.github.com/users'
  var rfs = await realFetchStream(endpoint)
  rfs.on('data', function (chunk) {
    t.ok(chunk.length, 'got sth')
  })
  rfs.on('end', function () {
    t.end()
  })
})

tape('post', async function (t) {
  var endpoint = 'https://jsonplaceholder.typicode.com/posts'
  var rfs = await realFetchStream(endpoint, { method: 'post' })
  rfs.on('data', function (chunk) {
    t.ok(chunk.length, 'got some response')
  })
  rfs.on('end', function () {
    t.end()
  })
  rfs.write('hello server')
  rfs.end('!')
})
