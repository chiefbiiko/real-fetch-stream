const { Duplex, Readable } = require('stream')

class Reader extends Readable {
  constructor (reader, opts = {}) {
    super(Object.assign(opts, { objectMode: false })) // rily?
    this._reader = reader
  }
  _read () {
    var self = this
    self._reader.read()
      .then(chunk => {
        if (chunk.done) {
          self.push(null)
        } else {
          const more = self.push(chunk.value)
          if (more) self._read()
        }
      })
      .catch(self.emit.bind(self, 'error'))
  }
}

class Duplo extends Duplex {
  constructor (url, opts = {}) {
    this._chunks = []
  }
  read (size) {
    if (this._response === undefined) {
      return
    } else if (this._response) {
      
    } else if (this._response === null) {
      this.push(null)
    }
  }
  write (chunk, enc, next) {
    this._chunks.push(chunk)
    next()
  }
  final (end) {
    var self = this
    fetch(url, Object.assign(opts, { body: Buffer.concat(this._chunks) }))
      .then(res => { self._response = res }) // ..?
      .catch(reject)
  }
}

function realFetchStream (url, opts) {
  opts = Object.assign(opts || {}, {/*musthaves*/})
  return new Promise((resolve, reject) => {
    if (opts.method.toLowerCase() === 'get') {
      fetch(url, opts)
        .then(res => resolve(new Reader(res.body.getReader(), opts)))
        .catch(reject)
    } else if (opts.method.toLowerCase() === 'post') {
      // return a duplex; writing post data, reading response data
      resolve(new Duplo(url, opts))
      // resolve(concat(buf => { // writable only, want a duplex...
      //   fetch(url, Object.assign(opts, { body: buf }))
      //     .then(() => {}) // ???
      //     .catch(reject) // ??
      // }))
    } else {
      reject(new Error('unsupported HTTP method: ' + opts.method))
    }
  })
}

window.realFetchStream = realFetchStream
// module.exports = realFetchStream
