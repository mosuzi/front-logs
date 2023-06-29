import lifecycle from 'page-lifecycle/dist/lifecycle.es5.js'
import Idb from 'idb-js' //  引入Idb

import LogBean from './log-bean'
import LogRequest from './log-request'
import { globalRequestApi } from './global-request'
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

interface LogMap {
  [index: string]: LogBean[]
}
const send = function (logRequest: LogRequest) {
  if (this._destroyed) return
  if (!this.logs.length) return
  const logRequestSpecified: LogRequest = logRequest || this.logRequest
  if (!logRequestSpecified) throw new Error('No log request specified!')

  // 数组分组
  let toBeSent: LogMap = {}
  this.logs.map(log => {
    const fullPath = `${
      typeof log.domain === 'string' ? log.domain : logRequestSpecified.baseDomain
    }====${typeof log.url === 'string' ? log.url : logRequestSpecified.url}`
    if (toBeSent[fullPath] && toBeSent[fullPath] instanceof Array) {
      toBeSent[fullPath].push(log)
    } else {
      toBeSent[fullPath] = [log]
    }
  })

  const apis = Object.keys(toBeSent).map(key => {
    const data: any = {}
    if (globalRequestApi.getGlobalData instanceof Function)
      Object.assign(data, globalRequestApi.getGlobalData())

    const path = key.split('====')
    const request = new LogRequest({
      baseDomain: path[0],
      url: path[1],
      logsPath: 'customLogs'
    })
    Object.assign(data, request.getData())

    data[request.logsPath] = toBeSent[key].map((item: LogBean) => ({
      ...item.toJSON(),
      id: item.id,
      time: item.time
    }))
    return this.sendLogs(request.getFullUrl(), data).then(() => {
      this.removeSent(this.getLogIds(toBeSent[key]))
    })
  })
  return Promise.all(apis)
}

const insertLog = function (db: any, log: LogBean, custom?: boolean) {
  if (!db) return
  db.insert({
    tableName,
    data: {
      message: JSON.stringify(log.toJSON()),
      time: log.time,
      id: log.id,
      domain: log.domain,
      url: log.url,
      custom
    }
  })
}

const isDirectInstance = function (instance, Ctor): boolean {
  if (!instance || !Ctor) return
  return instance.constructor === Ctor
}

export default class LogEngine {
  logs: LogBean[]
  // steps: number
  logRequest: LogRequest
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
            if (!r.length) return
            that.logs = r.map(item => {
              const log = item.custom
                ? new CustomLogBean(item.type, item.message, item.domain, item.url)
                : new LogBean(item.type, item.message, item.domain, item.url)
              log.id = item.id
              log.time = item.time
              return log
            })
          } else {
            console.warn('failed to open frontend logs indexedDB, logs will only store at memory')
          }
        }
      })
    })
    this.interval = 300
    this.logs = []
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
  appendLog(log: LogBean, custom?: boolean) {
    if (this._destroyed) return
    this.logs.push(log)
    insertLog(this.db, log, custom)
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
  send(logRequest?: LogRequest) {
    if (this._destroyed) return
    doActionImmediately(undefined, logRequest)
  }
  // sendLogs() will be overwritten after instance constructed and become a real call-request method `fetchLogs()` or `sendBeacon()`
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendLogs(url: string, data: any): Promise<void> {
    return Promise.resolve()
  }
  removeSent(sentLogIds) {
    if (this._destroyed) return
    this.logs = this.logs.filter((item: LogBean) => !sentLogIds.includes(item.id))
    if (this.db) {
      this.db.clear_table({ tableName })
      this.logs.forEach((log: LogBean) => {
        insertLog(this.db, log, !isDirectInstance(log, LogBean))
      })
    }
  }
  getLogIds(logs: LogBean[]): string[] {
    return logs.map((item: LogBean) => item.id)
  }
  setLogRequest(logRequest: LogRequest): LogEngine {
    if (!logRequest.baseDomain) logRequest.baseDomain = globalRequestApi.baseDomain
    if (!logRequest.getGlobalData) logRequest.getGlobalData = globalRequestApi.getGlobalData
    this.logRequest = logRequest
    return this
  }
}
