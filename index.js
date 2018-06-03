const { Duplex, Readable } = require('stream')
const debug = require('debug')('real-fetch-stream')

// TODO: reimplement Duplo via a Transform

debug.enabled = true

class Reader extends Readable {

  constructor (reader, opts = {}) {
    super(Object.assign(opts, { objectMode: false })) // rily?
    this._reader = reader
    this.once('end', () => this._reader.releaseLock())
  }

  _read () {
    var self = this
    self._reader.read()
      .then(chunk => {
        if (chunk.done) self.push(null)
        else if (self.push(chunk.value)) self._read()
      })
      .catch(self.emit.bind(self, 'error'))
  }

}

class Duplo extends Duplex {

  constructor (url, opts = {}) {
    super(Object.assign(opts, { objectMode: false })) // rily?
    this._url = url
    this._opts = opts
    this._chunks = []
  }

  _read (size) {
    debug('::readin::')
    var self = this
    if (!self._response) {
      debug('::response still undefined::')
      // return
      return self.once('_response', () => {
        self._response.body.read()
          .then(chunk => {
            if (chunk.done) self.push(null)
            else if (self.push(chunk.value)) self._read()
          })
          .catch(self.emit.bind(self, 'error'))
      })
    } else if (self._response) {
      debug('::response is truthy::')
      self._response.body.read()
        .then(chunk => {
          if (chunk.done) self.push(null)
          else if (self.push(chunk.value)) self._read()
        })
        .catch(self.emit.bind(self, 'error'))
    }
  }

  _write (chunk, enc, next) {
    this._chunks.push(chunk)
    next()
  }

  _final (end) {
    var self = this
    fetch(self._url, Object.assign(self._opts, {
      body: Buffer.concat(self._chunks)
    }))
      .then(res => {
        if (!res.ok) self.emit('error')
        self._response = res
        self.emit('_response')
        end()
      })
      .catch(self.emit.bind(self, 'error'))
  }

}

function realFetchStream (url, opts) {
  opts = Object.assign({ method: 'get' }, opts || {})
  return new Promise((resolve, reject) => {
    if (opts.method.toLowerCase() === 'get') {
      fetch(url, opts)
        .then(res => resolve(new Reader(res.body.getReader(), opts)))
        .catch(reject)
    } else if (opts.method.toLowerCase() === 'post') {
      resolve(new Duplo(url, opts))
    } else {
      reject(new Error('unsupported HTTP method: ' + opts.method))
    }
  })
}

module.exports = realFetchStream
// window.realFetchStream = realFetchStream // 4 bundlin only
