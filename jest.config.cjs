const eventCallbacks = {}
const config = {
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest'
  },
  verbose: true,
  globals: {
    self: {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addEventListener(type, listener, options) {
      if (!(listener instanceof Function)) return
      if (!eventCallbacks[type]) eventCallbacks[type] = []
      eventCallbacks[type].push(listener)
    },
    removeEventListener(type, listener) {
      if (!eventCallbacks[type]) return
      if (!listener || !(listener instanceof Function)) delete eventCallbacks[type]
      eventCallbacks[type] = eventCallbacks[type].filter(item => item !== listener)
    },
    window: {},
    navigator: {
      sendBeacon(url, data) {
        // eslint-disable-next-line no-undef
        console.log('sent', url, data)
        return true
      },
      userAgent: 'Chrome'
    },
    document: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      addEventListener(type, listener, options) {
        if (!(listener instanceof Function)) return
        if (!eventCallbacks[type]) eventCallbacks[type] = []
        eventCallbacks[type].push(listener)
      },
      removeEventListener(type, listener) {
        if (!eventCallbacks[type]) return
        if (!listener || !(listener instanceof Function)) delete eventCallbacks[type]
        eventCallbacks[type] = eventCallbacks[type].filter(item => item !== listener)
      },
      hasFocus() {}
    },
    Blob: class {
      constructor(data) {
        this.data = data
      }
      toString() {
        return '' + this.data
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fetch(url, data) {
      return Promise.resolve({ ok: true })
    }
  }
}

// eslint-disable-next-line no-undef
module.exports = config
