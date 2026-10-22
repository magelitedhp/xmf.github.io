/**
 * Global hot keys for playback and navigation.
 * Desktop-only actions (window controls, desktop lyric toggles) are dropped; the
 * playback, volume and navigation keys behave exactly like the desktop app.
 */

import { appSetting } from './settings'
import player from './player'

type Handler = () => void

export interface HotKeyDefinition {
  id: string
  label: string
  keys: string
  handler: Handler
}

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  if (!element) return false
  const tag = element.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable
}

export interface HotKeyActions {
  togglePlay: Handler
  next: Handler
  prev: Handler
  volumeUp: Handler
  volumeDown: Handler
  toggleMute: Handler
  seekForward: Handler
  seekBackward: Handler
  openSearch: Handler
  togglePlayDetail: Handler
  toggleDesktopLyric: Handler
  togglePlayMode: Handler
  minimize: Handler
  close: Handler
}

export const hotKeyList: Array<{ id: string; label: string; keys: string }> = [
  { id: 'togglePlay', label: '播放 / 暂停', keys: 'Space' },
  { id: 'next', label: '下一首', keys: 'Ctrl + →' },
  { id: 'prev', label: '上一首', keys: 'Ctrl + ←' },
  { id: 'volumeUp', label: '音量 +', keys: 'Ctrl + ↑' },
  { id: 'volumeDown', label: '音量 -', keys: 'Ctrl + ↓' },
  { id: 'toggleMute', label: '静音', keys: 'Ctrl + M' },
  { id: 'seekForward', label: '快进 5 秒', keys: '→' },
  { id: 'seekBackward', label: '快退 5 秒', keys: '←' },
  { id: 'togglePlayMode', label: '切换播放模式', keys: 'Ctrl + P' },
  { id: 'openSearch', label: '聚焦搜索', keys: 'Ctrl + F' },
  { id: 'togglePlayDetail', label: '打开 / 关闭播放详情', keys: 'Ctrl + D' },
  { id: 'toggleDesktopLyric', label: '桌面歌词', keys: 'Ctrl + L' },
  { id: 'minimize', label: '最小化（返回站点）', keys: 'Ctrl + W' },
]

export function registerHotKeys(actions: HotKeyActions): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (!appSetting['hotKey.enable']) return
    // Layer-specific Escape handlers run first and mark the event consumed.
    if (event.defaultPrevented) return
    if (isTypingTarget(event.target) && event.code !== 'Escape') return

    const ctrl = event.ctrlKey || event.metaKey
    const run = (handler: Handler) => {
      event.preventDefault()
      handler()
    }

    switch (event.code) {
      case 'Space':
        run(actions.togglePlay)
        return
      case 'ArrowRight':
        if (ctrl) run(actions.next)
        else run(actions.seekForward)
        return
      case 'ArrowLeft':
        if (ctrl) run(actions.prev)
        else run(actions.seekBackward)
        return
      case 'ArrowUp':
        if (ctrl) run(actions.volumeUp)
        return
      case 'ArrowDown':
        if (ctrl) run(actions.volumeDown)
        return
      case 'KeyM':
        if (ctrl) run(actions.toggleMute)
        return
      case 'KeyP':
        if (ctrl) run(actions.togglePlayMode)
        return
      case 'KeyF':
        if (ctrl) run(actions.openSearch)
        return
      case 'KeyD':
        if (ctrl) run(actions.togglePlayDetail)
        return
      case 'KeyL':
        if (ctrl) run(actions.toggleDesktopLyric)
        return
      case 'KeyW':
        if (ctrl) run(actions.minimize)
        return
      case 'Escape':
        run(actions.togglePlayDetail)
        return
      default:
        return
    }
  }

  window.addEventListener('keydown', onKeyDown)
  return () => window.removeEventListener('keydown', onKeyDown)
}

export function adjustVolume(delta: number) {
  player.setVolume(player.state.volume + delta)
}
