import engineDefault from './engine-default.json'
const logsPathDefault = engineDefault.logsPathDefault
import GlobalRequest, { globalRequestApi } from './global-request'

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
    const data:any = {}
    if (globalRequestApi.getGlobalData instanceof Function) Object.assign(data, globalRequestApi.getGlobalData())
    if (this.getGlobalData instanceof Function) Object.assign(data, this.getGlobalData())
    Object.assign(data, this.params)
    return data
  }
}
