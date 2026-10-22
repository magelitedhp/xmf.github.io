/**
 * Settings store for Yumo Music, persisted to localStorage.
 */

import { reactive, watch } from 'vue'
import { DEFAULT_SOURCE } from './api'
import type { SubtitleContentMode } from './lyric'

export const VISUALIZER_MODES = [
  'cadenza',
  'cappella',
  'claddagh',
  'classic',
  'diorama',
  'fume',
  'lumiere',
  'monet',
  'partita',
  'pendolo',
  'sonnet',
  'still',
  'tempera',
  'tilt',
] as const

export type VisualizerMode = (typeof VISUALIZER_MODES)[number]

export const VISUALIZER_MODE_LABELS: Record<VisualizerMode, string> = {
  cadenza: '华彩',
  cappella: '阿卡贝拉',
  claddagh: '心环',
  classic: '经典',
  diorama: '立体景',
  fume: '烟岚',
  lumiere: '流光',
  monet: '印象',
  partita: '云阶',
  pendolo: '时计',
  sonnet: '十四行',
  still: '静谧',
  tempera: '丹培拉',
  tilt: '倾镜',
}

export const VISUALIZER_BACKGROUND_MODES = ['common', 'latent', 'monet', 'nomand', 'sora', 'url'] as const

export type VisualizerBackgroundMode = (typeof VISUALIZER_BACKGROUND_MODES)[number]

export const VISUALIZER_BACKGROUND_LABELS: Record<VisualizerBackgroundMode, string> = {
  common: '封面柔焦',
  latent: '潜光',
  monet: '印象',
  nomand: '无相',
  sora: '空色',
  url: '图片',
}

export const SUBTITLE_CONTENT_MODES = ['translation', 'romanization', 'both', 'none'] as const

export interface LxSettings {
  'common.controlBtnPosition': 'left' | 'right'
  'common.playBarProgressStyle': 'full' | 'middle' | 'mini'
  'common.animation': boolean
  'common.fontSize': number
  'common.startInFullscreen': boolean
  'common.windowSizeId': number

  'player.playMode': 'list' | 'single' | 'random'
  'player.volume': number
  'player.mute': boolean
  'player.playbackRate': number
  'player.bitrate': number
  'player.audioVisualization': boolean
  'player.autoPlay': boolean
  'player.isSavePlayTime': boolean
  'player.timeoutExit': boolean
  'player.timeoutExitPlayed': boolean
  'player.timeoutExitPlayedTime': number
  'player.isShowLyricTranslation': boolean
  'player.isShowLyricRoma': boolean
  'player.isAlwaysOnTop': boolean
  'player.isShowPlayComment': boolean

  'download.enable': boolean
  'download.fileName': string
  'download.maxDownloadNum': number
  'download.isDownloadLrc': boolean
  'download.isDownloadLrcEx': boolean
  'download.lrcFormat': 'utf8' | 'gbk'
  'download.isEmbedPic': boolean
  'download.isUseProxy': boolean
  'download.proxy': string
  'download.savePath': string
  'download.skipExistFile': boolean

  'lyric.enableDesktopLyric': boolean
  'lyric.isLockDesktopLyric': boolean
  'lyric.isAlwaysOnTop': boolean
  'lyric.isShowLyricTranslation': boolean
  'lyric.isShowLyricRoma': boolean
  'lyric.showLyricProgress': boolean
  'lyric.fontSize': number
  'lyric.fontFamily': string
  'lyric.fontWeight': number
  'lyric.textY': number
  'lyric.scrollAlign': 'top' | 'center' | 'bottom'
  'lyric.style': 'font' | 'outline' | 'shadow'
  'lyric.color': string
  'lyric.shadowColor': string
  'lyric.lines': number
  'lyric.isDoubleLine': boolean
  'lyric.animation': boolean
  'lyric.singleLine': boolean
  /** User lyric nudge in seconds; positive delays the lyrics. */
  'lyric.offset': number
  'lyric.desktopLyricPosition': { x: number; y: number }

