import JSZip from 'jszip'
import type { BookChapter, LibraryBook } from '../types'
import { createId } from './txt'

function xmlDocument(source: string) {
  return new DOMParser().parseFromString(source, 'application/xml')
}

function elementsByLocalName(root: Document | Element, name: string) {
  return Array.from(root.getElementsByTagName('*')).filter((element) => element.localName === name)
}

function normalizePath(path: string) {
  const result: string[] = []
  path.split('/').forEach((part) => {
    if (!part || part === '.') return
    if (part === '..') result.pop()
    else result.push(part)
  })
  return result.join('/')
}

function resolvePath(baseFile: string, relative: string) {
  const directory = baseFile.includes('/') ? baseFile.slice(0, baseFile.lastIndexOf('/') + 1) : ''
  return normalizePath(`${directory}${decodeURIComponent(relative.split('#')[0])}`)
}

function htmlToText(source: string) {
  const document = new DOMParser().parseFromString(source, 'text/html')
  document.querySelectorAll('script,style,noscript,nav').forEach((node) => node.remove())
  document.querySelectorAll('br').forEach((node) => node.replaceWith('\n'))
  const blocks = Array.from(document.body.querySelectorAll('p,div,section,blockquote,li'))
    .map((node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '')
    .filter(Boolean)
  return (blocks.length ? blocks.join('\n\n') : document.body.textContent ?? '')
    .replace(/\n{3,}/g, '\n\n').trim()
}

function chapterTitle(source: string, fallback: string) {
  const document = new DOMParser().parseFromString(source, 'text/html')
  return document.querySelector('h1,h2,h3,title')?.textContent?.replace(/\s+/g, ' ').trim() || fallback
}

export async function parseEpubFile(file: File): Promise<LibraryBook> {
  const zip = await JSZip.loadAsync(file)
  const containerSource = await zip.file('META-INF/container.xml')?.async('string')
  if (!containerSource) throw new Error('EPUB 缺少 META-INF/container.xml。')
  const rootFile = elementsByLocalName(xmlDocument(containerSource), 'rootfile')[0]?.getAttribute('full-path')
  if (!rootFile) throw new Error('无法定位 EPUB 的内容清单。')
  const packageSource = await zip.file(rootFile)?.async('string')
  if (!packageSource) throw new Error('无法读取 EPUB 内容清单。')

  const packageDocument = xmlDocument(packageSource)
  const metadata = elementsByLocalName(packageDocument, 'metadata')[0]
  const title = elementsByLocalName(metadata ?? packageDocument.documentElement, 'title')[0]?.textContent?.trim()
    || file.name.replace(/\.epub$/i, '') || '未命名书籍'
  const author = elementsByLocalName(metadata ?? packageDocument.documentElement, 'creator')[0]?.textContent?.trim() || '未知作者'
  const description = elementsByLocalName(metadata ?? packageDocument.documentElement, 'description')[0]?.textContent?.trim() || '从本地 EPUB 文件导入。'

  const manifest = new Map<string, { href: string; type: string; properties: string }>()
  elementsByLocalName(packageDocument, 'item').forEach((item) => {
    const id = item.getAttribute('id')
    const href = item.getAttribute('href')
    if (id && href) manifest.set(id, {
      href: resolvePath(rootFile, href),
      type: item.getAttribute('media-type') ?? '',
      properties: item.getAttribute('properties') ?? '',
    })
  })

  let cover: string | undefined
  const coverId = elementsByLocalName(packageDocument, 'meta')
    .find((meta) => meta.getAttribute('name') === 'cover')?.getAttribute('content')
  const coverItem = (coverId ? manifest.get(coverId) : undefined)
    ?? Array.from(manifest.values()).find((item) => item.properties.includes('cover-image'))
  if (coverItem) {
    const base64 = await zip.file(coverItem.href)?.async('base64')
    if (base64) cover = `data:${coverItem.type || 'image/jpeg'};base64,${base64}`
  }

  const chapters: BookChapter[] = []
  const spine = elementsByLocalName(packageDocument, 'itemref')
  for (let index = 0; index < spine.length; index += 1) {
    const item = manifest.get(spine[index].getAttribute('idref') ?? '')
    if (!item || (!item.type.includes('html') && !/\.(xhtml|html|htm)$/i.test(item.href))) continue
    if (item.properties.includes('nav')) continue
    const source = await zip.file(item.href)?.async('string')
    if (!source) continue
    const content = htmlToText(source)
    if (!content) continue
    chapters.push({ id: createId('chapter'), title: chapterTitle(source, `第 ${chapters.length + 1} 章`), content })
  }
  if (!chapters.length) throw new Error('EPUB 中没有找到可阅读的章节。')

  const now = Date.now()
  return {
    id: createId('book'), title, author, description: description.replace(/<[^>]+>/g, '').slice(0, 600), cover,
    sourceName: '本地 EPUB', format: 'epub', createdAt: now, updatedAt: now,
    currentChapter: 0, currentOffset: 0, chapters,
  }
}

