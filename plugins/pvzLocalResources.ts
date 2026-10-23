import { createReadStream, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import type { Connect, Plugin } from 'vite'

/** Serve the user's ignored local resource pack in dev, never copy it into dist. */
export function pvzLocalResources(): Plugin {
  const resourceDirectory = path.resolve('.tmp-pvz-portable/local-resources')
  const middleware: Connect.NextHandleFunction = (request, response, next) => {
    const pathname = (request.url || '').split('?')[0] || ''
    const match = /^\/games\/pvz-kindergarten\/native\/(resources\.json|resources-\d{2}\.zip)$/.exec(pathname)
    if (!match) return next()
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress || '')) {
      response.statusCode = 403
      response.end('Local game resources are available on this computer only.')
      return
    }
    const filename = path.join(resourceDirectory, match[1]!)
    if (!existsSync(filename)) return next()
    response.setHeader('Content-Type', filename.endsWith('.json') ? 'application/json' : 'application/zip')
    response.setHeader('Content-Length', statSync(filename).size)
    response.setHeader('Cache-Control', 'no-store')
    createReadStream(filename).on('error', () => response.destroy()).pipe(response)
  }
  return {
    name: 'pvz-local-resources',
    configureServer(server) { server.middlewares.use(middleware) },
    configurePreviewServer(server) { server.middlewares.use(middleware) },
  }
}
