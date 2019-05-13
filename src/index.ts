import { Server, IncomingMessage, ServerResponse } from 'http'
import fp from 'fastify-plugin'
import ws from 'fastify-websocket'
import findMyWay from 'find-my-way'

const kWs = Symbol('ws')

export = fp<Server, IncomingMessage, ServerResponse, {}>(
  function(fastify, opts, next) {
    const router = findMyWay({
      ignoreTrailingSlash: true,
      defaultRoute: (req, res) => {
        req[kWs].socket.close()
      },
    })

    function handle(connection, request) {
      const response = new ServerResponse(request)
      request[kWs] = connection
      router.lookup(request, response)
    }

    fastify.register(ws, { handle })

    fastify.addHook('onRoute', routeOptions => {
      if (routeOptions.websocket) {
        const oldHandler = routeOptions.handler as any
        router.on('GET', routeOptions.path, (req, _) => oldHandler(req[kWs], req))
        routeOptions.handler = function(request, reply) {
          reply.code(404).send()
        }
      } else if (routeOptions.wsHandler) {
        if (typeof routeOptions.wsHandler !== 'function') {
          throw new Error('Invalid wsHandler function')
        }
        router.on('GET', routeOptions.path, (req, _) => routeOptions.wsHandler!(req[kWs], req))
      }
    })

    next()
  },
  {
    fastify: '>=2.0.0',
    name: 'fastify-websocket-router',
  },
)
