import engineDefault from './engine-default.json'
import LogBean from './log-bean'
const logsPathDefault = engineDefault.logsPathDefault

export default class LogRequest {
  url: string
  baseDomain: string
  params: unknown
  logsPath: string
  logs: LogBean[]
  constructor(
    url,
    args? : {
      baseDomain: string,
      params: unknown,
      logsPath: string,
      logs: LogBean[]
    }
  ) {
    this.url = url || ''
    this.baseDomain = args?.baseDomain || ''
    this.params = args?.params || {}
    this.logsPath = args?.logsPath || logsPathDefault
    this.logs = args?.logs || []
  }
  appendLog(log: LogBean) {
    this.logs.push(log)
  }

  setRequest({ baseDomain, url, params, logsPath }: any = {}): LogRequest {
    this.url = url || ''
    this.params = params || {}
    this.baseDomain = baseDomain || ''
    this.logsPath = logsPath || logsPathDefault
    return this
  }
  getFullUrl(): string {
    return this.baseDomain + this.url
  }
  getData(): any {
    const data: any = {}
    Object.assign(data, this.params)
    return data
  }
  toJSON(): any {
    return {
      baseDomain: this.baseDomain,
      url: this.url,
      params: this.params,
      logsPath: this.logsPath
    }
  }
}
