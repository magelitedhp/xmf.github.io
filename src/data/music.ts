import type { LyricLine } from '../api/lyrics'

export type ViewId = 'discover' | 'search' | 'library' | 'playing'

export interface NavItem {
  id: ViewId
  label: string
  icon: string
}

export interface Track {
  uid: string
  id: string
  source: string
  picId: string
  lyricId: string
  title: string
  artist: string
  album: string
  duration: string
  seconds: number
  artwork: string
  liked: boolean
  lyrics: LyricLine[]
}

export interface Playlist {
  id: string
  title: string
  subtitle: string
  query: string
  artwork: string
}

export interface Album {
  title: string
  meta: string
  artwork: string
  query: string
}

export interface Collection {
  id: string
  title: string
  subtitle: string
  query: string
  artwork: string
}

export const navItems: NavItem[] = [
  { id: 'discover', label: '发现', icon: '◎' },
  { id: 'search', label: '搜索', icon: '⌕' },
  { id: 'library', label: '收藏', icon: '▣' },
  { id: 'playing', label: '正在播放', icon: '≡' },
]

export const emptyTrack: Track = {
  uid: '',
  id: '',
  source: 'netease',
  picId: '',
  lyricId: '',
  title: '尚未选择曲目',
  artist: '从发现页或搜索开始聆听',
  album: 'Nocturne',
  duration: '0:00',
  seconds: 0,
  artwork: '',
  liked: false,
  lyrics: [],
}

export const discoverQuery = '流行'

export const playlists: Playlist[] = [
  { id: 'jazz', title: '夜航电台', subtitle: '爵士与城市夜色', query: '爵士', artwork: '' },
  { id: 'focus', title: '专注时刻', subtitle: '安静的工作节拍', query: '轻音乐', artwork: '' },
  { id: 'pulse', title: '午夜电子', subtitle: '低亮度律动', query: '电子', artwork: '' },
  { id: 'folk', title: '原声回响', subtitle: '不插电精选', query: '民谣', artwork: '' },
  { id: 'classic', title: '经典回廊', subtitle: '重温黄金时代', query: '经典', artwork: '' },
]

export const collections: Collection[] = [
  { id: 'city', title: '城市夜窗', subtitle: '雨后的钢蓝灯火', query: 'R&B', artwork: '' },
  { id: 'piano', title: '钢琴独白', subtitle: '给深夜留白', query: '钢琴', artwork: '' },
  { id: 'live', title: '现场回声', subtitle: '更近一点的呼吸', query: 'live', artwork: '' },
]

export const LIKED_STORAGE_KEY = 'nocturne.liked'
export const RECENT_STORAGE_KEY = 'nocturne.recent'
