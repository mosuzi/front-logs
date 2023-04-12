let intervalLength = 300 // 5 minutes
let action = function (...args: any): any {}
let timeoutId = undefined
let retryTimes = 3

const setIntervalLength = function (il: number): void {
  intervalLength = il
}

const setAction = function (ac: (...args) => any): void {
  action = ac
}

const setRetryTimes = function (rt: number): void {
  retryTimes = rt
}

const consoleLogRetryInfo = function (tryTimes: number) {
  console.warn('retrying...leftover ' + tryTimes + ' time(s)')
}

const doActionImmediately = function (retryCount: number = retryTimes, ...args: any): any {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = undefined
  }
  if (retryCount < 0) {
    console.warn('pause to fetch log until network is available')
    return // consider that stop action or no network available
  }
  doAction(retryCount, ...args)
}

const doActionDelayed = function (retryCount: number = retryTimes, ...args: any): any {
  if (retryCount < 0) {
    console.warn('pause to fetch log until network is available')
    return // consider that stop action or no network available
  }
  if (timeoutId) return
  timeoutId = setTimeout(() => {
    timeoutId = undefined
    doAction(retryCount, ...args)
  }, intervalLength * 1000)
}

const removeAction = function (): void {
  clearTimeout(timeoutId)
  action = function (...args: any): any {}
}

const doAction = function (retryCount: number = retryTimes, ...args: any): any {
  const r = action(...args)
  if (r instanceof Promise) {
    r.then(() => {
      doActionDelayed(undefined, ...args)
    }).catch(() => {
      consoleLogRetryInfo(retryCount)
      retryCount--
      doActionDelayed(retryCount, ...args)
    })
  } else {
    if (r === undefined || r) {
      doActionDelayed(undefined, ...args)
    } else {
      consoleLogRetryInfo(retryCount)
      retryCount--
      doActionDelayed(retryCount, ...args)
    }
  }
}

export {
  setAction,
  setIntervalLength,
  setRetryTimes,
  doActionDelayed,
  doActionImmediately,
  removeAction
}
