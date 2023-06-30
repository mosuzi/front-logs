import LogEngine from './log-engine'
import LogBean, { LogType } from './log-bean'
import LogRequest from './log-request'
import engineDefaultTarget from './engine-default.json'

export default class LogHandler {
  logEngine: LogEngine
  logRequest: LogRequest
  requestName: string
  unsentRequest: LogRequest
  unsentName: string

  constructor() {}
  /**
   * connect to log engine,
   * if engine not exists, class Engine will auto generate it self
   */
  connect(engineTarget: string = engineDefaultTarget.target): LogHandler {
    if (!window[engineTarget]) {
      console.error(' no logEngine')
      return
    } else {
      this.logEngine = window[engineTarget]
      if (this.unsentRequest) {
        this.setRequest(this.unsentRequest, this.unsentName)
      }
    }
    return this
  }
  /**
   * @param message log message
   * @param type log type
   *
   * append a log into log engine
   */
  appendLog(message: string, type: string = LogType.INFO): LogHandler {
    this.checkConnection()
    if (!this.checkRequest()) {
      throw new Error('You need to connect to log request by using setRequest(...args) method!')
    }

    const logBean = new LogBean(type, message)
    this.logRequest && this.logRequest.appendLog(logBean)
    this.logEngine && this.logEngine.appendLog(this.requestName)
    return this
  }
  /**
   * @param log a custom log to be append into log engine
   * log must be an instance of LogBean
   */
  appendCustomLog(log: LogBean): LogHandler {
    if (!log.toJSON) {
      log.toJSON = () => ({})
    }
    this.checkConnection()
    if (!this.checkRequest()) {
      throw new Error('You need to connect to log request by using setRequest(...args) method!')
    }

    this.logRequest && this.logRequest.appendLog(log)
    this.logEngine && this.logEngine.appendLog(this.requestName)

    return this
  }
  /**
   * call log engine to send log into backend
   */
  send(): LogHandler {
    this.checkConnection()
    if (!this.checkRequest()) {
      throw new Error('You need to connect to log request by using setRequest(...args) method!')
    }
    this.logEngine && this.logEngine.send()
    return this
  }
  checkConnection() {
    if (!this.logEngine)
      throw new Error('You need to connect to log engine by using connect() method!')
  }
  checkRequest() {
    if (!this.logRequest) {
      return false
    } else {
      return true
    }
  }
  setRequest(logRequest: LogRequest, name = 'DEFAULT'): LogHandler {
    if (!this.logEngine) {
      this.unsentRequest = logRequest
      this.unsentName = name
    } else {
      this.logRequest = logRequest
      this.requestName = name
      this.logEngine.setLogRequest(name, logRequest)
    }
    return this
  }
  getRequest(name = 'DEFAULT'): LogRequest {
    this.checkConnection()
    return this.logEngine.getLogRequest(name)
  }
}
