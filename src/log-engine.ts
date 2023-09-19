import lifecycle from 'page-lifecycle/dist/lifecycle.es5.js'
import Idb from 'idb-js' //  引入Idb

import LogBean from './log-bean'
import LogRequest from './log-request'
import {
  doActionDelayed,
  doActionImmediately,
  removeAction,
  setAction,
  setIntervalLength
} from './send-by-interval'
import frontLogsDBConfig from './front-logs-db-config.json'
import engineDefaultTarget from './engine-default.json'
import CustomLogBean from './custom-log-bean'
const tableName = frontLogsDBConfig.tables[0].tableName

const generateRequestBlob = function (data: any): Blob {
  return new Blob([JSON.stringify(data)], {
    type: 'application/json'
  })
}

const sendBeacon = function (url: string, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const queued = navigator.sendBeacon(url, generateRequestBlob(data))
    if (queued) resolve()
    else reject()
  })
}

const fetchLogs = function (url: string, data: any): Promise<void> {
  return fetch(url, { method: 'POST', body: generateRequestBlob(data), keepalive: true })
    .then(resp => {
      if (!resp.ok) return Promise.reject()
    })
    .catch(() => {
      return Promise.reject(new Error('failed to fetch logs'))
    })
}

const updateRequest = function (db: any, name: string, logRequest: LogRequest) {
  if (!db) return

  db.query({
    tableName,
    condition: item => item.name == name,
    success: r => {
      if (r.length) {
        db.update({
          tableName,
          condition: item => item.name === name,
          handle: r => {
            const logs = logRequest.logs.map(log => {
              return {
                ...log.toJSON(),
                id: log.id,
                time: log.time
              }
            })
            r.logs = JSON.stringify(logs)
            r.data = JSON.stringify(logRequest.toJSON())
          }
        })
      } else {
        const logs = logRequest.logs.map(log => {
          return {
            ...log.toJSON(),
            id: log.id,
            time: log.time
          }
        })
        db.insert({
          tableName,
          data: {
            name,
            logs: JSON.stringify(logs),
            data: JSON.stringify(logRequest.toJSON())
          }
        })
      }
    }
  })
}

const send = function () {
  if (this._destroyed) return
  if (!this.requestMap.size) return

  let requests = []
  this.requestMap.forEach((item, key) => {
    if (!item.logs || !item.logs.length) {
      return
    }
    const data: any = {}
    Object.assign(data, item.getData())
    data[item.logsPath] = item.logs
    requests.push(
      this.sendLogs(item.getFullUrl(), data).then(() => {
        this.removeSent(key)
      })
    )
  })
  return Promise.all(requests)
}

const isDirectInstance = function (instance, Ctor): boolean {
  if (!instance || !Ctor) return
  return instance.constructor === Ctor
}
interface LogMap {
  [index: string]: LogBean[]
}
export default class LogEngine {
  requestMap: Map<string, LogRequest>

  interval: number
  db: any
  _destroyed: boolean
  target: string
  constructor(target: string = engineDefaultTarget.target) {
    if (window[target] && !window[target]._destroyed) return window[target]
    this.target = target
    const dbHandler = new Idb(frontLogsDBConfig)
    dbHandler.then(db => {
      this.db = db
      const that = this
      db.queryAll({
        tableName,
        success(r) {
          if (r) {
            if (!that.requestMap) {
              that.requestMap = new Map()
            }
            if (!r.length) return
            r.map(item => {
              const data = JSON.parse(item.data)
              const logs = JSON.parse(item.logs)
              const request = new LogRequest(
                data.baseDomain,
                data.url,
                data.params,
                data.logsPath,
                logs
              )
              that.requestMap.set(item.name, request)
            })
          } else {
            console.warn('failed to open frontend logs indexedDB, logs will only store at memory')
          }
        }
      })
    })
    this.interval = 300
    this.requestMap = new Map()
    this.setSendInterval(this.interval)
    setAction(send.bind(this))
    // for compatible purpose, check if engine runs on firefox
    if (~navigator.userAgent.indexOf('Firefox')) {
      // engine has to use `sendBeacon()` to send logs data because firefox does not support `fetch()` with init.keepalive parameter
      this.sendLogs = sendBeacon
    } else {
      this.sendLogs = fetchLogs
    }
    window[target] = this
    lifecycle.addEventListener('statechange', this.sendListener)
  }
  destroy() {
    delete window[this.target]
    this._destroyed = true
    lifecycle.removeEventListener('statechange', this.sendListener)
    removeAction()
    if (this.db) {
      this.db.delete_db()
      this.db = null
    }
  }
  appendLog(name: string) {
    if (this._destroyed) return
    const request = this.getLogRequest(name)
    if (!request) {
      return
    }
    updateRequest(this.db, name, request)
    doActionDelayed()
  }
  setSendInterval(interval: number): LogEngine {
    this.interval = interval
    setIntervalLength(this.interval)
    return this
  }
  sendListener(event: any) {
    if (event.oldState == 'passive' && event.newState == 'hidden') {
      doActionImmediately()
    }
  }
  // send message using sendBeacon()
  // each log will be serialized via log.toJSON()
  send() {
    if (this._destroyed) return
    doActionImmediately()
  }
  // sendLogs() will be overwritten after instance constructed and become a real call-request method `fetchLogs()` or `sendBeacon()`
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendLogs(url: string, data: any): Promise<void> {
    return Promise.resolve()
  }
  removeSent(name: string) {
    if (this._destroyed) return
    this.requestMap.delete(name)
    if (this.db) {
      this.db.clear_table({ tableName })
      this.requestMap.forEach((value, key) => {
        updateRequest(this.db, key, value)
      })
    }
  }

  setLogRequest(name: string, logRequest: LogRequest) {
    this.requestMap.set(name, logRequest)
  }
  getLogRequest(name: string): LogRequest {
    return this.requestMap.get(name)
  }
}
