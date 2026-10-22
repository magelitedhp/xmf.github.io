export type BookFormat = 'txt' | 'md' | 'epub' | 'online' | 'guide'

export interface BookChapter {
  id: string
  title: string
  content: string
  sourceUrl?: string
}

export interface LibraryBook {
  id: string
  title: string
  author: string
  description: string
  cover?: string
  sourceName: string
  sourceId?: string
  format: BookFormat
  /** Stable public catalog path and content fingerprint for default books. */
  defaultPath?: string
  defaultRevision?: string
  /** Base URL used to resolve relative Markdown images and links. */
  contentBaseUrl?: string
  createdAt: number
  updatedAt: number
  currentChapter: number
  currentOffset: number
  chapters: BookChapter[]
}

export interface SearchRule {
  disabled?: boolean
  url: string
  method?: 'GET' | 'POST' | 'get' | 'post'
  data?: string
  result: string
  bookName: string
  bookUrl?: string
  author?: string
  category?: string
  latestChapter?: string
  lastUpdateTime?: string
  status?: string
  wordCount?: string
}

export interface BookRule {
  url?: string
  baseUri?: string
  bookName?: string
  author?: string
  intro?: string
  coverUrl?: string
  category?: string
}

export interface TocRule {
  baseUri?: string
  url?: string
  item: string
  isDesc?: boolean
}

export interface ChapterRule {
  baseUri?: string
  title?: string
  content: string
  filterTxt?: string
  filterTag?: string
}

export interface BookSource {
  id: string
  name: string
  url: string
  enabled: boolean
  comment?: string
  corsProxy?: string
  search?: SearchRule
  book?: BookRule
  toc: TocRule
  chapter: ChapterRule
}

export interface OnlineSearchResult {
  id: string
  title: string
  author: string
  category: string
  latestChapter: string
  updatedAt: string
  status: string
  wordCount: string
  url: string
  sourceId: string
  sourceName: string
}

export interface ReaderSettings {
  fontSize: number
  lineHeight: number
  contentWidth: number
  theme: 'paper' | 'green' | 'night'
}