  'list.isClickPlay': boolean
  'list.isShowSource': boolean
  'list.actionButtonsVisible': boolean
  'list.isSaveScrollLocation': boolean
  'list.addMusicLocationType': 'top' | 'bottom'

  'search.isShowHotSearch': boolean
  'search.isShowHistorySearch': boolean
  'search.isFocusSearchBox': boolean
  'search.temp_source': string
  'search.searchSourceList': string[]
  'search.history': string[]

  'theme.id': 'auto' | 'light' | 'dark' | 'cover'
  'theme.light': boolean

  'odc.isAutoClearSearchInput': boolean
  'odc.isAutoClearSearchList': boolean

  'visualizer.mode': VisualizerMode
  'visualizer.background': VisualizerBackgroundMode
  'visualizer.useCoverColor': boolean
  'visualizer.backgroundOpacity': number
  'visualizer.disableGeometric': boolean
  'visualizer.disableVignette': boolean
  'visualizer.lyricsFontScale': number
  'visualizer.animationIntensity': 'calm' | 'normal' | 'chaotic'
  'visualizer.showSubtitleTranslation': boolean
  'visualizer.subtitleContentMode': SubtitleContentMode
  'visualizer.showUpcoming': boolean
  'visualizer.showGuideLines': boolean
  'visualizer.showPrintSymbols': boolean
  'lattice.posterTintEnabled': boolean
  'lattice.posterTintUseCustomColor': boolean
  'lattice.posterTintColor': string
  'lattice.posterTintIntensity': number
  'lattice.lightsOn': boolean

  'hotKey.enable': boolean
}

export const defaultSettings: LxSettings = {
  'common.controlBtnPosition': 'right',
  'common.playBarProgressStyle': 'full',
  'common.animation': true,
  'common.fontSize': 14,
  'common.startInFullscreen': false,
  'common.windowSizeId': 1,

  'player.playMode': 'list',
  'player.volume': 0.7,
  'player.mute': false,
  'player.playbackRate': 1,
  'player.bitrate': 320,
  'player.audioVisualization': true,
  'player.autoPlay': true,
  'player.isSavePlayTime': false,
  'player.timeoutExit': false,
  'player.timeoutExitPlayed': true,
  'player.timeoutExitPlayedTime': 30,
  'player.isShowLyricTranslation': true,
  'player.isShowLyricRoma': false,
  'player.isAlwaysOnTop': false,
  'player.isShowPlayComment': false,

  'download.enable': true,
  'download.fileName': '歌名 - 歌手',
  'download.maxDownloadNum': 3,
  'download.isDownloadLrc': true,
  'download.isDownloadLrcEx': false,
  'download.lrcFormat': 'utf8',
  'download.isEmbedPic': true,
  'download.isUseProxy': false,
  'download.proxy': '',
  'download.savePath': '浏览器默认下载目录',
  'download.skipExistFile': true,

  'lyric.enableDesktopLyric': false,
  'lyric.isLockDesktopLyric': false,
  'lyric.isAlwaysOnTop': true,
  'lyric.isShowLyricTranslation': true,
  'lyric.isShowLyricRoma': false,
  'lyric.showLyricProgress': true,
  'lyric.fontSize': 22,
  'lyric.fontFamily': '',
  'lyric.fontWeight': 700,
  'lyric.textY': 70,
  'lyric.scrollAlign': 'top',
  'lyric.style': 'font',
  'lyric.color': '#ffffff',
  'lyric.shadowColor': '#000000',
  'lyric.lines': 5,
  'lyric.isDoubleLine': true,
  'lyric.animation': true,
  'lyric.singleLine': false,
  'lyric.offset': 0,
  'lyric.desktopLyricPosition': { x: 0, y: 0 },

  'list.isClickPlay': true,
  'list.isShowSource': true,
  'list.actionButtonsVisible': true,
  'list.isSaveScrollLocation': true,
  'list.addMusicLocationType': 'top',

  'search.isShowHotSearch': true,
  'search.isShowHistorySearch': true,
  'search.isFocusSearchBox': false,
  'search.temp_source': DEFAULT_SOURCE,
  'search.searchSourceList': ['netease', 'tencent', 'kuwo', 'joox', 'bilibili'],
  'search.history': [],

  'theme.id': 'auto',
  'theme.light': false,

  'odc.isAutoClearSearchInput': false,
  'odc.isAutoClearSearchList': false,

  'visualizer.mode': 'classic',
  'visualizer.background': 'latent',
  'visualizer.useCoverColor': true,
  'visualizer.backgroundOpacity': 0.75,
  'visualizer.disableGeometric': false,
  'visualizer.disableVignette': false,
  'visualizer.lyricsFontScale': 1,
  'visualizer.animationIntensity': 'normal',
  'visualizer.showSubtitleTranslation': true,
  'visualizer.subtitleContentMode': 'translation',
  'visualizer.showUpcoming': true,
  'visualizer.showGuideLines': true,
  'visualizer.showPrintSymbols': true,
  'lattice.posterTintEnabled': true,
  'lattice.posterTintUseCustomColor': false,
  'lattice.posterTintColor': '#161419',
  'lattice.posterTintIntensity': 0.5,
  'lattice.lightsOn': true,

  'hotKey.enable': true,
}

