const { Readable, Transform } = require('stream')
const toEmitter = require('./promise-to-emitter')
const debug = require('debug')('real-fetch-stream')
debug.enabled = true

/* TODO:
+ think about mime types and allowing objectMode
+ emit response headers
+ readme
*/

class ReaderWrapper extends Readable {

  constructor (url, opts = {}) {
    opts = Object.assign(Object.assign({}, opts), { objectMode: false }) // rily
    super(opts)
    this._reader = null
    this._fetcher = toEmitter(fetch(url, opts))
    this._fetcher.once('resolved', res => this._reader = res.body.getReader())
    this.once('end', () => this._reader.releaseLock())
  }

  _read () {
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
    fetch(this._url, Object.assign(this._opts, {
      body: Buffer.concat(this._chunks)
    }))
      .then(res => {
        if (!res.ok) return this.emit('error')
        const _reader = res.body.getReader()
        const _read = () => {
          _reader.read()
            .then(chunk => {
              if (chunk.done) {
                this.push(null)
                _reader.releaseLock()
                return cb()
              } else if (this.push(chunk.value)) {
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

const realFetchStream = (url, opts) => {
  opts = Object.assign({ method: 'get' }, opts || {})
  const method = opts.method.trim().toLowerCase()
  if (method === 'get') return new ReaderWrapper(url, opts)
  else if (method === 'post') return new DuplexWrapper(url, opts)
  else throw new Error('unsupported HTTP method: ' + method)
}

module.exports = realFetchStream
