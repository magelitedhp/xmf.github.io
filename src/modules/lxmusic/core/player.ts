/**
 * Playback engine for Yumo Music.
 *
 * Owns the single <audio> element, the Web Audio analyser that feeds the visualizer,
 * and every reactive flag the UI reads. Kept as a module singleton so the play bar,
 * the list views and the immersive stage all observe the same state.
 */

import { computed, reactive, readonly } from 'vue'
import { formatInterval, hydrateLyric, resolveMusicUrl, type MusicItem } from './api'
import { findLatestActiveLineIndex, parseLyric, type LyricLine } from './lyric'
import { appSetting, getSetting } from './settings'

export type PlayMode = 'list' | 'single' | 'random'

export interface PlayMusicInfo {
  listId: string
  musicInfo: MusicItem | null
}

export interface AudioBands {
  bass: number
  lowMid: number
  mid: number
  vocal: number
  treble: number
}

const EMPTY_MUSIC: MusicItem = {
  id: '',
  songmid: '',
  source: '',
  name: '',
  singer: '',
  album: '',
  picId: '',
  lyricId: '',
  interval: '--:--',
  duration: 0,
  pic: '',
}

const state = reactive({
  playList: [] as MusicItem[],
  playIndex: -1,
  playMusicInfo: { listId: '', musicInfo: null } as PlayMusicInfo,
  isPlay: false,
  isBuffering: false,
  isLoading: false,
  progress: 0,
  maxTime: 0,
  buffered: 0,
  volume: getSetting('player.volume'),
  isMute: getSetting('player.mute'),
  playbackRate: getSetting('player.playbackRate'),
  playMode: getSetting('player.playMode') as PlayMode,
  statusText: 'Yumo Music · 准备就绪',
  lyricLines: [] as LyricLine[],
  lyricOffset: 0,
  lyricLoading: false,
  audioPower: 0,
  /** Native media clock; RAF mirrors this into `progress` while playing. */
  mediaTime: 0,
  audioBands: { bass: 0, lowMid: 0, mid: 0, vocal: 0, treble: 0 } as AudioBands,
})

let audio: HTMLAudioElement | null = null
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let spectrum: Uint8Array<ArrayBuffer> | null = null
let rafId = 0
let loadedKey = ''
let mediaSessionReady = false

const currentMusic = computed<MusicItem>(() => state.playMusicInfo.musicInfo ?? EMPTY_MUSIC)
const currentLineIndex = computed(() => findLatestActiveLineIndex(state.lyricLines, state.progress))
const progressText = computed(() => formatInterval(state.progress))
const maxTimeText = computed(() => formatInterval(state.maxTime))
const progressPercent = computed(() => (state.maxTime > 0 ? (state.progress / state.maxTime) * 100 : 0))

function ensureAudio(useCors = true): HTMLAudioElement {
  if (audio) return audio
  const element = new Audio()
  // Web Audio silences cross-origin media unless it was loaded with CORS.
  // Sources without CORS are retried through native audio below.
  if (useCors) element.crossOrigin = 'anonymous'
  element.preload = 'auto'
  element.volume = state.volume
  element.muted = state.isMute
  element.playbackRate = state.playbackRate

  element.addEventListener('timeupdate', () => {
    state.mediaTime = element.currentTime
    state.progress = element.currentTime
    if (element.buffered.length) {
      state.buffered = element.buffered.end(element.buffered.length - 1)
    }
    updateMediaPosition()
  })
  element.addEventListener('durationchange', () => {
    if (!Number.isFinite(element.duration)) return
    state.maxTime = element.duration
    const music = state.playMusicInfo.musicInfo
    if (music) {
      music.duration = element.duration
      music.interval = formatInterval(element.duration)
    }
  })
  element.addEventListener('waiting', () => {
    state.isBuffering = true
  })
  element.addEventListener('playing', () => {
    state.isBuffering = false
    state.isPlay = true
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
  })
  element.addEventListener('pause', () => {
    if (!element.ended) state.isPlay = false
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
  })
  element.addEventListener('ended', () => {
    state.isPlay = false
    if (state.playMode === 'single') {
      element.currentTime = 0
      void element.play()
      return
    }
    void playNext()
  })
  element.addEventListener('error', () => {
    state.isBuffering = false
    state.isPlay = false
    state.statusText = '当前曲目暂时无法播放'
  })

  audio = element
  // Progress for the visualizer is read from the media clock every frame. The
  // native `timeupdate` event only fires around 4 Hz and makes word glows stutter.
  startVisualizerLoop()
  setupMediaSession()
  return element
}

