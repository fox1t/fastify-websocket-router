import 'fastify'
import { IncomingMessage } from 'http'
type Handler = (connection, request: IncomingMessage) => void

declare module 'fastify' {
  interface RouteShorthandOptions {
    wss?: boolean
  }
}
