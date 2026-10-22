import type { LibraryBook } from '../types'
import { parseEpubFile } from './epub'
import { parseMarkdownFile } from './markdown'
import { parseTxtFile } from './txt'

export async function parseReaderFile(file: File, encoding = 'auto', contentBaseUrl?: string): Promise<LibraryBook> {
  if (file.size > 80 * 1024 * 1024) throw new Error(`${file.name} 超过 80 MB。`)
  if (/\.epub$/i.test(file.name)) return parseEpubFile(file)
  if (/\.(md|markdown)$/i.test(file.name)) return parseMarkdownFile(file, contentBaseUrl)
  if (/\.(txt|text)$/i.test(file.name)) return parseTxtFile(file, encoding)
  throw new Error(`${file.name} 暂不支持，请选择 MD、TXT 或 EPUB 文件。`)
}
