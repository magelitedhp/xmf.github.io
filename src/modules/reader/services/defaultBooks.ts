import catalog from 'virtual:default-read-catalog'
import type { LibraryBook } from '../types'
import { parseReaderFile } from './importBook'
import { getBook, removeBook, saveBook } from './storage'

type CatalogEntry = (typeof catalog)[number]

export function defaultBookUrl(relativePath: string) {
  const base = new URL(import.meta.env.BASE_URL, window.location.href)
  return new URL(`default-read/${relativePath.split('/').map(encodeURIComponent).join('/')}`, base).href
}

async function loadDefaultBook(entry: CatalogEntry, previous?: LibraryBook): Promise<LibraryBook> {
  const url = defaultBookUrl(entry.path)
  const cover = entry.coverPath ? `${defaultBookUrl(entry.coverPath)}?v=${entry.revision}` : undefined
  if (previous?.defaultRevision === entry.revision) {
    const nextCover = cover ?? previous.cover
    if (previous.contentBaseUrl !== url || previous.cover !== nextCover) {
      const book = { ...previous, contentBaseUrl: url, cover: nextCover }
      await saveBook(book)
      return book
    }
    return previous
  }

  const response = await fetch(`${url}?v=${entry.revision}`)
  if (!response.ok || response.headers.get('content-type')?.includes('text/html')) throw new Error(`无法读取《${entry.filename}》。`)
  const file = new File([await response.blob()], entry.filename)
  const book = await parseReaderFile(file, 'auto', url)
  book.id = entry.id
  book.defaultPath = entry.path
  book.defaultRevision = entry.revision
  book.contentBaseUrl = url
  book.sourceName = '默认书籍'
  if (book.author === '本地导入') book.author = '默认书籍'
  if (cover) book.cover = cover

  if (previous) {
    const previousTitle = previous.chapters[previous.currentChapter]?.title
    const matchingChapter = book.chapters.findIndex((chapter) => chapter.title === previousTitle)
    book.currentChapter = matchingChapter >= 0 ? matchingChapter : Math.min(previous.currentChapter, book.chapters.length - 1)
    book.currentOffset = matchingChapter >= 0 ? previous.currentOffset : 0
    book.createdAt = previous.createdAt
    book.updatedAt = previous.updatedAt
  }
  await saveBook(book)
  return book
}

/** Also supports opening a default-book link before visiting the shelf. */
export async function getReaderBook(id: string) {
  const previous = await getBook(id)
  const entry = catalog.find((item) => item.id === id)
  return entry ? loadDefaultBook(entry, previous) : previous
}

export async function syncDefaultBooks(existing: LibraryBook[]) {
  const byId = new Map(existing.map((book) => [book.id, book]))
  const failures: string[] = []
  for (const entry of catalog) {
    try { await loadDefaultBook(entry, byId.get(entry.id)) }
    catch { failures.push(entry.filename) }
  }
  // Only stale catalog entries are removed; local imports are independent books.
  const ids = new Set(catalog.map((entry) => entry.id))
  for (const book of existing) {
    if (book.defaultPath && !ids.has(book.id)) await removeBook(book.id)
  }
  return failures
}
