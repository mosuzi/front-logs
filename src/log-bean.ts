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
  constructor(type?: string, message?: string) {
    this.id = gid()
    this.type = type || ''
    this.message = message || ''
    this.time = new Date().getTime()
  }
  toString(): string {
    return new Date(this.time).toJSON() + ':[' + this.type + '] ' + this.message
  }
  toJSON(): any {
    return {
      type: this.type,
      message: this.message,
      id: this.id,
      time: this.time
    }
  }
}
