import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'

const nativeRequire = createRequire(import.meta.url)
function loadTs(relative, overrides = {}, environment = {}) {
  const filename = new URL(`../${relative}`, import.meta.url)
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const module = { exports: {} }
  runInNewContext(code, {
    module, exports: module.exports,
    require: (name) => name in overrides ? overrides[name] : nativeRequire(name),
    URL, console, ...environment,
  })
  return module.exports
}

function recoveryEnvironment() {
  const storage = new Map()
  const redirects = []
  const window = {
    location: { href: 'https://example.test/sub/?lang=zh#/blog', replace: (url) => redirects.push(url) },
    sessionStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  }
  return { window, storage, redirects }
}

test('a removed route chunk reloads fresh HTML at the requested deep link only once', () => {
  const env = recoveryEnvironment()
  const { recoverRouteChunk } = loadTs('src/router/chunkRecovery.ts', {}, env)
  const error = 'TypeError: Failed to fetch dynamically imported module: https://example.test/assets/ReaderLibraryPage-old.js'
  assert.equal(recoverRouteChunk(error, '/read/book/test/chapter/2'), true)
  const url = new URL(env.redirects[0])
  assert.equal(url.pathname, '/sub/')
  assert.equal(url.searchParams.get('lang'), 'zh')
  assert.ok(url.searchParams.has('__yumo_reload'))
  assert.equal(url.hash, '#/read/book/test/chapter/2')
  assert.equal(recoverRouteChunk(error, '/read'), false)
  assert.equal(env.redirects.length, 1)
})

test('ordinary runtime errors and unavailable session storage never trigger reloads', () => {
  const env = recoveryEnvironment()
  const { recoverRouteChunk } = loadTs('src/router/chunkRecovery.ts', {}, env)
  assert.equal(recoverRouteChunk('Cannot read properties of null', '/read'), false)
  env.window.sessionStorage.setItem = () => { throw new Error('blocked') }
  assert.equal(recoverRouteChunk('Importing a module script failed.', '/read'), false)
  assert.equal(env.redirects.length, 0)
})

function playbackEnvironment({ rejectCors = false, denyAutoplay = false, visualization = true } = {}) {
  const elements = [], sources = [], contexts = [], order = []
  const settings = { 'player.volume': 0.7, 'player.mute': false, 'player.playbackRate': 1, 'player.playMode': 'list', 'player.audioVisualization': visualization }
  class Audio extends EventTarget {
    constructor() {
      super()
      this.crossOrigin = null
      this.currentTime = 0
      this.error = null
      this.buffered = { length: 0 }
      elements.push(this)
    }
    set src(value) { this.url = value; order.push(['src', this.crossOrigin]) }
    get src() { return this.url ?? '' }
    load() {}
    removeAttribute() { this.url = '' }
    pause() { this.dispatchEvent(new Event('pause')) }
    async play() {
      if (denyAutoplay) throw new DOMException('A gesture is required', 'NotAllowedError')
      if (rejectCors && this.crossOrigin === 'anonymous') {
        this.error = { code: 4 }
        this.dispatchEvent(new Event('error'))
        throw new DOMException('CORS rejected', 'NotSupportedError')
      }
      this.dispatchEvent(new Event('playing'))
    }
  }
  class AudioContext {
    constructor() { this.state = 'suspended'; this.destination = {}; contexts.push(this) }
    async resume() { order.push(['resume']); this.state = 'running' }
    async close() { this.state = 'closed' }
    createMediaElementSource(element) {
      assert.equal(element.crossOrigin, 'anonymous', 'never bind opaque media to Web Audio')
      sources.push(element)
      return { connect() {}, disconnect() {} }
    }
    createAnalyser() { return { frequencyBinCount: 256, connect() {}, disconnect() {} } }
  }
  const player = loadTs('src/modules/lxmusic/core/player.ts', {
    './api': { formatInterval: String, resolveMusicUrl: async () => { order.push(['resolve']); return 'https://cdn.example.test/song.mp3' } },
    './settings': { appSetting: settings, getSetting: (key) => settings[key] },
    './lyric': { findLatestActiveLineIndex: () => -1 },
  }, { Audio, window: { AudioContext }, navigator: {}, requestAnimationFrame: () => 1, cancelAnimationFrame() {} })
  const music = { id: 'netease_1', songmid: '1', source: 'netease', name: 'Test', lyricId: '' }
  return { ...player, music, elements, sources, contexts, order }
}

test('CORS-enabled audio stays audible through the analyser and resumes before URL lookup', async () => {
  const env = playbackEnvironment()
  await env.playMusic(env.music)
  assert.equal(env.elements.length, 1)
  assert.equal(env.sources.length, 1)
  assert.equal(env.player.state.isPlay, true)
  assert.equal(env.order.find((event) => event[0] === 'src')[1], 'anonymous')
  assert.ok(env.order.findIndex((event) => event[0] === 'resume') < env.order.findIndex((event) => event[0] === 'resolve'))
  env.destroyPlayer()
})

test('a non-CORS CDN falls back to unbound native playback, including later tracks and resume', async () => {
  const env = playbackEnvironment({ rejectCors: true })
  await env.playMusic(env.music)
  assert.equal(env.elements.length, 2)
  assert.equal(env.elements[1].crossOrigin, null)
  assert.equal(env.elements[1].src, 'https://cdn.example.test/song.mp3')
  assert.equal(env.elements[1].volume, 0.7)
  assert.equal(env.contexts[0].state, 'closed')
  assert.equal(env.player.state.isPlay, true)
  env.setAudioVisualization(true)
  await env.togglePlay()
  await env.togglePlay()
  await env.playMusic({ ...env.music, id: 'netease_2', songmid: '2' })
  assert.equal(env.sources.length, 1, 'fallback audio must never be reattached to an analyser')
  assert.equal(env.player.state.isPlay, true)
  env.destroyPlayer()
})

test('autoplay rejection reports failure without recreating audio or bypassing browser policy', async () => {
  const env = playbackEnvironment({ denyAutoplay: true })
  await env.playMusic(env.music)
  assert.equal(env.elements.length, 1)
  assert.equal(env.player.state.isPlay, false)
  assert.equal(env.player.state.isLoading, false)
  env.destroyPlayer()
})

test('native playback also recovers without an enabled visualizer', async () => {
  const env = playbackEnvironment({ rejectCors: true, visualization: false })
  await env.playMusic(env.music)
  assert.equal(env.contexts.length, 0)
  assert.equal(env.player.state.isPlay, true)
  env.destroyPlayer()
})
