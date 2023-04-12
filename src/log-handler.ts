import LogEngine from './log-engine'
import LogBean, { LogType } from './log-bean'
import LogRequest from './log-request'
import engineDefaultTarget from './engine-default-target.json'

export default class LogHandler {
  logEngine: LogEngine
  logRequest: LogRequest
  constructor() {
  }
  /**
   * connect to log engine,
   * if engine not exists, class Engine will auto generate it self
   */
  connect(engineTarget: string = engineDefaultTarget.target): LogHandler {
    if (!window[engineTarget]) {
      return
    } else {
      this.logEngine = window[engineTarget]
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
    const logBean = new LogBean(type, message)
    this.logEngine && this.logEngine.appendLog(logBean)
    return this
  }
  /**
   * @param log a custom log to be append into log engine
   * log must be an instance of LogBean
   */
  appendCustomLog(log: LogBean): LogHandler {
    if (!log.toJSON) {log.toJSON = () => ({})}
    this.checkConnection()
    this.logEngine && this.logEngine.appendLog(log, true)
    return this
  }
  /**
   * call log engine to send log into backend
   */
  sendLog(): LogHandler {
    this.checkConnection()
    this.logEngine && this.logEngine.send(this.logRequest)
    return this
  }
  checkConnection() {
    if (!this.logEngine)
      throw new Error('You need to connect to log engine by using connect() method!')
  }
  setRequest(logRequest: LogRequest): LogHandler {
    this.logRequest = logRequest
    return this
  }
}
