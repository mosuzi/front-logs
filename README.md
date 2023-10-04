# Front Logs

Frontend log engine with ability to send logs to server, auto retry when error occurs, use indexedDB to cache logs and auto resend

## Startup

`npm install --save front-logs`

> To develop, require Node >= 14

## Usage

### Case

```javascript
import { LogEngine, LogBean, LogRequest, LogHandler } from 'front-logs'

const engine = new LogEngine() // start log engine

const handler = new LogHandler()
handler.connect() // connect to log engine

const request = new LogRequest({
  baseDomain: 'http://localhost:3000',
  url: '/push/logs',
}) 
handler.setRequest(request, name) // bind handle and request

const log = new LogBean('custom', 'custom log content')
handler.appendCustomLog(log) // update request's logs

if (!handler.logEngine) return // if connection failed, means engine does not exist and log will not be sent

handler.send() // call engine to send log to server

engine.destroy() // call destroy if engine is not used any more for preventing memory leaks
```

### LogEngine

```typescript
constructor(target: string = '$XFrontLogsEngine') {}
```

Log engine controls log to send, auto retry, cached using indexedDB and resend

target: indicates where log engine mounts itself, defaults to `window.$XFrontLogsEngine`
> requestMap: Map<string, LogRequest>: engine has a member to store requests, each request has its logs

| Method | Arguments | ReturnValue | Description |
| --- | --- | --- | --- |
| appendRequestByName | name: string | void | Get logRequest by name, then update indexedDB |
| setLogRequest | name: string, logRequest: LogRequest | void | update requestMap by map key |
| getLogRequest | name: string | LogRequest | get logRequest by name |
| setSendInterval | interval: number(s) | LogEngine | defaults to 300(s, 5 minutes) |
| send | LogRequest | void | Send log immediately if engine is available |
| destroy | void | void | Destroy an engine instance and cancel all event listeners |

### LogHandler

```typescript
constructor() {}
```

Log handler proxies log actions to append and send logs wherever

| Method | Arguments | ReturnValue | Description |
| --- | --- | --- | --- |
| connect | engineTarget | LogHandler | Connect to log engine, any first time you want to use log handler, you should call this method. The engineTarget indicates where to find a log engine instance |
| appendLog | message: string, type: string | LogHandler | Append a log to request and call engine to update engine's requestMap |
| appendCustomLog | LogBean | LogHandler | Append a custom log to request and call engine to update engine's requestMap |
| send | void | LogHandler | Call engine to send log immediately |
| setRequest | LogRequest, name | LogHandler | Set request of handler, and append request to engine |
| getRequest | name | LogRequest | get logRequest by name from engine |

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
constructor(
    public baseDomain = '',
    public url = '',
    public params = {},
    public logsPath = logsPathDefault,
    public logs: LogBean[] = []
  ) {}
```

Log request specifies data while send request

| Method | Arguments | ReturnValue | Description |
| --- | --- | --- | --- |
| setRequest | { baseDomain, url, params, logsPath } | LogRequest | Set every parameter of request |
| getFullUrl | void | string | Return full url of a request. Equals to baseDomain + url |
| getData | void | any | Return params of request. |
| appendLog | LogBean | void | Append request's log |
| toJSON | void | object | Indicates how to transform request into JSON. Defaults to transform request baseDomain, url, params and logsPath |

## Simple Demo

```shell
npm run build:demo
```

Run code above to generate browser.js under public directory and run a web server under this project to access public/index.html

Suggest `Live Server` which is an extension of VS code editor. In this case, access <http://127.0.0.1:5500/public/index.html> to see a very simple demo
