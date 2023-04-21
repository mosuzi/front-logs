import engineDefault from './engine-default.json'
const logsPathDefault = engineDefault.logsPathDefault

export default class GlobalRequest {
  getGlobalData: (...args: any) => {}
  baseDomain: string
  logsPath: string
  constructor(baseDomain?: string, getGlobalData?: any, logsPath?: string) {
    this.getGlobalData = getGlobalData
    this.baseDomain = baseDomain || ''
    this.logsPath = logsPath || logsPathDefault
  }
}

const globalRequestApi: GlobalRequest = new GlobalRequest()

export { globalRequestApi }
