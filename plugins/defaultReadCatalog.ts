import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const moduleId = 'virtual:default-read-catalog'
const resolvedModuleId = `\0${moduleId}`
const bookExtensions = new Set(['.md', '.markdown', '.txt', '.text', '.epub'])
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']

export function readDefaultReadCatalog(directory: string) {
  const files: string[] = []
  function visit(folder: string) {
    if (!existsSync(folder)) return
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue
      const filename = path.join(folder, entry.name)
      if (entry.isDirectory()) visit(filename)
      else if (entry.isFile()) files.push(filename)
    }
  }
  visit(directory)
  files.sort((a, b) => a.localeCompare(b, 'zh-CN'))
  const available = new Map(files.map((file) => [file.toLowerCase(), file]))
  return files.filter((file) => bookExtensions.has(path.extname(file).toLowerCase())).map((file) => {
    const extension = path.extname(file)
    const filename = path.basename(file)
    const stem = filename.slice(0, -extension.length)
    const relativePath = path.relative(directory, file).split(path.sep).join('/')
    const cover = [stem, 'cover', '封面'].flatMap((name) =>
      imageExtensions.map((imageExtension) => available.get(path.join(path.dirname(file), `${name}${imageExtension}`).toLowerCase())),
    ).find((candidate): candidate is string => Boolean(candidate))
    return {
      id: `default-${createHash('sha256').update(relativePath).digest('hex').slice(0, 24)}`,
      path: relativePath,
      filename,
      revision: createHash('sha256').update(readFileSync(file)).digest('hex'),
      ...(cover ? { coverPath: path.relative(directory, cover).split(path.sep).join('/') } : {}),
    }
  })
}

/** The browser receives a file catalog; public assets stay at their original URLs. */
export function defaultReadCatalog(): Plugin {
  let directory = ''
  return {
    name: 'default-read-catalog',
    configResolved(config) {
      directory = path.resolve(config.publicDir || path.join(config.root, 'public'), 'default-read')
    },
    resolveId(id) {
      if (id === moduleId) return resolvedModuleId
    },
    load(id) {
      if (id !== resolvedModuleId) return
      return `export default ${JSON.stringify(readDefaultReadCatalog(directory))}`
    },
    configureServer(server) {
      server.watcher.add(directory)
      const refresh = (filename: string) => {
        const relative = path.relative(directory, filename)
        if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return
        const extension = path.extname(filename).toLowerCase()
        if (!bookExtensions.has(extension) && !imageExtensions.includes(extension)) return
        const module = server.moduleGraph.getModuleById(resolvedModuleId)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload', path: '*' })
      }
      server.watcher.on('add', refresh).on('change', refresh).on('unlink', refresh)
      server.httpServer?.once('close', () => {
        server.watcher.off('add', refresh).off('change', refresh).off('unlink', refresh)
      })
    },
  }
}
