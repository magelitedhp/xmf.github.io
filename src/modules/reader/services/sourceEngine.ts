import type { BookSource, LibraryBook, OnlineSearchResult } from '../types'
import { createId } from './txt'

type SourceInput = Partial<BookSource> & { disabled?: boolean }

function resolveUrl(value: string, base: string) {
  try { return new URL(value, base).href } catch { return value }
}

function proxyUrl(url: string, proxy = '') {
  if (!proxy.trim()) return url
  if (proxy.includes('{{url}}')) return proxy.split('{{url}}').join(encodeURIComponent(url))
  return `${proxy}${proxy.endsWith('=') || proxy.endsWith('?') ? encodeURIComponent(url) : url}`
}

function formatValue(template: string, value: string) {
  const encoded = encodeURIComponent(value)
  return template.split('%s').join(encoded).split('{{keyword}}').join(encoded).split('{keyword}').join(encoded)
}

function parsePostData(template: string, keyword: string) {
  const body = template.trim().replace(/^\{/, '').replace(/\}$/, '')
  const parameters = new URLSearchParams()
  body.split(',').forEach((pair) => {
    const separator = pair.indexOf(':')
    if (separator < 0) return
    const key = pair.slice(0, separator).trim().replace(/^['"]|['"]$/g, '')
    const value = pair.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
      .split('%s').join(keyword).split('{{keyword}}').join(keyword).split('{keyword}').join(keyword)
    if (key) parameters.set(key, value)
  })
  return parameters
}

async function requestHtml(url: string, source: BookSource, init?: RequestInit) {
  const response = await fetch(proxyUrl(url, source.corsProxy), {
    ...init,
    headers: { Accept: 'text/html,application/xhtml+xml', ...(init?.headers ?? {}) },
  })
  if (!response.ok) throw new Error(`${source.name} 返回 HTTP ${response.status}`)
  return new DOMParser().parseFromString(await response.text(), 'text/html')
}

function splitSelector(rule = '') {
  const match = rule.match(/^(.*)@(href|src|content|value|text)$/i)
  return { selector: match?.[1] || rule, attribute: match?.[2]?.toLowerCase() }
}

function selectAll(root: ParentNode, rule = ''): Element[] {
  const { selector } = splitSelector(rule)
  if (!selector) return []
  try {
    if ((selector.startsWith('/') || selector.startsWith('xpath:')) && root instanceof Document) {
      const expression = selector.replace(/^xpath:/, '')
      const result = root.evaluate(expression, root, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE)
      return Array.from({ length: result.snapshotLength }, (_, index) => result.snapshotItem(index)).filter((node): node is Element => node instanceof Element)
    }
    return Array.from(root.querySelectorAll(selector))
  } catch {
    return []
  }
}

function extract(root: ParentNode, rule = '', base = '') {
  if (!rule) return ''
  const { attribute } = splitSelector(rule)
  const element = selectAll(root, rule)[0]
  if (!element) return ''
  if (attribute && attribute !== 'text') {
    const value = element.getAttribute(attribute) ?? ''
    return ['href', 'src'].includes(attribute) ? resolveUrl(value, base) : value
  }
  if (element instanceof HTMLMetaElement) return element.content
  if (element instanceof HTMLImageElement && !attribute) return resolveUrl(element.src, base)
  return element.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function sourceId(source: SourceInput, index: number) {
  return source.id || `source-${btoa(unescape(encodeURIComponent(`${source.name || 'book'}-${source.url || index}`))).replace(/[^a-z0-9]/gi, '').slice(0, 20).toLowerCase()}`
}

export function normalizeSources(input: unknown): BookSource[] {
  const list = Array.isArray(input) ? input : [input]
  return list.map((value, index) => {
    const source = value as SourceInput
    if (!source || typeof source !== 'object' || !source.name || !source.url || !source.toc?.item || !source.chapter?.content) {
      throw new Error(`第 ${index + 1} 条书源缺少 name、url、toc.item 或 chapter.content。`)
    }
    return {
      ...source,
      id: sourceId(source, index),
      enabled: source.enabled ?? !source.disabled,
      toc: source.toc,
      chapter: source.chapter,
    } as BookSource
  })
}

export async function searchSource(source: BookSource, keyword: string): Promise<OnlineSearchResult[]> {
  const rule = source.search
  if (!rule || rule.disabled) return []
  const url = formatValue(rule.url, keyword)
  const init: RequestInit = rule.method?.toLowerCase() === 'post'
    ? { method: 'POST', body: parsePostData(rule.data || '{searchkey: %s}', keyword), headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' } }
    : { method: 'GET' }
  const document = await requestHtml(url, source, init)
  return selectAll(document, rule.result).map((item) => {
    const bookElement = selectAll(item, rule.bookName)[0]
    const bookUrl = rule.bookUrl ? extract(item, rule.bookUrl, source.url) : resolveUrl(bookElement?.getAttribute('href') ?? '', source.url)
    const title = extract(item, rule.bookName, source.url)
    return {
      id: `${source.id}-${bookUrl || title}`,
      title, author: extract(item, rule.author, source.url), category: extract(item, rule.category, source.url),
      latestChapter: extract(item, rule.latestChapter, source.url), updatedAt: extract(item, rule.lastUpdateTime, source.url),
      status: extract(item, rule.status, source.url), wordCount: extract(item, rule.wordCount, source.url),
      url: bookUrl, sourceId: source.id, sourceName: source.name,
    }
  }).filter((book) => book.title && book.url)
}

function formatTocUrl(template: string, bookUrl: string, bookRuleUrl = '') {
  if (!template) return bookUrl
  let id = ''
  if (bookRuleUrl) {
    try { id = new RegExp(bookRuleUrl).exec(bookUrl)?.[1] ?? '' } catch { id = '' }
  }
  if (!id) id = new URL(bookUrl).pathname.split('/').filter(Boolean).pop() ?? ''
  return template.split('%s').join(id)
}

export async function createOnlineBook(result: OnlineSearchResult, source: BookSource): Promise<LibraryBook> {
  const document = await requestHtml(result.url, source)
  const bookRule = source.book ?? {}
  const title = extract(document, bookRule.bookName, result.url)
    || extract(document, 'meta[property="og:novel:book_name"]@content', result.url) || result.title
  const author = extract(document, bookRule.author, result.url)
    || extract(document, 'meta[property="og:novel:author"]@content', result.url) || result.author || '未知作者'
  const description = extract(document, bookRule.intro, result.url)
    || extract(document, 'meta[property="og:description"]@content', result.url) || '来自在线书源。'
  const cover = extract(document, bookRule.coverUrl, result.url)
    || extract(document, 'meta[property="og:image"]@content', result.url)
  const tocUrl = formatTocUrl(source.toc.url ?? '', result.url, bookRule.url)
  const tocDocument = tocUrl === result.url ? document : await requestHtml(tocUrl, source)
  const items = selectAll(tocDocument, source.toc.item)
  const ordered = source.toc.isDesc ? items.reverse() : items
  const chapters = ordered.map((item, index) => ({
    id: createId('chapter'),
    title: item.textContent?.replace(/\s+/g, ' ').trim() || `第 ${index + 1} 章`,
    content: '',
    sourceUrl: resolveUrl(item.getAttribute('href') ?? '', source.toc.baseUri || tocUrl),
  })).filter((chapter) => chapter.sourceUrl)
  if (!chapters.length) throw new Error('书源返回了详情页，但没有解析出章节目录。')
  const now = Date.now()
  return {
    id: createId('book'), title, author, description, cover, sourceName: source.name, sourceId: source.id,
    format: 'online', createdAt: now, updatedAt: now, currentChapter: 0, currentOffset: 0, chapters,
  }
}

export async function fetchChapterContent(source: BookSource, url: string) {
  const document = await requestHtml(url, source)
  const rule = source.chapter
  const nodes = selectAll(document, rule.content)
  if (!nodes.length) throw new Error('正文选择器没有匹配到内容。')
  const container = document.createElement('div')
  nodes.forEach((node) => container.append(node.cloneNode(true), document.createTextNode('\n\n')))
  if (rule.filterTag) {
    try { container.querySelectorAll(rule.filterTag).forEach((node) => node.remove()) } catch { /* invalid optional filter */ }
  }
  container.querySelectorAll('script,style,noscript,iframe').forEach((node) => node.remove())
  container.querySelectorAll('br').forEach((node) => node.replaceWith('\n'))
  let content = container.textContent?.replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() ?? ''
  if (rule.filterTxt) {
    try { content = content.replace(new RegExp(rule.filterTxt, 'g'), '').trim() } catch { /* invalid optional filter */ }
  }
  if (!content) throw new Error('章节正文为空，可能遇到限流、验证或书源规则失效。')
  return content
}