const STORAGE_KEY = 'lxmusic.settings'

function readStored(): Partial<LxSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const stored = JSON.parse(raw) as Partial<LxSettings>
    // Keep settings written by the first web-port prototype usable after the
    // visualizer registry grew to the full Folia mode list.
    if (!VISUALIZER_MODES.includes(stored['visualizer.mode'] as VisualizerMode)) {
      delete stored['visualizer.mode']
    }
    if (!VISUALIZER_BACKGROUND_MODES.includes(stored['visualizer.background'] as VisualizerBackgroundMode)) {
      delete stored['visualizer.background']
    }
    if (
      stored['visualizer.subtitleContentMode']
      && !SUBTITLE_CONTENT_MODES.includes(stored['visualizer.subtitleContentMode'])
    ) {
      delete stored['visualizer.subtitleContentMode']
    }
    if (
      !stored['visualizer.subtitleContentMode']
      && stored['visualizer.showSubtitleTranslation'] === false
    ) {
      stored['visualizer.subtitleContentMode'] = 'none'
    }
    return stored
  } catch {
    return {}
  }
}

export const appSetting = reactive<LxSettings>({ ...defaultSettings, ...readStored() })

watch(
  appSetting,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // storage full or unavailable — settings stay in memory
    }
  },
  { deep: true },
)

export function getSetting<K extends keyof LxSettings>(key: K): LxSettings[K] {
  return appSetting[key]
}

export function getSubtitleContentMode(): SubtitleContentMode {
  const mode = appSetting['visualizer.subtitleContentMode']
  if (mode && SUBTITLE_CONTENT_MODES.includes(mode)) return mode
  return appSetting['visualizer.showSubtitleTranslation'] ? 'translation' : 'none'
}

export function setSetting<K extends keyof LxSettings>(key: K, value: LxSettings[K]) {
  appSetting[key] = value
}

export function resetSetting<K extends keyof LxSettings>(key: K) {
  appSetting[key] = defaultSettings[key]
}

export function resetAllSettings() {
  Object.assign(appSetting, defaultSettings)
  // Object.assign keeps the old array reference; replace it so every consumer
  // sees the reset rather than mutating the shared default array.
  appSetting['search.searchSourceList'] = [...defaultSettings['search.searchSourceList']]
  appSetting['search.history'] = [...defaultSettings['search.history']]
  appSetting['lyric.desktopLyricPosition'] = { ...defaultSettings['lyric.desktopLyricPosition'] }
  // Legacy builds persisted only the boolean switch; keep both fields in sync.
  appSetting['visualizer.showSubtitleTranslation'] =
    defaultSettings['visualizer.subtitleContentMode'] !== 'none'
}

export function pushSearchHistory(keyword: string) {
  const text = keyword.trim()
  if (!text) return
  const history = appSetting['search.history'].filter((item) => item !== text)
  history.unshift(text)
  appSetting['search.history'] = history.slice(0, 20)
}

export function clearSearchHistory() {
  appSetting['search.history'] = []
}
