/**
 * Self-contained music API layer for Yumo Music.
 * Deliberately independent from `src/modules/music` so the two players never share state.
 */

export const API_BASE = 'https://music-api.gdstudio.xyz/api.php'

export interface MusicSource {
  id: string
  name: string
  /** Sources marked stable are offered first in the picker. */
  stable?: boolean
}

/** Music sources offered by the source switcher. */
export const MUSIC_SOURCES: MusicSource[] = [
  { id: 'netease', name: '网易云', stable: true },
  { id: 'tencent', name: 'QQ音乐' },
  { id: 'kuwo', name: '酷我音乐' },
  { id: 'joox', name: 'JOOX', stable: true },
  { id: 'bilibili', name: '哔哩哔哩', stable: true },
  { id: 'tidal', name: 'TIDAL' },
  { id: 'qobuz', name: 'Qobuz' },
  { id: 'apple', name: 'Apple Music' },
  { id: 'ytmusic', name: 'YouTube Music' },
  { id: 'spotify', name: 'Spotify' },
]

export const DEFAULT_SOURCE = 'netease'
export const BITRATES = [128, 192, 320, 740, 999] as const
export type Bitrate = (typeof BITRATES)[number]
export const BITRATE_LABEL: Record<number, string> = {
  128: '128k',
  192: '192k',
  320: '320k',
  740: '无损',
  999: 'Hi-Res',
}

export interface RawSearchItem {
  id: string | number
  name: string
  artist: string[] | string
  album?: string
  pic_id?: string | number
  url_id?: string | number
  lyric_id?: string | number
  source?: string
}

export interface MusicItem {
  /** `${source}_${id}` — stable identity used by every list in the app. */
  id: string
  songmid: string
  source: string
  name: string
  singer: string
  album: string
  picId: string
  lyricId: string
  interval: string
  /** Seconds. 0 until the audio element reports its duration. */
  duration: number
  pic: string
  /** Populated lazily by `getLyric`. */
  lyric?: string
  tlyric?: string
  rlyric?: string
}

export interface LeaderboardBoard {
  id: string
  name: string
  source: string
  bangid: string
  /** The web API exposes no chart endpoint, so each board is a curated query. */
  query: string
  pic?: string
}

type ApiParams = Record<string, string | number>

const inflight = new Map<string, Promise<unknown>>()
const picCache = new Map<string, string>()
const urlCache = new Map<string, string>()
export interface LyricPayload {
  lyric: string
  tlyric: string
  rlyric: string
}

const lyricCache = new Map<string, LyricPayload>()

function keyOf(parts: Array<string | number>) {
  return parts.map(String).join('_')
}

function once<T>(key: string, task: () => Promise<T>): Promise<T> {
  const running = inflight.get(key)
  if (running) return running as Promise<T>
  const pending = task().finally(() => inflight.delete(key))
  inflight.set(key, pending)
  return pending
}

let callbackSeed = 0

/**
 * GD Studio exposes JSONP specifically for static-site consumers. GitHub Pages
 * cannot proxy requests and the endpoint intentionally omits CORS headers, so a
 * normal production `fetch` would fail even though the API itself is healthy.
 */
function jsonp<T>(params: ApiParams, signal?: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('请求已取消', 'AbortError'))
      return
    }

    const callback = `__lxMusicJsonp_${Date.now().toString(36)}_${callbackSeed++}`
    const script = document.createElement('script')
    const search = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => search.set(key, String(value)))
    search.set('callback', callback)
    script.src = `${API_BASE}?${search.toString()}`
    script.async = true

    const host = window as unknown as Record<string, unknown>
    let settled = false
    const cleanup = () => {
      window.clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      script.remove()
      try {
        delete host[callback]
      } catch {
        host[callback] = undefined
      }
    }
    const finish = (task: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      task()
    }
    const onAbort = () => finish(() => reject(new DOMException('请求已取消', 'AbortError')))
    const timer = window.setTimeout(() => finish(() => reject(new Error('接口请求超时，请稍后重试'))), 18000)

    host[callback] = (payload: T) => finish(() => resolve(payload))
    script.onerror = () => finish(() => reject(new Error('音乐接口暂时无法访问')))
    signal?.addEventListener('abort', onAbort, { once: true })
    document.head.appendChild(script)
  })
}

async function apiGet<T>(params: ApiParams, signal?: AbortSignal): Promise<T> {
  // JSONP keeps the standalone module functional on static hosting and in local
  // previews without coupling it to the legacy player's development proxy.
  if (typeof document !== 'undefined') return jsonp<T>(params, signal)

  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => search.set(k, String(v)))
  const response = await fetch(`${API_BASE}?${search.toString()}`, { signal })
  if (!response.ok) throw new Error(`接口请求失败（HTTP ${response.status}）`)
  return (await response.json()) as T
}

export function formatInterval(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '--:--'
  const total = Math.floor(seconds)
  const min = Math.floor(total / 60)
  const sec = String(total % 60).padStart(2, '0')
  return `${min}:${sec}`
}

