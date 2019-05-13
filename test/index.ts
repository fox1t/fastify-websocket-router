import { test } from 'tap'
import Fastify from 'fastify'
import WebSocket from 'websocket-stream'

import wsRouter from '../src'

test('expose a websocket', t => {
  t.plan(3)
  const fastify = Fastify()

  t.tearDown(() => fastify.close())

  fastify.register(wsRouter)
  fastify.get('/', { wss: true }, ((conn, request) => {
    conn.setEncoding('utf8')
    conn.write('hello client')
    t.tearDown(conn.destroy.bind(conn))

    conn.once('data', chunk => {
      t.equal(chunk, 'hello server')
      conn.end()
    })
  }) as any)

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

test('expose a websocket with prefixed route', t => {
  t.plan(3)
  const fastify = Fastify()

  t.tearDown(() => fastify.close())

  fastify.register(wsRouter)
  fastify.register(
    function(instance, opts, next) {
      instance.get('/echo', { wss: true }, ((conn, request) => {
        conn.setEncoding('utf8')
        conn.write('hello client')
        t.tearDown(conn.destroy.bind(conn))

        conn.once('data', chunk => {
          t.equal(chunk, 'hello server')
          conn.end()
        })
      }) as any)
      next()
    },
    { prefix: '/baz' },
  )

  fastify.listen(0, err => {
    t.error(err)
    const client = WebSocket(
      'ws://localhost:' + (fastify.server.address() as any).port + '/baz/echo',
    )
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

  fastify.get('/echo', { wss: true }, ((connection, request) => {
    connection.socket.on('message', message => {
      try {
        connection.socket.send(message)
      } catch (err) {
        connection.socket.send(err.message)
      }
    })

    t.tearDown(connection.destroy.bind(connection))
  }) as any)

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

  fastify.get('/echo', { wss: true }, ((connection, request) => {
    connection.socket.on('message', message => {
      try {
        connection.socket.send(message)
      } catch (err) {
        connection.socket.send(err.message)
      }
    })

    t.tearDown(connection.destroy.bind(connection))
  }) as any)

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

  fastify.get('/', { wss: true }, ((connection, request) => {
    connection.socket.on('message', message => {
      t.equal(message, 'hi from client')
      connection.socket.send('hi from server')
    })

    connection.socket.on('close', () => {
      t.pass()
    })

    t.tearDown(connection.destroy.bind(connection))
  }) as any)

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

test(`should return 404 on http request`, async t => {
  const fastify = Fastify()

  t.tearDown(() => fastify.close())

  fastify.register(wsRouter)

  fastify.get('/', { wss: true }, ((connection, request) => {
    connection.socket.on('message', message => {
      t.equal(message, 'hi from client')
      connection.socket.send('hi from server')
    })

    connection.socket.on('close', () => {
      t.pass()
    })

    t.tearDown(connection.destroy.bind(connection))
  }) as any)

  const response = await fastify.inject({
    method: 'GET',
    url: '/',
  })
  t.equal(response.payload, '')
  t.equal(response.statusCode, 404)
  t.end()
})