function setupMediaSession() {
  if (mediaSessionReady || !('mediaSession' in navigator)) return
  mediaSessionReady = true
  const handlers: Partial<Record<MediaSessionAction, MediaSessionActionHandler>> = {
    play: () => void togglePlay(),
    pause: () => void togglePlay(),
    previoustrack: () => void playPrev(),
    nexttrack: () => void playNext(),
    seekbackward: (details) => seek(state.progress - (details.seekOffset ?? 10)),
    seekforward: (details) => seek(state.progress + (details.seekOffset ?? 10)),
    seekto: (details) => {
      if (typeof details.seekTime === 'number') seek(details.seekTime)
    },
  }
  Object.entries(handlers).forEach(([action, handler]) => {
    try {
      navigator.mediaSession.setActionHandler(action as MediaSessionAction, handler ?? null)
    } catch {
      // Older browsers expose Media Session but not every action.
    }
  })
}

function updateMediaMetadata(music: MusicItem) {
  if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return
  navigator.mediaSession.metadata = new MediaMetadata({
    title: music.name,
    artist: music.singer,
    album: music.album,
    artwork: music.pic ? [{ src: music.pic, sizes: '512x512' }] : [],
  })
}

function updateMediaPosition() {
  if (!('mediaSession' in navigator) || !audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return
  try {
    navigator.mediaSession.setPositionState({
      duration: audio.duration,
      playbackRate: audio.playbackRate,
      position: Math.min(audio.currentTime, audio.duration),
    })
  } catch {
    // Position reporting is optional and can reject during stream transitions.
  }
}

function ensureAnalyser() {
  if (analyser || !audio) return
  if (audio.crossOrigin !== 'anonymous') return
  if (!getSetting('player.audioVisualization')) return
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return
  try {
    audioContext = new Ctor()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.78
    analyser.connect(audioContext.destination)
    sourceNode = audioContext.createMediaElementSource(audio)
    sourceNode.connect(analyser)
    spectrum = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
  } catch {
    // A connected media source must always have an audible output.
    sourceNode?.disconnect()
    if (sourceNode && audioContext) sourceNode.connect(audioContext.destination)
    analyser = null
  }
}

async function playAudio(element: HTMLAudioElement) {
  if (audioContext?.state === 'suspended') await audioContext.resume()
  try {
    await element.play()
  } catch (cause) {
    // A CDN may allow native playback but reject anonymous CORS requests.
    // A media element already bound to Web Audio cannot be unbound: replace it
    // and keep the fallback element out of the analyser for this session.
    if (element !== audio || element.crossOrigin !== 'anonymous' || !element.error
      || ![2, 4].includes(element.error.code)) throw cause
    const url = element.src
    const position = element.currentTime
    element.pause()
    element.removeAttribute('src')
    element.load()
    sourceNode?.disconnect()
    analyser?.disconnect()
    if (audioContext) void audioContext.close()
    audioContext = null
    analyser = null
    sourceNode = null
    spectrum = null
    state.audioPower = 0
    state.audioBands = { bass: 0, lowMid: 0, mid: 0, vocal: 0, treble: 0 }
    audio = null
    const fallback = ensureAudio(false)
    fallback.src = url
    fallback.load()
    fallback.currentTime = position
    await fallback.play()
  }
}

function bandAverage(data: Uint8Array, from: number, to: number): number {
  const start = Math.max(0, Math.floor(from))
  const end = Math.min(data.length, Math.ceil(to))
  if (end <= start) return 0
  let sum = 0
  for (let i = start; i < end; i += 1) sum += data[i]
  return sum / (end - start)
}

function tick() {
  rafId = requestAnimationFrame(tick)
  if (audio && state.isPlay) {
    state.mediaTime = audio.currentTime
    state.progress = audio.currentTime
    if (audio.buffered.length) {
      state.buffered = audio.buffered.end(audio.buffered.length - 1)
    }
  }
  if (!analyser || !spectrum) return
  if (state.isPlay) {
    analyser.getByteFrequencyData(spectrum)
  } else {
    for (let i = 0; i < spectrum.length; i += 1) spectrum[i] = spectrum[i] * 0.72
  }
  const bins = spectrum.length
  state.audioBands = {
    bass: bandAverage(spectrum, 0, bins * 0.06),
    lowMid: bandAverage(spectrum, bins * 0.06, bins * 0.16),
    mid: bandAverage(spectrum, bins * 0.16, bins * 0.36),
    vocal: bandAverage(spectrum, bins * 0.36, bins * 0.6),
    treble: bandAverage(spectrum, bins * 0.6, bins),
  }
  state.audioPower = bandAverage(spectrum, 0, bins * 0.5)
}

function startVisualizerLoop() {
  if (rafId) return
  rafId = requestAnimationFrame(tick)
}

function stopVisualizerLoop() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
}

