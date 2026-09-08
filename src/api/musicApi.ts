const API_BASE = import.meta.env.DEV
  ? '/gdstudio-api'
  : 'https://music-api.gdstudio.xyz/api.php'

export const DEFAULT_SOURCE = 'netease'
export const DEFAULT_BITRATES = [320, 128] as const

export interface SearchHit {
  id: string | number
  name: string
  artist: string[] | string
  album: string
  pic_id: string | number
  url_id?: string | number
  lyric_id: string | number
  source: string
}

export interface UrlPayload {
  url?: string
  br?: number
  size?: number
}

export interface PicPayload {
  url?: string
}

export interface LyricPayload {
  lyric?: string
  tlyric?: string
}

const picCache = new Map<string, string>()
const urlCache = new Map<string, string>()
const lyricCache = new Map<string, LyricPayload>()
const inflight = new Map<string, Promise<unknown>>()

function cacheKey(parts: Array<string | number>) {
  return parts.map(String).join(':')
}

async function apiGet<T>(params: Record<string, string | number>): Promise<T> {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    search.set(key, String(value))
  })

  const response = await fetch(`${API_BASE}?${search.toString()}`)
  if (!response.ok) {
    throw new Error(`曲库请求失败（${response.status}）`)
  }

  return (await response.json()) as T
}

function once<T>(key: string, task: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key)
  if (existing) {
    return existing as Promise<T>
  }

  const pending = task().finally(() => inflight.delete(key))
  inflight.set(key, pending)
  return pending
}

export async function searchTracks(
  name: string,
  options: { source?: string; count?: number; pages?: number } = {},
): Promise<SearchHit[]> {
  const keyword = name.trim()
  if (!keyword) return []

  const payload = await apiGet<SearchHit[] | { error?: string }>({
    types: 'search',
    source: options.source ?? DEFAULT_SOURCE,
    name: keyword,
    count: options.count ?? 20,
    pages: options.pages ?? 1,
  })

  if (!Array.isArray(payload)) {
    throw new Error('曲库没有返回可用的搜索结果')
  }

  return payload
}

export async function fetchSongUrl(source: string, id: string, br = 320): Promise<string> {
  const key = cacheKey(['url', source, id, br])
  const cached = urlCache.get(key)
  if (cached) return cached

  return once(key, async () => {
    const payload = await apiGet<UrlPayload>({
      types: 'url',
      source,
      id,
      br,
    })
    const url = payload.url?.trim() ?? ''
    if (url) urlCache.set(key, url)
    return url
  })
}

export async function resolveSongUrl(source: string, id: string): Promise<string> {
  for (const bitrate of DEFAULT_BITRATES) {
    const url = await fetchSongUrl(source, id, bitrate)
    if (url) return url
  }
  return ''
}

export async function fetchArtwork(source: string, picId: string, size: 300 | 500 = 300): Promise<string> {
  if (!picId) return ''
  const key = cacheKey(['pic', source, picId, size])
  const cached = picCache.get(key)
  if (cached) return cached

  return once(key, async () => {
    const payload = await apiGet<PicPayload>({
      types: 'pic',
      source,
      id: picId,
      size,
    })
    const url = payload.url?.trim() ?? ''
    if (url) picCache.set(key, url)
    return url
  })
}

export async function fetchLyrics(source: string, lyricId: string): Promise<LyricPayload> {
  if (!lyricId) return {}
  const key = cacheKey(['lyric', source, lyricId])
  const cached = lyricCache.get(key)
  if (cached) return cached

  return once(key, async () => {
    const payload = await apiGet<LyricPayload>({
      types: 'lyric',
      source,
      id: lyricId,
    })
    lyricCache.set(key, payload)
    return payload
  })
}

export async function hydrateArtworks(tracks: Array<{ source: string; picId: string; artwork: string }>, limit = 12) {
  const pending = tracks.filter((track) => track.picId && !track.artwork).slice(0, limit)
  const chunkSize = 4

  for (let index = 0; index < pending.length; index += chunkSize) {
    const chunk = pending.slice(index, index + chunkSize)
    await Promise.all(
      chunk.map(async (track) => {
        track.artwork = await fetchArtwork(track.source, track.picId)
      }),
    )
  }
}
