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
const DEFAULT = 'DEFAULT'

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

const send = function (defaultLogRequest: LogRequest) {
  if (this._destroyed) return
  const keys = Object.keys(this.logs)
  if (!keys.length) return
  const toBeSent: any = { ...this.logs }
  keys.map(key => {
    const data: any = {}

    const logRequestSpecified: LogRequest = defaultLogRequest || this.logRequest
    if (!logRequestSpecified) throw new Error('No log request specified!')
    if (globalRequestApi.getGlobalData instanceof Function)
      Object.assign(data, globalRequestApi.getGlobalData())
    Object.assign(data, logRequestSpecified.getData())

    let api = key.split('===')
    let request = logRequestSpecified
    if (
      (api[0] !== DEFAULT && api[0] !== logRequestSpecified.baseDomain) ||
      (api[1] !== DEFAULT && api[1] !== logRequestSpecified.url)
    ) {
      request = new LogRequest({
        baseDomain: api[0] === DEFAULT ? logRequestSpecified.baseDomain : api[0],
        url: api[1] === DEFAULT ? logRequestSpecified.url : api[1],
        logsPath: 'customLogs'
      })
    }
    data[request.logsPath] = toBeSent[key].map((item: LogBean) => ({
      ...item.toJSON(),
      id: item.id,
      time: item.time
    }))

    this.sendLogs(request.getFullUrl(), data).then(() => {
      // after sent, remove those logs
      this.removeSent(this.getLogIds(toBeSent[key]), key)
    })
  })
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
  logs: {}
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
          that.logs = {}
          if (r) {
            if (!r.length) return
            r.map(item => {
              const log = item.custom
                ? new CustomLogBean(item.type, item.message, item.domain, item.url)
                : new LogBean(item.type, item.message, item.domain, item.url)
              log.id = item.id
              log.time = item.time
              that.setLogByApi(that.logs, item.domain, item.url, log)
            })
          } else {
            console.warn('failed to open frontend logs indexedDB, logs will only store at memory')
          }
        }
      })
    })
    this.interval = 300
    this.logs = {}
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
  setLogByApi(logs: any, domain, url, log) {
    if (!domain) {
      domain = DEFAULT
    }
    const api = `${domain}===${typeof url === 'string' ? url : DEFAULT}`
    if (logs.hasOwnProperty(api) && logs[api].length) {
      logs[api].push(log)
    } else {
      logs[api] = [log]
    }
  }
  appendLog(log: LogBean, custom?: boolean) {
    if (this._destroyed) return
    this.setLogByApi(this.logs, log.domain, log.url, log)
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
  removeSent(sentLogIds, key) {
    if (this._destroyed) return
    this.logs = this.logs[key].filter((item: LogBean) => !sentLogIds.includes(item.id))
    if (this.db) {
      this.db.clear_table({ tableName })
      this.logs[key].forEach((log: LogBean) => {
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