async function loadLyric(music: MusicItem) {
  state.lyricLines = []
  state.lyricOffset = 0
  if (!music.lyricId) return
  state.lyricLoading = true
  try {
    if (!music.lyric && !music.tlyric && !music.rlyric) await hydrateLyric(music)
    const parsed = parseLyric(
      music.lyric ?? '',
      music.tlyric ?? '',
      getSetting('lyric.offset'),
      music.rlyric ?? '',
    )
    state.lyricLines = parsed.lines
    state.lyricOffset = parsed.offset
  } catch {
    state.lyricLines = []
  } finally {
    state.lyricLoading = false
  }
}

async function loadCurrent(autoplay: boolean) {
  const music = state.playMusicInfo.musicInfo
  if (!music) return
  const element = ensureAudio()
  ensureAnalyser()
  // Resume during the user's gesture, before waiting for the URL request.
  if (autoplay && audioContext?.state === 'suspended') void audioContext.resume().catch(() => {})
  startVisualizerLoop()

  state.isLoading = true
  state.isBuffering = true
  state.statusText = `正在准备「${music.name}」`

  try {
    if (loadedKey !== music.id || !element.src) {
      const url = await resolveMusicUrl(music.source, music.songmid, getSetting('player.bitrate'))
      if (!url) throw new Error('no url')
      element.src = url
      element.load()
      loadedKey = music.id
      state.progress = 0
      state.maxTime = 0
    }
    void loadLyric(music)
    if (autoplay) {
      await playAudio(element)
      state.isPlay = true
      state.statusText = `正在播放 · ${music.name}`
    }
  } catch {
    state.isPlay = false
    state.statusText = '当前曲目暂时无法播放，可尝试下一首'
  } finally {
    state.isLoading = false
    state.isBuffering = false
  }
}

export interface PlayOptions {
  listId?: string
  list?: MusicItem[]
  index?: number
  autoplay?: boolean
}

export async function playMusic(music: MusicItem | null, options: PlayOptions = {}) {
  if (!music) return
  if (options.list?.length) {
    state.playList = options.list
    state.playIndex = options.index ?? options.list.findIndex((item) => item.id === music.id)
    if (state.playIndex < 0) state.playIndex = 0
  } else if (!state.playList.length) {
    state.playList = [music]
    state.playIndex = 0
  } else {
    const index = state.playList.findIndex((item) => item.id === music.id)
    if (index >= 0) state.playIndex = index
  }
  state.playMusicInfo = { listId: options.listId ?? state.playMusicInfo.listId, musicInfo: music }
  updateMediaMetadata(music)
  await loadCurrent(options.autoplay ?? true)
}

export async function togglePlay() {
  const element = ensureAudio()
  if (!state.playMusicInfo.musicInfo) {
    if (state.playList.length) await playMusic(state.playList[0], { index: 0 })
    return
  }
  if (state.isPlay) {
    element.pause()
    state.isPlay = false
    return
  }
  if (loadedKey === currentMusic.value.id && element.src) {
    try {
      await playAudio(element)
      state.isPlay = true
    } catch {
      await loadCurrent(true)
    }
    return
  }
  await loadCurrent(true)
}

export async function playNext() {
  if (!state.playList.length) return
  if (state.playMode === 'random' && state.playList.length > 1) {
    let index = Math.floor(Math.random() * state.playList.length)
    if (index === state.playIndex) index = (index + 1) % state.playList.length
    await playIndex(index)
    return
  }
  await playIndex((state.playIndex + 1) % state.playList.length)
}

export async function playPrev() {
  if (!state.playList.length) return
  if (state.progress > 3) {
    seek(0)
    return
  }
  await playIndex((state.playIndex - 1 + state.playList.length) % state.playList.length)
}

export async function playIndex(index: number) {
  if (!state.playList.length) return
  const wrapped = ((index % state.playList.length) + state.playList.length) % state.playList.length
  state.playIndex = wrapped
  state.playMusicInfo = { listId: state.playMusicInfo.listId, musicInfo: state.playList[wrapped] }
  await loadCurrent(true)
}

/** Play a queue item without navigating away from the current view. */
export async function playQueueIndex(index: number) {
  if (index < 0 || index >= state.playList.length) return
  const music = state.playList[index]
  state.playIndex = index
  state.playMusicInfo = { listId: state.playMusicInfo.listId, musicInfo: music }
  updateMediaMetadata(music)
  await loadCurrent(true)
}

export function seek(time: number) {
  const element = ensureAudio()
  const target = Math.min(Math.max(time, 0), state.maxTime || time)
  state.progress = target
  state.mediaTime = target
  if (loadedKey === currentMusic.value.id) element.currentTime = target
}

export function setVolume(value: number) {
  state.volume = Math.min(Math.max(value, 0), 1)
  state.isMute = state.volume === 0
  const element = ensureAudio()
  element.volume = state.volume
  element.muted = state.isMute
  appSetting['player.volume'] = state.volume
  appSetting['player.mute'] = state.isMute
}

