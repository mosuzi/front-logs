import LogBean from './log-bean'

export default class CustomLogBean extends LogBean {
  customMessage: string
  constructor(type?: string, customMessage?: string) {
    super(type)
    this.customMessage = customMessage
  }
  toJSON() {
    try {
      return JSON.parse(this.customMessage)
    } catch {
      return {}
    }
  }
}
