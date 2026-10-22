import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'
import { parse } from '@vue/compiler-sfc'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const nativeRequire = createRequire(import.meta.url)

// Exercise the existing TS modules without a Vite build or generated project files.
function loadTs(relative, overrides = {}, environment = {}) {
  const filename = path.resolve(root, relative)
  const source = filename.endsWith('.vue')
    ? parse(readFileSync(filename, 'utf8')).descriptor.script.content
    : readFileSync(filename, 'utf8')
  const code = ts.transpileModule(source.replaceAll('import.meta.env.BASE_URL', '"/xmf.github.io/"'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  const require = (name) => {
    if (name in overrides) return overrides[name]
    if (name.startsWith('.')) return loadTs(path.resolve(path.dirname(filename), `${name}.ts`), overrides, environment)
    return nativeRequire(name)
  }
  runInNewContext(code, {
    module, exports: module.exports, require, console, URL, File, Blob, Response, TextDecoder,
    crypto: globalThis.crypto, ...environment,
  }, { filename })
  return module.exports
}

const { readDefaultReadCatalog, defaultReadCatalog } = loadTs('plugins/defaultReadCatalog.ts')
const { parseMarkdownFile, parseMarkdownBlocks, resolveMarkdownUrl } = loadTs('src/modules/reader/services/markdown.ts')
const defaultDirectory = path.join(root, 'public/default-read')

test('catalog discovers nested formats, covers, additions and content updates', () => {
  const temporary = mkdtempSync(path.join(tmpdir(), 'yumo-reader-test-'))
  try {
    mkdirSync(path.join(temporary, 'nested'))
    for (const [name, content] of Object.entries({ 'novel.TXT': '正文', 'nested/story.MD': '# 故事\n\n正文', 'nested/cover.PNG': 'image', 'book.epub': 'epub', '.hidden.md': 'hidden', 'ignored.pdf': 'pdf' })) {
      writeFileSync(path.join(temporary, name), content)
    }
    const first = readDefaultReadCatalog(temporary)
    assert.equal(first.length, 3)
    const story = first.find((entry) => entry.path === 'nested/story.MD')
    assert.equal(story.coverPath, 'nested/cover.PNG')
    writeFileSync(path.join(temporary, 'nested/story.MD'), '# 故事\n\n正文更新')
    writeFileSync(path.join(temporary, 'new.markdown'), '# 新书')
    const second = readDefaultReadCatalog(temporary)
    assert.equal(second.length, 4)
    assert.equal(second.find((entry) => entry.path === story.path).id, story.id)
    assert.notEqual(second.find((entry) => entry.path === story.path).revision, story.revision)
    assert.equal(readDefaultReadCatalog(path.join(temporary, 'missing')).length, 0)
  } finally {
    assert.equal(path.dirname(temporary), path.resolve(tmpdir()))
    assert.ok(path.basename(temporary).startsWith('yumo-reader-test-'))
    rmSync(temporary, { recursive: true, force: true })
  }
})

test('the current Markdown book preserves its author and every inline image', async () => {
  const catalog = readDefaultReadCatalog(defaultDirectory)
  const entry = catalog.find((item) => item.filename.endsWith('.md'))
  assert.ok(entry)
  const source = readFileSync(path.join(defaultDirectory, entry.path), 'utf8')
  const baseUrl = `https://example.test/xmf.github.io/default-read/${entry.path.split('/').map(encodeURIComponent).join('/')}`
  const book = await parseMarkdownFile(new File([source], entry.filename), baseUrl)
  assert.equal(book.title, '我永远失去了我的白月光')
  assert.equal(book.author, 'X队、小王')
  assert.ok(book.chapters.length > 1)
  const content = book.chapters.map((chapter) => chapter.content).join('\n\n')
  assert.equal([...content.matchAll(/!\[/g)].length, [...source.matchAll(/!\[/g)].length)
  for (const match of content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
    const imageUrl = resolveMarkdownUrl(match[1], baseUrl, true)
    assert.ok(imageUrl)
    const relative = decodeURIComponent(new URL(imageUrl).pathname).replace('/xmf.github.io/default-read/', '')
    assert.ok(existsSync(path.join(defaultDirectory, relative)), `Missing image: ${relative}`)
  }
})

test('chapter headings inside fenced code do not split a Markdown chapter', async () => {
  const source = '# 标题\n\n> 作者：测试\n\n## 第一章\n正文\n\n```js\n## 非章节\n```\n\n## 第二章\n第二段'
  const book = await parseMarkdownFile(new File([source], 'example.md'))
  assert.equal(book.chapters.length, 3)
  assert.equal(book.chapters[1].title, '第一章')
  assert.equal(book.chapters[2].title, '第二章')
  assert.ok(book.chapters[1].content.includes('## 非章节'))
  assert.equal(parseMarkdownBlocks(source).filter((block) => block.kind === 'code').length, 1)
  assert.equal(resolveMarkdownUrl('javascript:alert(1)', undefined, true), undefined)
})

test('Markdown rendering uses real image elements and escapes raw HTML', async () => {
  const component = loadTs('src/modules/reader/components/ReaderMarkdown.vue').default
  const content = '# 章节\n\n**强调** [链接](https://example.test)\n\n![](images\\中文 图片.png)\n\n<script>alert(1)</script>\n\n![bad](javascript:alert(1))'
  const html = await renderToString(createSSRApp(component, { content, baseUrl: 'https://example.test/sub/default-read/book/story.md' }))
  assert.ok(html.includes('<strong>强调</strong>'))
  assert.ok(html.includes('/sub/default-read/book/images/%E4%B8%AD%E6%96%87%20%E5%9B%BE%E7%89%87.png'))
  assert.ok(html.includes('loading="lazy"'))
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(!html.includes('<script>'))
  assert.ok(!html.includes('src="javascript:'))
})

function createDefaultLibrary(catalog, resources = new Map()) {
  const books = new Map()
  let requests = 0
  const storage = {
    getBook: async (id) => books.get(id),
    saveBook: async (book) => books.set(book.id, structuredClone(book)),
    removeBook: async (id) => books.delete(id),
  }
  const api = loadTs('src/modules/reader/services/defaultBooks.ts', {
    'virtual:default-read-catalog': { __esModule: true, default: catalog },
    './storage': storage,
  }, {
    window: { location: { href: 'https://example.test/xmf.github.io/#/read' } },
    fetch: async (url) => {
      requests += 1
      const filename = decodeURIComponent(new URL(url).pathname).replace('/xmf.github.io/default-read/', '')
      if (!resources.has(filename)) throw new Error('Unavailable book')
      return new Response(resources.get(filename), { headers: { 'Content-Type': 'text/plain' } })
    },
  })
  return { ...api, books, get requests() { return requests } }
}

test('default books are cached once, update without duplicates, and keep progress', async () => {
  const catalog = [{ id: 'default-test', path: '目录/故事.md', filename: '故事.md', revision: 'v1' }]
  const resources = new Map([[catalog[0].path, '# 故事\n\n## 一\n正文\n\n## 二\n正文二']])
  const library = createDefaultLibrary(catalog, resources)
  assert.equal((await library.syncDefaultBooks([])).length, 0)
  const book = library.books.get('default-test')
  book.currentChapter = 1
  book.currentOffset = 450
  book.updatedAt = 123
  await library.syncDefaultBooks([...library.books.values()])
  assert.equal(library.requests, 1)
  assert.equal((await library.getReaderBook(book.id)).currentOffset, 450)
  catalog[0].revision = 'v2'
  resources.set(catalog[0].path, '# 故事\n\n## 一\n更新正文\n\n## 二\n更新正文二')
  await library.syncDefaultBooks([...library.books.values()])
  assert.equal(library.books.size, 1)
  const updated = library.books.get(book.id)
  assert.equal(updated.currentChapter, 1)
  assert.equal(updated.currentOffset, 450)
  assert.equal(updated.updatedAt, 123)
  assert.equal(updated.defaultRevision, 'v2')
  assert.ok(updated.chapters[1].content.includes('更新正文二'))
})

test('deep links load a default book and unavailable entries do not block others', async () => {
  const catalog = [{ id: 'bad', path: 'bad.epub', filename: 'bad.epub', revision: '1' }, { id: 'good', path: 'good.txt', filename: 'good.txt', revision: '1' }]
  const library = createDefaultLibrary(catalog, new Map([['good.txt', '第一章 开始\n正文\n第二章 继续\n正文二']]))
  const book = await library.getReaderBook('good')
  assert.equal(book.format, 'txt')
  assert.equal(book.chapters.length, 2)
  library.books.set('local', { id: 'local', title: '手动导入' })
  library.books.set('old', { id: 'old', defaultPath: 'removed.txt' })
  const failures = await library.syncDefaultBooks([...library.books.values()])
  assert.equal(failures[0], 'bad.epub')
  assert.ok(library.books.has('good'))
  assert.ok(library.books.has('local'))
  assert.ok(!library.books.has('old'))
})

test('development file changes invalidate the virtual catalog', () => {
  const plugin = defaultReadCatalog()
  plugin.configResolved({ publicDir: path.join(root, 'public'), root })
  const listeners = new Map()
  let invalidated = 0
  let reloaded = 0
  const watcher = { add() {}, on(event, handler) { listeners.set(event, handler); return this } }
  const module = {}
  plugin.configureServer({ watcher, moduleGraph: { getModuleById: () => module, invalidateModule: () => { invalidated += 1 } }, ws: { send: () => { reloaded += 1 } } })
  listeners.get('add')(path.join(defaultDirectory, 'new.md'))
  listeners.get('change')(path.join(root, 'src/unrelated.ts'))
  listeners.get('unlink')(path.join(defaultDirectory, 'removed.epub'))
  assert.equal(invalidated, 2)
  assert.equal(reloaded, 2)
  assert.ok(plugin.load(plugin.resolveId('virtual:default-read-catalog')).startsWith('export default ['))
})

test('the actual Vite configuration resolves the catalog in reader page imports', async () => {
  const server = await createServer({
    root,
    configFile: path.join(root, 'vite.config.ts'),
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  try {
    assert.ok(server.config.plugins.some((plugin) => plugin.name === 'default-read-catalog'))
    const resolved = await server.pluginContainer.resolveId('virtual:default-read-catalog')
    assert.equal(resolved?.id, '\0virtual:default-read-catalog')
    const catalog = await server.pluginContainer.load(resolved.id)
    assert.ok(catalog)
    for (const filename of ['services/defaultBooks.ts', 'ReaderLibraryPage.vue', 'BookDetailPage.vue', 'ReaderChapterPage.vue']) {
      const result = await server.transformRequest(`/src/modules/reader/${filename}`)
      assert.ok(result?.code, `Failed Vite import analysis: ${filename}`)
    }
  } finally {
    await server.close()
  }
})