export function toggleMute() {
  const element = ensureAudio()
  state.isMute = !state.isMute
  element.muted = state.isMute
  appSetting['player.mute'] = state.isMute
}

export function setPlaybackRate(rate: number) {
  state.playbackRate = rate
  ensureAudio().playbackRate = rate
  appSetting['player.playbackRate'] = rate
}

export function setPlayMode(mode: PlayMode) {
  state.playMode = mode
  appSetting['player.playMode'] = mode
}

export function cyclePlayMode() {
  const order: PlayMode[] = ['list', 'single', 'random']
  setPlayMode(order[(order.indexOf(state.playMode) + 1) % order.length])
}

export function removeFromQueue(id: string) {
  const index = state.playList.findIndex((item) => item.id === id)
  if (index < 0) return
  removeQueueIndex(index)
}

function syncPlayIndex() {
  const currentId = state.playMusicInfo.musicInfo?.id
  state.playIndex = currentId
    ? state.playList.findIndex((item) => item.id === currentId)
    : state.playList.length
      ? Math.min(Math.max(state.playIndex, 0), state.playList.length - 1)
      : -1
}

/** Moves one queue item; `to` is the index after the move. */
export function moveQueueIndex(from: number, to: number) {
  const length = state.playList.length
  const inRange = (index: number) => Number.isInteger(index) && index >= 0 && index < length
  if (from === to || !inRange(from) || !inRange(to)) return false
  const [music] = state.playList.splice(from, 1)
  state.playList.splice(to, 0, music)
  syncPlayIndex()
  return true
}

/** Moves a queue item directly after the current track. */
export function moveQueueIndexToNext(index: number) {
  const length = state.playList.length
  if (!Number.isInteger(index) || index < 0 || index >= length) return false
  const target = state.playIndex + 1
  if (index === state.playIndex || index === target) return false
  return moveQueueIndex(index, index < target ? target - 1 : target)
}

export function moveQueueIndexToEnd(index: number) {
  const last = state.playList.length - 1
  if (index < 0 || index >= last) return false
  return moveQueueIndex(index, last)
}

/** Removes a queue item. The currently playing track is kept in the queue. */
export function removeQueueIndex(index: number) {
  const music = state.playList[index]
  if (!music || music.id === state.playMusicInfo.musicInfo?.id) return false
  state.playList.splice(index, 1)
  syncPlayIndex()
  return true
}

/**
 * Shuffles the queue while pinning the current track at its head, matching the
 * reference wall-tools action.
 */
export function shuffleQueue() {
  if (state.playList.length < 2) return false
  const currentId = state.playMusicInfo.musicInfo?.id
  const current = currentId
    ? state.playList.find((item) => item.id === currentId)
    : undefined
  const rest = state.playList.filter((item) => item.id !== currentId)
  for (let index = rest.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[rest[index], rest[swap]] = [rest[swap], rest[index]]
  }
  state.playList = current ? [current, ...rest] : rest
  syncPlayIndex()
  return true
}

export function clearQueue() {
  state.playList = []
  state.playIndex = -1
}

export function setStatusText(text: string) {
  state.statusText = text
}

export function setLyricOffset(offset: number) {
  const music = state.playMusicInfo.musicInfo
  if (!music || !music.lyric) return
  const parsed = parseLyric(music.lyric, music.tlyric ?? '', offset, music.rlyric ?? '')
  state.lyricLines = parsed.lines
  state.lyricOffset = parsed.offset
}

export function setAudioVisualization(enabled: boolean) {
  if (enabled) {
    ensureAnalyser()
    if (audio) startVisualizerLoop()
    return
  }
  // The same RAF loop also drives the lyric clock; only the analyser bands stop.
  state.audioPower = 0
  state.audioBands = { bass: 0, lowMid: 0, mid: 0, vocal: 0, treble: 0 }
}

export function destroyPlayer() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
  audio?.pause()
  audio = null
  analyser = null
  sourceNode = null
  spectrum = null
  loadedKey = ''
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null
    navigator.mediaSession.playbackState = 'none'
  }
  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
}

export const playerState = readonly(state) as Readonly<typeof state>

export const player = {
  state,
  currentMusic,
  currentLineIndex,
  progressText,
  maxTimeText,
  progressPercent,
  playMusic,
  togglePlay,
  playNext,
  playPrev,
  playIndex,
  playQueueIndex,
  seek,
  setVolume,
  toggleMute,
  setPlaybackRate,
  setPlayMode,
  cyclePlayMode,
  removeFromQueue,
  removeQueueIndex,
  moveQueueIndex,
  moveQueueIndexToNext,
  moveQueueIndexToEnd,
  shuffleQueue,
  clearQueue,
  setStatusText,
  setLyricOffset,
  setAudioVisualization,
  destroyPlayer,
}

export default player
