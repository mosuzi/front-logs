// ! outdated
import { describe, expect, test } from '@jest/globals'

import './types/log-engine.d.ts'
import LogBean, { LogType } from '../src/log-bean'
import LogEngine from '../src/log-engine'
import LogHandler from '../src/log-handler'
import LogRequest from '../src/log-request'

// Run x-backend-logs and listen to 3000 port

const logEngine = new LogEngine()
const logRequest: LogRequest = new LogRequest('/push/logs')
const logHandler = new LogHandler()
logHandler.setRequest(logRequest)

describe('test log engine', () => {
  logHandler.connect()
  const message1 = 'a message from handler 1'
  logHandler.appendLog(message1, LogType.INFO)
  test('push logs via LogHandler instance', () => {
    expect(window.backup.logs[0].message).toBe(message1)
    expect(window.backup.logs[0].type).toBe(LogType.INFO)
  })

  // logHandler2.connect()
  // const message2 = 'a message from handler 2'
  // logHandler2.appendLog(message2, LogType.WARN)
  // test('push logs via several LogHandler instances', () => {
  //   expect(window.backup.logs[1].message).toBe(message2)
  //   expect(window.backup.logs[1].type).toBe(LogType.WARN)
  // })

  const message3 = 'a message declared by CustomLogBean'
  class CustomLogBean extends LogBean {
    customField: string
    constructor() {
      super()
      this.customField = message3
    }
    toJSON() {
      return {
        customField: this.customField,
        time: this.time
      }
    }
  }
  const customLog = new CustomLogBean()
  // logHandler2.appendCustomLog(customLog)
  test('push custom log', () => {
    expect(window.backup.logs[2].customField).toBe(message3)
  })
})

window.backup = { logs: [...window.$XFrontLogsEngine.logs] }
logEngine.destroy()
// describe('test send logs', () => {
  
//   logHandler1.send()
//   test('send logs then log engine removes all logs', () => {
//     expect(window.$XFrontLogsEngine.logs[0]).toBe(undefined)
//     logEngine.destroy() // prevent memory leaks and make sure jest stoppable
//   })
// })
