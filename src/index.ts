import { Server, IncomingMessage, ServerResponse } from 'http'
import fp from 'fastify-plugin'
import ws from 'fastify-websocket'
import findMyWay from 'find-my-way'

type Handler = (connection, request: IncomingMessage) => void

const kWs = Symbol('ws')

export = fp<Server, IncomingMessage, ServerResponse, {}>(
  function(fastify, opts, next) {
    const router = findMyWay({
      ignoreTrailingSlash: true,
      defaultRoute: (req, res) => {
        req[kWs].socket.close()
      },
    })

    function addWsRoute(route: string, handler: Handler) {
      router.on('GET', route, (req, _) => handler(req[kWs], req))
    }
    function handle(connection, request) {
      const response = new ServerResponse(request)
      request[kWs] = connection
      router.lookup(request, response)
    }

    fastify.register(ws, { handle })

    fastify.decorate('websocket', addWsRoute)

    next()
  },
  {
    fastify: '>=2.0.0',
    name: 'fastify-websocket-router',
  },
)
