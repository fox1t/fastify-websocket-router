import { test } from 'tap'
import Fastify from 'fastify'
import WebSocket from 'websocket-stream'

import wsRouter from '../src'

test('expose a websocket', t => {
  t.plan(3)
  const fastify = Fastify()

  t.tearDown(() => fastify.close())

  fastify.register(wsRouter)
  fastify.register(function(instance, optons, next) {
    instance.websocket('/', (conn, request) => {
      conn.setEncoding('utf8')
      conn.write('hello client')
      t.tearDown(conn.destroy.bind(conn))

      conn.once('data', chunk => {
        t.equal(chunk, 'hello server')
        conn.end()
      })
    })
    next()
  })

  fastify.listen(0, err => {
    t.error(err)
    const client = WebSocket('ws://localhost:' + (fastify.server.address() as any).port)
    t.tearDown(client.destroy.bind(client))

    client.setEncoding('utf8')
    client.write('hello server')

    client.once('data', chunk => {
      t.equal(chunk, 'hello client')
      client.end()
    })
  })
})

test(`should close on unregistered path`, t => {
  t.plan(2)
  const fastify = Fastify()

  t.tearDown(() => fastify.close())

  fastify.register(wsRouter)

  fastify.register(function(instance, optons, next) {
    instance.websocket('/echo', (connection, request) => {
      connection.socket.on('message', message => {
        try {
          connection.socket.send(message)
        } catch (err) {
          connection.socket.send(err.message)
        }
      })

      t.tearDown(connection.destroy.bind(connection))
    })
    next()
  })

  fastify.listen(0, err => {
    t.error(err)
    const client = WebSocket('ws://localhost:' + (fastify.server.address() as any).port)
    t.tearDown(client.destroy.bind(client))

    client.socket.on('close', () => {
      t.pass()
    })
  })
})

test(`should open on registered path`, t => {
  t.plan(2)
  const fastify = Fastify()

  t.tearDown(() => fastify.close())

  fastify.register(wsRouter)

  fastify.register(function(instance, optons, next) {
    instance.websocket('/echo', (connection, request) => {
      connection.socket.on('message', message => {
        try {
          connection.socket.send(message)
        } catch (err) {
          connection.socket.send(err.message)
        }
      })

      t.tearDown(connection.destroy.bind(connection))
    })
    next()
  })

  fastify.listen(0, err => {
    t.error(err)
    const client = WebSocket('ws://localhost:' + (fastify.server.address() as any).port + '/echo/')
    t.tearDown(client.destroy.bind(client))

    client.socket.on('open', () => {
      t.pass()
      client.end()
    })
  })
})

test(`should send message and close`, t => {
  t.plan(5)
  const fastify = Fastify()

  t.tearDown(() => fastify.close())

  fastify.register(wsRouter)

  fastify.register(function(instance, optons, next) {
    instance.websocket('/', (connection, request) => {
      connection.socket.on('message', message => {
        t.equal(message, 'hi from client')
        connection.socket.send('hi from server')
      })

      connection.socket.on('close', () => {
        t.pass()
      })

      t.tearDown(connection.destroy.bind(connection))
    })
    next()
  })

  fastify.listen(0, err => {
    t.error(err)
    const client = WebSocket('ws://localhost:' + (fastify.server.address() as any).port + '/')
    t.tearDown(client.destroy.bind(client))
    client.socket.on('message', message => {
      t.equal(message, 'hi from server')
    })

    client.socket.on('open', () => {
      client.socket.send('hi from client')
      client.end()
    })

    client.socket.on('close', () => {
      t.pass()
    })
  })
})
