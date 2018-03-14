const Readable = require('readable-stream')

class Reader extends Readable {

  constructor (reader, opts) {
    if (!opts) opts = {}
    opts.objectMode = false
    super(opts)
    this._reader = reader
  }

  _read () {
    var self = this
    self._reader.read()
      .then((done, value) => {
        if (done) {
          self.push(null)
        } else {
          if (self.push(value)) self._read()
        }
      })
      .catch(self.emit.bind(self, 'error'))
  }

}

async function realFetchStream (url, opts) {
  const fake = await fetch(url).then(res => res.body.getReader())
  return new Reader(fake, opts)
}

window.realFetchStream = realFetchStream
module.exports = realFetchStream