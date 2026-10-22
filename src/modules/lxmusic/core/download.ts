/**
 * Download manager for Yumo Music.
 *
 * The desktop app writes files through Electron IPC; the web port streams the
 * resolved audio URL and hands the result to the browser's downloader, keeping the
 * same task model (waiting / running / paused / error / completed) and the same
 * concurrency limit.
 */

import { computed, reactive } from 'vue'
import { getLyric, resolveMusicUrl, type MusicItem } from './api'
import { getSetting } from './settings'
import { addMusicToList, LIST_IDS } from './lists'

export type DownloadStatus = 'waiting' | 'running' | 'paused' | 'error' | 'completed'

export interface DownloadTask {
  id: string
  music: MusicItem
  status: DownloadStatus
  /** 0-100 */
  progress: number
  received: number
  total: number
  speed: number
  message: string
  createdAt: number
  fileName: string
}

const state = reactive({
  tasks: [] as DownloadTask[],
  running: 0,
})

const controllers = new Map<string, AbortController>()
/** Task ids the user explicitly paused, so an aborted request is not reported as a failure. */
const pausedIds = new Set<string>()

export const tasks = computed(() => state.tasks)
export const waitingCount = computed(() => state.tasks.filter((task) => task.status === 'waiting').length)
export const runningCount = computed(() => state.tasks.filter((task) => task.status === 'running').length)
export const completedCount = computed(() => state.tasks.filter((task) => task.status === 'completed').length)
export const errorCount = computed(() => state.tasks.filter((task) => task.status === 'error').length)

function sanitize(name: string): string {
  return name.replace(/[\\/:*?"<>|\r\n]+/g, '_').trim() || 'music'
}

/** Applies the configured file-name template, e.g. `歌名 - 歌手`. */
export function formatFileName(template: string, music: MusicItem): string {
  const replaced = template
    .replace(/歌名|name/gi, music.name)
    .replace(/歌手|singer/gi, music.singer)
    .replace(/专辑|album/gi, music.album || '未知专辑')
    .replace(/音源|source/gi, music.source)
  return sanitize(replaced || music.name)
}

export function addTask(music: MusicItem): DownloadTask {
  const existing = state.tasks.find((task) => task.music.id === music.id)
  if (existing) return existing
  const task: DownloadTask = {
    id: `dl_${music.id}_${Date.now().toString(36)}`,
    music,
    status: 'waiting',
    progress: 0,
    received: 0,
    total: 0,
    speed: 0,
    message: '等待下载',
    createdAt: Date.now(),
    fileName: formatFileName(getSetting('download.fileName'), music),
  }
  state.tasks.unshift(task)
  addMusicToList(LIST_IDS.DOWNLOAD, music, 'top')
  void pump()
  return task
}

export function addTasks(musics: MusicItem[]) {
  musics.forEach((music) => addTask(music))
}

export function removeTask(id: string) {
  controllers.get(id)?.abort()
  controllers.delete(id)
  pausedIds.delete(id)
  const index = state.tasks.findIndex((task) => task.id === id)
  if (index >= 0) state.tasks.splice(index, 1)
}

export function clearCompleted() {
  state.tasks = state.tasks.filter((task) => task.status !== 'completed')
}

export function clearAll() {
  state.tasks.forEach((task) => controllers.get(task.id)?.abort())
  controllers.clear()
  pausedIds.clear()
  state.tasks = []
}

export function pauseTask(id: string) {
  const task = state.tasks.find((item) => item.id === id)
  if (!task || task.status !== 'running') return
  controllers.get(id)?.abort()
  controllers.delete(id)
  pausedIds.add(id)
  task.status = 'paused'
  task.message = '已暂停'
}

export function resumeTask(id: string) {
  const task = state.tasks.find((item) => item.id === id)
  if (!task || (task.status !== 'paused' && task.status !== 'error')) return
  pausedIds.delete(id)
  task.status = 'waiting'
  task.message = '等待下载'
  void pump()
}

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

async function downloadLrc(task: DownloadTask) {
  if (!getSetting('download.isDownloadLrc')) return
  try {
    const { lyric, tlyric, rlyric } = await getLyric(task.music.source, task.music.lyricId)
    if (!lyric) return
    const merged = [lyric, rlyric, tlyric].filter(Boolean).join('\n\n')
    triggerBrowserDownload(new Blob([merged], { type: 'text/plain;charset=utf-8' }), `${task.fileName}.lrc`)
  } catch {
    // lyric download is best-effort
  }
}

async function runTask(task: DownloadTask) {
  const controller = new AbortController()
  controllers.set(task.id, controller)
  pausedIds.delete(task.id)
  task.status = 'running'
  task.message = '正在解析下载地址…'
  task.progress = 0
  task.received = 0
  task.total = 0

  const startedAt = performance.now()
  try {
    const url = await resolveMusicUrl(task.music.source, task.music.songmid, getSetting('player.bitrate'))
    if (!url) throw new Error('没有可用的下载地址')

    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`下载失败（HTTP ${response.status}）`)
    const total = Number(response.headers.get('content-length') ?? 0)
    task.total = total

    const reader = response.body?.getReader()
    if (!reader) {
      const blob = await response.blob()
      triggerBrowserDownload(blob, `${task.fileName}.mp3`)
      task.status = 'completed'
      task.progress = 100
      task.message = '下载完成'
      return
    }

    const chunks: Uint8Array[] = []
    let received = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        received += value.length
        task.received = received
        if (total) task.progress = Math.min(99, Math.round((received / total) * 100))
        const elapsed = (performance.now() - startedAt) / 1000
        task.speed = elapsed > 0 ? received / elapsed : 0
        task.message = total
          ? `已下载 ${(received / 1048576).toFixed(1)}MB / ${(total / 1048576).toFixed(1)}MB`
          : `已下载 ${(received / 1048576).toFixed(1)}MB`
      }
    }

    const blob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' })
    triggerBrowserDownload(blob, `${task.fileName}.mp3`)
    await downloadLrc(task)
    task.status = 'completed'
    task.progress = 100
    task.message = '下载完成'
  } catch (error) {
    if (controller.signal.aborted) {
      if (!pausedIds.has(task.id)) {
        task.status = 'error'
        task.message = '下载已取消'
      }
    } else {
      task.status = 'error'
      task.message = error instanceof Error ? error.message : '下载失败'
    }
  } finally {
    controllers.delete(task.id)
    state.running = Math.max(0, state.running - 1)
    // Continue draining the queue after a task finishes, fails, or is paused.
    void pump()
  }
}

async function pump() {
  const limit = Math.max(1, getSetting('download.maxDownloadNum'))
  while (state.running < limit) {
    const next = state.tasks.filter((task) => task.status === 'waiting').pop()
    if (!next) break
    state.running += 1
    void runTask(next)
  }
}

export const download = {
  state,
  tasks,
  waitingCount,
  runningCount,
  completedCount,
  errorCount,
  addTask,
  addTasks,
  removeTask,
  clearCompleted,
  clearAll,
  pauseTask,
  resumeTask,
  formatFileName,
}
