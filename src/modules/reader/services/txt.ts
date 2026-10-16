import type { BookChapter, LibraryBook } from '../types'

const chapterPattern = /^\s*((?:第[零〇一二三四五六七八九十百千万两\d]{1,12}[章回节卷集部篇])|(?:chapter\s+[\divxlcdm]+))[^\n]{0,50}\s*$/i

export function createId(prefix: string) {
  const random = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${random}`
}

export function decodeText(buffer: ArrayBuffer, encoding = 'auto') {
  if (encoding !== 'auto') return new TextDecoder(encoding).decode(buffer)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('gb18030').decode(buffer)
  }
}

function cleanContent(lines: string[]) {
  return lines.join('\n').replace(/\u0000/g, '').replace(/\n{4,}/g, '\n\n\n').trim()
}

export function splitTextIntoChapters(raw: string): BookChapter[] {
  const lines = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n')
  const headings = lines.reduce<number[]>((result, line, index) => {
    if (chapterPattern.test(line.trim())) result.push(index)
    return result
  }, [])

  if (headings.length >= 2) {
    const chapters: BookChapter[] = []
    const preface = cleanContent(lines.slice(0, headings[0]))
    if (preface) chapters.push({ id: createId('chapter'), title: '序章', content: preface })
    headings.forEach((lineIndex, index) => {
      const next = headings[index + 1] ?? lines.length
      chapters.push({
        id: createId('chapter'),
        title: lines[lineIndex].trim(),
        content: cleanContent(lines.slice(lineIndex + 1, next)),
      })
    })
    return chapters
  }

  const paragraphs = raw.replace(/\r\n?/g, '\n').split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
  const chapters: BookChapter[] = []
  let bucket: string[] = []
  let length = 0
  const flush = () => {
    if (!bucket.length) return
    chapters.push({ id: createId('chapter'), title: `第 ${chapters.length + 1} 节`, content: bucket.join('\n\n') })
    bucket = []
    length = 0
  }
  paragraphs.forEach((paragraph) => {
    if (length > 9000) flush()
    bucket.push(paragraph)
    length += paragraph.length
  })
  flush()
  return chapters.length ? chapters : [{ id: createId('chapter'), title: '正文', content: raw.trim() }]
}

export async function parseTxtFile(file: File, encoding = 'auto'): Promise<LibraryBook> {
  const text = decodeText(await file.arrayBuffer(), encoding)
  const chapters = splitTextIntoChapters(text)
  const title = file.name.replace(/\.(txt|text)$/i, '').trim() || '未命名书籍'
  const now = Date.now()
  return {
    id: createId('book'), title, author: '本地导入',
    description: chapters[0]?.content.replace(/\s+/g, ' ').slice(0, 150) || '从本地 TXT 文件导入。',
    sourceName: '本地 TXT', format: 'txt', createdAt: now, updatedAt: now,
    currentChapter: 0, currentOffset: 0, chapters,
  }
}

