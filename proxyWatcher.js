var { EventEmitter } = require('events')

function proxyWatcher (obj) {
  var watcher = new EventEmitter()
  var handler = {
    get (target, property, receiver) {
			try {
				return new Proxy(target[property], handler)
			} catch (err) {
				return Reflect.get(target, property, receiver)
			}
		},
    defineProperty(target, property, descriptor) {
      Reflect.defineProperty(target, property, descriptor)
      return watcher.emit('set', proxy[prop])
    },
    deleteProperty(target, property) {
      Reflect.deleteProperty(target, property)
      return watcher.emit('delete', property)
    }
  }
  var proxy = new Proxy(obj, handler)
  return { proxy, watcher }
}

module.exports = proxyWatcher
