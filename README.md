# Fastify websocket router
WebSocket endpoints for fastify

Built on top of [fastify-websocket](https://github.com/fastify/fastify-websocket/), adds support for routing. It lets you define WebSocket endpoints like any other type of route, with different handler for each. The WebSocket support is provided by [websocket-stream](https://github.com/maxogden/websocket-stream) library.

It decorates [Fastify](https://github.com/fastify/fastify) instance with `websocket(route: string, handler: (connection: WebsocketStream, request: IncomingMessage) => void)` method.

If the client tries to reach the server on an unregistered path, the server will close the connection. (kind of "404 error")

## Example

### Server
```typescript
import Fastify from 'fastify'
import wsRouter from 'fastify-websocket-router'

const fastify = Fastify()

fastify.register(wsRouter)
fastify.register(function(instance, optons, next) {
  instance.websocket('/echo', (connection, request) => {
    connection.socket.on('message', message => {
      console.log(message)
      connection.socket.send('hi from server')
      connection.end()
    })
  })
  next()
})

fastify.listen(3000, err => {
  if(err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.info(`server listening on ${address}`)
})
```

### Client
```typescript
const client = WebSocket('ws://localhost:3000/echo')

client.socket.on('message', message => {
  console.log(message)
})

client.socket.on('open', () => {
  client.socket.send('hi from client')
})
```

## License

Licensed under [MIT](./LICENSE).
