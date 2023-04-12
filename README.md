# Front Logs

Frontend log engine with ability to send logs to server, auto retry when error occurs, use indexedDB to cache logs and auto resend

## Startup

> require Node >= 14

`npm install --save front-logs`

## Usage

### Case

```javascript
import { LogEngine, LogBean, LogRequest, LogHandler } from 'front-logs'

const engine = new LogEngine() // start log engine

const request = new LogRequest({
  baseDomain: 'http://localhost:3000',
  url: '/push/logs',
  params: { logs: [] }
}) // init log request
engine.setLogRequest(request) // register request as a default request of engine

const handler = new LogHandler()
handler.connect() // connect to log engine

const log = new LogBean('This is a warning', 'WARN')
handler.appendLog(log) // log
handler.sendLog() // call engine to send log to server

engine.destroy() // call destroy if engine is not used any more for preventing memory leaks
```

### LogEngine

```typescript
constructor(target: string = '$XFrontLogsEngine') {}
```

Log engine controls log to send, auto retry, cached using indexedDB and resend

target: indicates where log engine mounts itself, defaults to `window.$XFrontLogsEngine`

| Method | Arguments | ReturnValue | Description |
| --- | --- | --- | --- |
| appendLog | LogBean, custom: boolean | void | Append a log to engine, if auto send is not initialed, auto send will start. The second parameter indicates if this log is a custom log |
| setSendInterval | interval: number(s) | LogEngine | defaults to 300(s, 5 minutes) |
| send | LogRequest | void | Send log immediately if engine is available |
| setLogRequest | LogRequest | LogEngine | Set default request of an engine |
| destroy | void | void | Destroy an engine instance and cancel all event listeners |

### LogHandler

```typescript
constructor() {}
```

Log handler proxies log actions to append and send logs wherever

| Method | Arguments | ReturnValue | Description |
| --- | --- | --- | --- |
| connect | engineTarget | LogHandler | Connect to log engine, any first time you want to use log handler, you should call this method. The engineTarget indicates where to find a log engine instance |
| appendLog | message: string, type: string | LogHandler | Append a log to engine |
| appendCustomLog | LogBean | LogHandler | Append a custom log to engine |
| sendLog | void | LogHandler | Call engine to send log immediately |
| setRequest | LogRequest | LogHandler | Set request of handler, if specified, every time use this handler to send log will use this request |

### LogBean

```typescript
constructor(type?: string, message?: string) {}
```

Class for bearing log content. Auto generate log id and timestamp

| Method | Arguments | ReturnValue | Description |
| --- | --- | --- | --- |
| toJSON | void | object | Indicates how to transform log into JSON. Defaults to transform log type and message |

For custom log, create a class extends LogBean and overwritten toJSON()

> Note: Needn't transform log id and timestamp those are sent automatically

### LogRequest

```typescript
constructor({ baseDomain, url, params }: { baseDomain?: string, url?: string, params?: any }) {}
```

Log request specifies data while send request

| Method | Arguments | ReturnValue | Description |
| --- | --- | --- | --- |
| setRequest | {baseDomain?: string, url?: string, params?: any } | LogRequest | Set every parameter of request |
| getFullUrl | void | string | Return full url of a request. Equals to baseDomain + url |
| getData | void | any | Return data of request. Data will merge data of globalArguments |
| setGlobalArguments | { baseDomain, globalData } | void | See detailed Information below |

#### GlobalArguments

Most cases, there are some public parameters that every request should carry them such as `xdaptoken`

The reason this project don't use headers for carrying them is for compatible of `sendBeacon()` which does not support custom request headers

Turn to use setGlobalArguments to set them. For example:

```javascript
LogRequest.setGlobalArguments({ baseDomain, globalData })
```

**Global Arguments only effects those log request instances constructed after called setGlobalArguments()**

## Simple Demo

```shell
npm run build:demo
```

Run code above to generate browser.js under public directory and run a web server under this project to access public/index.html

Suggest `Live Server` which is an extension of VS code editor. In this case, access http://127.0.0.1:5500/public/index.html to see a very simple demo