export function normalizeSinger(artist: string[] | string | undefined): string {
  if (Array.isArray(artist)) return artist.filter(Boolean).join('、') || '未知歌手'
  return String(artist || '未知歌手')
}

export function toMusicItem(raw: RawSearchItem, source = DEFAULT_SOURCE): MusicItem {
  const src = raw.source || source
  const songmid = String(raw.id)
  return {
    id: `${src}_${songmid}`,
    songmid,
    source: src,
    name: raw.name || '未知曲目',
    singer: normalizeSinger(raw.artist),
    album: raw.album || '',
    picId: String(raw.pic_id ?? ''),
    lyricId: String(raw.lyric_id ?? raw.id ?? ''),
    interval: '--:--',
    duration: 0,
    pic: '',
  }
}

export interface SearchOptions {
  source?: string
  page?: number
  limit?: number
  /** Appending `_album` switches the source into album-track mode. */
  album?: boolean
  signal?: AbortSignal
}

export async function searchMusic(keyword: string, options: SearchOptions = {}): Promise<MusicItem[]> {
  const text = keyword.trim()
  if (!text) return []
  const source = options.source ?? DEFAULT_SOURCE
  const list = await apiGet<RawSearchItem[] | { error?: string }>(
    {
      types: 'search',
      source: options.album ? `${source}_album` : source,
      name: text,
      count: options.limit ?? 30,
      pages: options.page ?? 1,
    },
    options.signal,
  )
  if (!Array.isArray(list)) throw new Error('接口没有返回可用的搜索结果')
  return list.map((item) => toMusicItem(item, source))
}

export async function getMusicUrl(source: string, songmid: string, br: number = 320): Promise<string> {
  const key = keyOf(['url', source, songmid, br])
  const cached = urlCache.get(key)
  if (cached) return cached
  return once(key, async () => {
    const payload = await apiGet<{ url?: string }>({ types: 'url', source, id: songmid, br })
    const url = payload.url?.trim() ?? ''
    if (url) urlCache.set(key, url)
    return url
  })
}

/** Walks the bitrate ladder like lx-music does, so a missing 320k still plays. */
export async function resolveMusicUrl(source: string, songmid: string, preferred: number = 320): Promise<string> {
  const ladder = [preferred, ...BITRATES.filter((br) => br !== preferred)]
  for (const br of ladder) {
    try {
      const url = await getMusicUrl(source, songmid, br)
      if (url) return url
    } catch {
      // try the next quality
    }
  }
  return ''
}

export async function getPicUrl(source: string, picId: string, size: 300 | 500 = 300): Promise<string> {
  if (!picId) return ''
  const key = keyOf(['pic', source, picId, size])
  const cached = picCache.get(key)
  if (cached) return cached
  return once(key, async () => {
    const payload = await apiGet<{ url?: string }>({ types: 'pic', source, id: picId, size })
    const url = payload.url?.trim() ?? ''
    if (url) picCache.set(key, url)
    return url
  })
}

type TimedLyricValue = string | { lyric?: string } | null | undefined

interface RawLyricPayload {
  lyric?: string
  tlyric?: string
  rlyric?: TimedLyricValue
  romalrc?: TimedLyricValue
  yromalrc?: TimedLyricValue
}

function readTimedLyric(value: TimedLyricValue): string {
  if (typeof value === 'string') return value
  return value?.lyric ?? ''
}

/**
 * Sources expose romanization under different keys. `rlyric` is the
 * name; the NetEase-shaped variants use `romalrc`/`yromalrc`.
 */
export async function getLyric(source: string, lyricId: string): Promise<LyricPayload> {
  if (!lyricId) return { lyric: '', tlyric: '', rlyric: '' }
  const key = keyOf(['lyric', source, lyricId])
  const cached = lyricCache.get(key)
  if (cached) return cached
  return once(key, async () => {
    const payload = await apiGet<RawLyricPayload>({ types: 'lyric', source, id: lyricId })
    const result: LyricPayload = {
      lyric: payload.lyric ?? '',
      tlyric: payload.tlyric ?? '',
      rlyric: readTimedLyric(payload.rlyric)
        || readTimedLyric(payload.romalrc)
        || readTimedLyric(payload.yromalrc),
    }
    lyricCache.set(key, result)
    return result
  })
}

/** Covers are fetched in small batches so a list of 30 rows does not stampede the API. */
export async function hydrateCovers(items: MusicItem[], limit = 30, concurrency = 4) {
  const pending = items.filter((item) => item.picId && !item.pic).slice(0, limit)
  for (let index = 0; index < pending.length; index += concurrency) {
    const chunk = pending.slice(index, index + concurrency)
    await Promise.all(
      chunk.map(async (item) => {
        try {
          item.pic = await getPicUrl(item.source, item.picId)
        } catch {
          // Leave the item uncovered so a later hydration pass can retry it.
        }
      }),
    )
  }
}

export async function hydrateLyric(item: MusicItem) {
  if (!item.lyricId) return
  const payload = await getLyric(item.source, item.lyricId)
  item.lyric = payload.lyric
  item.tlyric = payload.tlyric
  item.rlyric = payload.rlyric
}
