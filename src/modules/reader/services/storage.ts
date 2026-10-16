import type { BookSource, LibraryBook, ReaderSettings } from '../types'

const DB_NAME = 'yumo-reader'
const BOOK_STORE = 'books'
const SOURCE_KEY = 'yumo-reader:sources'
const SETTINGS_KEY = 'yumo-reader:settings'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(BOOK_STORE)) db.createObjectStore(BOOK_STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function bookTransaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then((db) => new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(BOOK_STORE, mode)
    const request = action(transaction.objectStore(BOOK_STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
  }))
}

export function listBooks() {
  return bookTransaction<LibraryBook[]>('readonly', (store) => store.getAll())
    .then((books) => books.sort((a, b) => b.updatedAt - a.updatedAt))
}

export function getBook(id: string) {
  return bookTransaction<LibraryBook | undefined>('readonly', (store) => store.get(id))
}

export function saveBook(book: LibraryBook) {
  const serializable = JSON.parse(JSON.stringify(book)) as LibraryBook
  return bookTransaction<IDBValidKey>('readwrite', (store) => store.put(serializable))
}

export function removeBook(id: string) {
  return bookTransaction<undefined>('readwrite', (store) => store.delete(id))
}

export function loadSources(): BookSource[] {
  try {
    return JSON.parse(localStorage.getItem(SOURCE_KEY) ?? '[]') as BookSource[]
  } catch {
    return []
  }
}

export function saveSources(sources: BookSource[]) {
  localStorage.setItem(SOURCE_KEY, JSON.stringify(sources))
}

export const defaultReaderSettings: ReaderSettings = {
  fontSize: 20,
  lineHeight: 1.95,
  contentWidth: 760,
  theme: 'paper',
}

export function loadReaderSettings(): ReaderSettings {
  try {
    return { ...defaultReaderSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') }
  } catch {
    return { ...defaultReaderSettings }
  }
}

export function saveReaderSettings(settings: ReaderSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

