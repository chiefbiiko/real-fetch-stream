const { Readable, Transform } = require('stream')
const toEmitter = require('./promise-to-emitter')
const debug = require('debug')('real-fetch-stream')
debug.enabled = true

class ReaderWrapper extends Readable {

  constructor (url, opts = {}) {
    opts = Object.assign(Object.assign({}, opts), { objectMode: false }) // rily
    super(opts)
    this._opts = opts
    // this._ready = false
    this._reader = null
    this._fetcher = toEmitter(fetch(url, opts))
    this._fetcher.once('resolved', res => this._reader = res.body.getReader())
    this.once('end', () => this._reader.releaseLock())
  }

  _read () {
    // if (isPending(this._reader)) return this._reader.then(() => this._read())
    if (!this._reader) {
      return this._fetcher.once('resolved', this._read.bind(this))
    }
    this._reader.read()
      .then(chunk => {
        if (chunk.done) this.push(null)
        else if (this.push(chunk.value)) this._read()
      })
      .catch(this.emit.bind(this, 'error'))
  }

}

class DuplexWrapper extends Transform {

  constructor (url, opts) {
    opts = Object.assign(Object.assign({}, opts), { objectMode: false }) // rily
    super(opts)
    this._url = url
    this._opts = opts
    this._chunks = []
  }

  _transform (chunk, enc, next) {
    this._chunks.push(chunk)
    next()
  }

  _flush (cb) {
    var self = this
    fetch(self._url, Object.assign(self._opts, {
      body: Buffer.concat(self._chunks)
    }))
      .then(res => {
        if (!res.ok) return self.emit('error')
        const _reader = res.body.getReader()
        const _read = () => {
          _reader.read()
            .then(chunk => {
              if (chunk.done) {
                self.push(null)
                _reader.releaseLock()
                return cb()
              } else if (self.push(chunk.value)) {
                return _read()
              }
            })
            .catch(cb)
        }
        _read()
      })
      .catch(cb)
  }

}

function realFetchStream (url, opts) {
  opts = Object.assign({ method: 'get' }, opts || {})
  if (opts.method.toLowerCase() === 'get') {
    return new ReaderWrapper(url, opts)
  } else if (opts.method.toLowerCase() === 'post') {
    return new DuplexWrapper(url, opts)
  } else {
    throw new Error('unsupported HTTP method: ' + opts.method)
  }
}

// module.exports = realFetchStream
window.realFetchStream = realFetchStream // 4 bundlin only
