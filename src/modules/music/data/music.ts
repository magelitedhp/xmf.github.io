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
  album: 'Yumo',
  duration: '0:00',
  seconds: 0,
  artwork: '',
  liked: false,
  lyrics: [],
}

export const discoverQuery = '流行'

const stationArt = (id: string) => (import.meta.env.BASE_URL || './') + 'music/covers/' + id + '.svg'

export const playlists: Playlist[] = [
  { id: 'jazz', title: '微醺爵士', subtitle: '一杯咖啡的即兴时间', query: '爵士', artwork: stationArt('jazz') },
  { id: 'focus', title: '专注频率', subtitle: '给思绪一片安静', query: '轻音乐', artwork: stationArt('focus') },
  { id: 'pulse', title: '午夜电子', subtitle: '灯下律动', query: '电子', artwork: stationArt('pulse') },
  { id: 'folk', title: '原声漫游', subtitle: '带着吉他去远方', query: '民谣', artwork: stationArt('folk') },
  { id: 'classic', title: '时光唱片', subtitle: '好音乐，没有保质期', query: '经典', artwork: stationArt('classic') },
]

export const collections: Collection[] = [
  { id: 'city', title: '城市夜窗', subtitle: '雨后的街灯', query: 'R&B', artwork: stationArt('city') },
  { id: 'piano', title: '钢琴独白', subtitle: '给深夜留白', query: '钢琴', artwork: stationArt('piano') },
  { id: 'live', title: '现场回声', subtitle: '更近一点的呼吸', query: 'live', artwork: stationArt('live') },
]

export const LIKED_STORAGE_KEY = 'nocturne.liked'
export const RECENT_STORAGE_KEY = 'nocturne.recent'
