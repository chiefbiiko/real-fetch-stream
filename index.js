const { Readable } = require('stream')
const concat = require('concat-stream')

class Reader extends Readable {
  constructor (reader, opts = {}) {
    super(Object.assign(opts, { objectMode: false }))
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

function realFetchStream (url, opts) {
  return new Promise((resolve, reject) => {
    if (opts.method.toLowerCase() === 'get') {
      fetch(url, opts)
        .then(res => resolve(new Reader(res.body.getReader(), opts)))
        .catch(reject)
    } else if (opts.method.toLowerCase() === 'post') {
      resolve(concat(buf => {
        fetch(url, {
          method: 'post',
          body: buf
        })
          .then(() => {}) // ???
          .catch(() => {}) // ??
      }))
    }
  })
}

window.realFetchStream = realFetchStream
// module.exports = realFetchStream
