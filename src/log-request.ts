const logsPathDefault = 'logs'
export class GlobalRequest {
  getGlobalData: (...args: any) => ({})
  baseDomain: string
  logsPath: string
  constructor(baseDomain?: string, getGlobalData?: any, logsPath?: string) {
    this.getGlobalData = getGlobalData || (() => ({}))
    this.baseDomain = baseDomain || ''
    this.logsPath = logsPath || logsPathDefault
  }
}

const globalRequestApi: GlobalRequest = new GlobalRequest()

export default class LogRequest extends GlobalRequest {
  url: string
  params: object
  static setGlobalArguments({ baseDomain, getGlobalData }: any = {}) {
    if (baseDomain) globalRequestApi.baseDomain = baseDomain
    if (getGlobalData) globalRequestApi.getGlobalData = getGlobalData
  }
  constructor({
    baseDomain,
    url,
    params,
    logsPath
  }: { baseDomain?: string; url?: string; params?: any, logsPath?: string } = {}) {
    super(baseDomain, undefined, logsPath)
    this.url = url || ''
    this.params = params || {}
  }
  setRequest({ baseDomain, url, params, logsPath }: any = {}): LogRequest {
    this.url = url || ''
    this.params = params || {}
    this.baseDomain = baseDomain || ''
    this.logsPath = logsPath || logsPathDefault
    return this
  }
  getFullUrl(): string {
    return (this.baseDomain || globalRequestApi.baseDomain) + (this.url || '')
  }
  getData(): any {
    return {
      ...globalRequestApi.getGlobalData(),
      ...this.params
    }
  }
}
