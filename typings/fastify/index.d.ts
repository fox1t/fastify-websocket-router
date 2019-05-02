import 'fastify'
import { IncomingMessage } from 'http'
type Handler = (connection, request: IncomingMessage) => void

declare module 'fastify' {
  interface FastifyInstance<HttpServer, HttpRequest, HttpResponse> {
    websocket(route: string, handler: Handler): void
  }
}
