import type { BookChapter, LibraryBook } from '../types'
import { createId, decodeText } from './txt'

export interface MarkdownBlock {
  kind: 'paragraph' | 'heading' | 'quote' | 'list' | 'code' | 'rule'
  source: string
  text: string
  level?: number
  ordered?: boolean
  items?: string[]
}

const headingPattern = /^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/
const listPattern = /^\s*(?:([-+*])|(\d+)[.)])\s+(.+)$/
const fencePattern = /^\s*(`{3,}|~{3,})/
const rulePattern = /^\s*(?:\*\s*){3,}$|^\s*(?:-\s*){3,}$|^\s*(?:_\s*){3,}$/

/** Small, text-only Markdown parser. Raw HTML is always rendered as text by Vue. */
export function parseMarkdownBlocks(raw: string): MarkdownBlock[] {
  const lines = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []
  const startsBlock = (line: string) => headingPattern.test(line) || listPattern.test(line)
    || fencePattern.test(line) || rulePattern.test(line) || /^\s*>/.test(line)
  let index = 0
  while (index < lines.length) {
    if (!lines[index].trim()) { index += 1; continue }
    const start = index
    const line = lines[index]
    const fence = line.match(fencePattern)
    const heading = line.match(headingPattern)
    const list = line.match(listPattern)
    let block: Omit<MarkdownBlock, 'source'>
    if (fence) {
      index += 1
      const contentStart = index
      while (index < lines.length && !new RegExp(`^\\s*${fence[1][0]}{${fence[1].length},}\\s*$`).test(lines[index])) index += 1
      block = { kind: 'code', text: lines.slice(contentStart, index).join('\n') }
      if (index < lines.length) index += 1
    } else if (heading) {
      block = { kind: 'heading', level: heading[1].length, text: heading[2] }
      index += 1
    } else if (rulePattern.test(line)) {
      block = { kind: 'rule', text: '' }
      index += 1
    } else if (/^\s*>/.test(line)) {
      const content: string[] = []
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        content.push(lines[index].replace(/^\s*>\s?/, ''))
        index += 1
      }
      block = { kind: 'quote', text: content.join('\n') }
    } else if (list) {
      const items: string[] = []
      const ordered = Boolean(list[2])
      while (index < lines.length) {
        const item = lines[index].match(listPattern)
        if (!item || Boolean(item[2]) !== ordered) break
        items.push(item[3])
        index += 1
      }
      block = { kind: 'list', text: items.join('\n'), ordered, items }
    } else {
      index += 1
      while (index < lines.length && lines[index].trim() && !startsBlock(lines[index])) index += 1
      block = { kind: 'paragraph', text: lines.slice(start, index).join('\n') }
    }
    blocks.push({ ...block, source: lines.slice(start, index).join('\n') })
  }
  return blocks
}

export function markdownPlainText(text: string) {
  return text.replace(/!\[([^\]]*)\]\([^\n]*?\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^\n]*?\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '').replace(/^\s*>\s?/gm, '')
    .replace(/[*_`~]/g, '').trim()
}

export function splitMarkdownIntoChapters(blocks: MarkdownBlock[]): BookChapter[] {
  const headings = blocks.filter((block) => block.kind === 'heading')
  const chapterLevel = headings.length ? Math.min(...headings.map((block) => block.level ?? 6)) : 0
  const chapters: BookChapter[] = []
  let parts: string[] = []
  let title = chapterLevel ? '序章' : '第 1 节'
  let length = 0
  const flush = () => {
    if (!parts.length) return
    chapters.push({ id: createId('chapter'), title, content: parts.join('\n\n') })
    parts = []
    length = 0
  }
  for (const block of blocks) {
    if (chapterLevel && block.kind === 'heading' && block.level === chapterLevel) {
      flush()
      title = markdownPlainText(block.text)
    } else if (!chapterLevel && length >= 9000) {
      flush()
      title = `第 ${chapters.length + 1} 节`
    }
    parts.push(block.source)
    length += block.source.length
  }
  flush()
  return chapters
}

export async function parseMarkdownFile(file: File, contentBaseUrl?: string): Promise<LibraryBook> {
  const text = decodeText(await file.arrayBuffer())
  const blocks = parseMarkdownBlocks(text)
  const first = blocks[0]
  const title = first?.kind === 'heading' && first.level === 1
    ? markdownPlainText(first.text) : file.name.replace(/\.(md|markdown)$/i, '')
  if (first?.kind === 'heading' && first.level === 1) blocks.shift()
  const chapters = splitMarkdownIntoChapters(blocks)
  if (!chapters.length) throw new Error(`${file.name} 没有可阅读的正文。`)
  const author = text.match(/^\s*>?\s*(?:作者|author)\s*[:：]\s*(.+)$/im)?.[1]?.trim()
  const now = Date.now()
  return {
    id: createId('book'), title: title || '未命名书籍', author: author || '本地导入',
    description: markdownPlainText(blocks.find((block) => block.kind === 'paragraph')?.text ?? '').replace(/\s+/g, ' '),
    sourceName: '本地 Markdown', format: 'md', contentBaseUrl,
    createdAt: now, updatedAt: now, currentChapter: 0, currentOffset: 0, chapters,
  }
}

export function resolveMarkdownUrl(value: string, baseUrl?: string, image = false): string | undefined {
  // The bundled documents also use Windows-style relative image paths.
  const target = value.trim().replace(/\\/g, '/')
  try {
    const url = baseUrl ? new URL(target, baseUrl) : new URL(target)
    if (url.protocol === 'https:' || url.protocol === 'http:' || (!image && url.protocol === 'mailto:')) return url.href
  } catch { /* A manually imported Markdown file has no public asset directory. */ }
  return undefined
}
