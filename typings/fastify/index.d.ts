import 'fastify'
import { IncomingMessage } from 'http'
type Handler = (connection, request: IncomingMessage) => void

declare module 'fastify' {
  interface RouteShorthandOptions {
    websocket?: boolean
    wsHandler?(connection, request: IncomingMessage): void
  }
}
