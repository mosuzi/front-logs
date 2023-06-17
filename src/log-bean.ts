import { gid } from './utils/uuid.util'
export const enum LogType {
  VERBOSE = 'VERBOSE',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export default class LogBean {
  id: string
  type: string
  message: string
  time: number
  // 新增接口相关参数
  domain: string
  url: string
  constructor(type?: string, message?: string, domain?: string, url?: string) {
    this.id = gid()
    this.type = type || ''
    this.message = message || ''
    this.time = new Date().getTime()
    // 新增接口相关参数
    this.domain = domain
    this.url = url
  }
  toString(): string {
    return new Date(this.time).toJSON() + ':[' + this.type + '] ' + this.message
  }
  toJSON(): any {
    return {
      type: this.type,
      message: this.message
    }
  }
}
