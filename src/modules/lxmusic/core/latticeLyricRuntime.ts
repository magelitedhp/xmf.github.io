import { loadPixi } from './loadPixi'
import { createLatticeRaster, type LatticeRaster } from './latticeLyricRaster'
import {
  layoutLatticeLine,
  resolveLatticeLongLineOffset,
  resolveLatticeTypography,
  type LatticeLineLayout,
  type LatticeTypography,
} from './latticeLyrics'
import { createLatticeLineView, type LatticeLineEntry, type LatticeLineView } from './latticeLyricScene'
import { createLatticeEdgeFilter } from './latticeLyricFilters'
import { createLatticeLyricFrameLoop } from './latticeLyricFrameLoop'
import { resolveLatticeTone, stepSpring, MONET_SCALE_SPRING, MONET_SCROLL_SPRING } from './foliaMotion'
import {
  findLatestActiveLineIndex,
  getLineRenderEndTime,
  getRecentCompletedLine,
  type LyricLine,
  type SubtitleContentMode,
} from './lyric'
import type { LxTheme } from './theme'

export interface LatticeLyricRuntimeInput {
  songKey: string
  lines: LyricLine[]
  theme: LxTheme
  subtitleTheme?: LxTheme
  showTranslation: boolean
  subtitleContentMode?: SubtitleContentMode
  keywordColoringEnabled: boolean
  reducedMotion: boolean
  /** Bumped whenever a web font finishes, so measurements taken against the fallback are dropped. */
  fontsEpoch: number
}

export interface LatticeLyricRuntime {
  attach(host: HTMLElement): void
  setErrorHandler(handler: (error: unknown) => void): void
  update(input: LatticeLyricRuntimeInput): void
  setTime(time: number): void
  resize(width: number, height: number, devicePixelRatio: number): void
  setVisible(visible: boolean): void
  wake(): void
  destroy(): void
}

interface Track {
  view: LatticeLineView
  y: number
  vy: number
  scale: number
  vs: number
  alpha: number
  blur: number
  fromAlpha: number
  fromBlur: number
  elapsed: number
  status: LatticeLineEntry['status']
  offset: number
  leaving: boolean
}

const ease = cubicBezier(0.32, 0.72, 0, 1)
let initialization: Promise<unknown> = Promise.resolve()

function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const sample = (a: number, b: number, c: number, u: number) =>
    3 * (1 - u) ** 2 * u * a + 3 * (1 - u) * u ** 2 * b + u ** 3 * c
  return (t: number) => {
    let low = 0
    let high = 1
    for (let index = 0; index < 18; index += 1) {
      const mid = (low + high) / 2
      if (sample(x1, x2, 1, mid) < t) low = mid
      else high = mid
    }
    return sample(y1, y2, 1, (low + high) / 2)
  }
}

export const latticeLyricResolution = (devicePixelRatio: number) =>
  Math.min(
    2,
    Math.max(
      1,
      Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
        ? Math.ceil(devicePixelRatio)
        : 1,
    ),
  )

const destroyApplication = (app: import('pixi.js').Application) => {
  app.destroy({ removeView: true }, { children: true })
}

function entryKey(index: number, line: LyricLine) {
  return `${index}-${line.startTime}-${line.fullText}`
}

function buildEntries(lines: LyricLine[], time: number): LatticeLineEntry[] {
  if (!lines.length) return []
  const currentLineIndex = findLatestActiveLineIndex(lines, time)
  const activeLine = lines[currentLineIndex] ?? null
  const recentCompletedLine = getRecentCompletedLine(lines, currentLineIndex, time)
  let upcomingLine: LyricLine | null = null
  if (activeLine) {
    upcomingLine = lines[currentLineIndex + 1] ?? null
  } else {
    upcomingLine = lines.find((line) => line.startTime > time) ?? null
  }

  const activeIndex = activeLine
    ? currentLineIndex
    : -1
  const upcomingIndex = upcomingLine ? lines.indexOf(upcomingLine) : -1
  const recentIndex = recentCompletedLine ? lines.indexOf(recentCompletedLine) : -1
  const anchorIndex = activeIndex >= 0
    ? activeIndex
    : upcomingIndex >= 0
      ? upcomingIndex
      : recentIndex
  if (anchorIndex < 0) return []

  const entries: LatticeLineEntry[] = []
  const start = Math.max(0, anchorIndex - 1)
  const end = Math.min(lines.length - 1, anchorIndex + 1)
  for (let index = start; index <= end; index += 1) {
    const line = lines[index]
    const status: LatticeLineEntry['status'] = index === activeIndex
      || (activeIndex < 0 && time >= line.startTime && time <= line.endTime)
      ? 'active'
      : time > line.endTime || (activeIndex >= 0 && index < activeIndex)
        ? 'passed'
        : 'waiting'
    entries.push({
      key: entryKey(index, line),
      line,
      index,
      offset: index - anchorIndex,
      status,
    })
  }
  return entries
}

function createTimeline(lines: LyricLine[]) {
  const boundaries = [...new Set(lines.flatMap((line) => [
    line.startTime,
    line.endTime,
    getLineRenderEndTime(line),
  ]))].sort((a, b) => a - b)
  let previousStamp = -1
  let entries: LatticeLineEntry[] = []
  return (time: number) => {
    let low = 0
    let high = boundaries.length
    while (low < high) {
      const mid = (low + high) >>> 1
      if (boundaries[mid] <= time) low = mid + 1
      else high = mid
    }
    const stamp = low * 2 + (boundaries[low - 1] === time ? 1 : 0)
    if (stamp !== previousStamp || !entries.length) {
      previousStamp = stamp
      entries = buildEntries(lines, time)
    }
    return entries
  }
}

/** Serializes creation so a canceled async mount cannot allocate a second WebGL context. */
export function createLatticeLyricRuntime(
  host: HTMLElement,
  initial: LatticeLyricRuntimeInput,
  initialTime: number,
  signal: AbortSignal,
  onError: (error: unknown) => void,
): Promise<LatticeLyricRuntime | null> {
  const pending = initialization.then(() =>
    initialize(host, initial, initialTime, signal, onError),
  )
  initialization = pending.catch(() => undefined)
  return pending
}

async function initialize(
  host: HTMLElement,
  initial: LatticeLyricRuntimeInput,
  initialTime: number,
  signal: AbortSignal,
  onError: (error: unknown) => void,
): Promise<LatticeLyricRuntime | null> {
  const pixi = await loadPixi()
  if (signal.aborted) return null
  const app = new pixi.Application()
  try {
    await app.init({
      preference: 'webgl',
      backgroundAlpha: 0,
      antialias: true,
      width: 1,
      height: 1,
      resolution: latticeLyricResolution(window.devicePixelRatio),
      autoDensity: true,
      autoStart: false,
      sharedTicker: false,
    })
  } catch (error) {
    if (app.renderer) destroyApplication(app)
    else {
      app.ticker?.destroy()
      app.stage.destroy({ children: true })
    }
    throw error
  }
  if (signal.aborted) {
    destroyApplication(app)
    return null
  }
  try {
    return attachRuntime(pixi, app, host, initial, initialTime, onError)
  } catch (error) {
    destroyApplication(app)
    throw error
  }
}

function attachRuntime(
  pixi: typeof import('pixi.js'),
  app: import('pixi.js').Application,
  host: HTMLElement,
  initial: LatticeLyricRuntimeInput,
  initialTime: number,
  onError: (error: unknown) => void,
): LatticeLyricRuntime {
  const raster: LatticeRaster = createLatticeRaster(pixi)
  let input = initial
  let width = 1
  let height = 1
  let resolution = app.renderer.resolution
  let destroyed = false
  let reportError = onError
  let time = initialTime
  let typography: LatticeTypography = resolveLatticeTypography(
    input.theme,
    width,
    height,
    raster.measure,
    input.showTranslation,
    input.subtitleContentMode,
  )
  const stage = new pixi.Container()
  stage.sortableChildren = true
  app.stage.addChild(stage)
  const edge = createLatticeEdgeFilter(pixi, resolution)
  stage.filters = [edge.filter]
  host.appendChild(app.canvas)
  app.canvas.setAttribute('aria-hidden', 'true')
  let timeline = createTimeline(input.lines)
  let lastTime = time
  let lastEntries: LatticeLineEntry[] | null = null
  const tracks = new Map<string, Track>()

  const clear = () => {
    tracks.forEach((track) => track.view.destroy())
    tracks.clear()
    lastEntries = null
  }

  const refreshEntries = (entries: LatticeLineEntry[]) => {
    for (const track of tracks.values()) {
      track.leaving = true
      track.fromAlpha = track.alpha
      track.fromBlur = track.blur
      track.elapsed = 0
    }
    for (const entry of entries) {
      let track = tracks.get(entry.key)
      if (!track) {
        const layout = layoutLatticeLine(
          entry.line,
          typography,
          Math.max(1, width - typography.padding * 2),
          raster.measure,
        )
        const view = createLatticeLineView(
          pixi,
          raster,
          stage,
          entry,
          layout,
          typography,
          input,
          resolution,
        )
        track = {
          view,
          y: height * 0.46 + (entry.offset >= 0 ? 34 : -34),
          vy: 0,
          scale: 0.7,
          vs: 0,
          alpha: 0,
          blur: 5,
          fromAlpha: 0,
          fromBlur: 5,
          elapsed: 0,
          status: entry.status,
          offset: entry.offset,
          leaving: false,
        }
        tracks.set(entry.key, track)
      }
      track.status = entry.status
      track.offset = entry.offset
      track.leaving = false
    }
    for (const [key, track] of tracks) {
      if (track.leaving && tracks.size > 5) {
        track.view.destroy()
        tracks.delete(key)
      }
    }
  }

  const draw = (delta: number) => {
    try {
      if (destroyed || width < 2 || height < 2) return false
      const quiet = Boolean(input.reducedMotion)
      if (time < lastTime || Math.abs(time - lastTime) > 0.75) clear()
      lastTime = time
      const entries = timeline(time)
      if (entries !== lastEntries) {
        refreshEntries(entries)
        lastEntries = entries
      }
      const anchor = entries.find((entry) => entry.offset === 0)
      const anchorTrack = anchor ? tracks.get(anchor.key) : undefined
      const room = Math.max(typography.lineHeight, height - typography.padding * 2)
      const activeHeight = anchorTrack
        ? Math.min(
            room,
            anchorTrack.status === 'active'
              ? anchorTrack.view.layout.height
              : Math.min(anchorTrack.view.layout.textHeight, typography.lineHeight * 2)
                * resolveLatticeTone(anchorTrack.status, 0).scale,
          )
        : 0
      const anchorY = Math.max(typography.padding, height * 0.46 - activeHeight / 2)
      let moving = false
      for (const [key, track] of tracks) {
        const tone = resolveLatticeTone(track.status, track.offset)
        const contextHeight = Math.min(track.view.layout.textHeight, typography.lineHeight * 2)
        const gap = Math.max(18, typography.fontPx * 0.49)
        let targetY = track.offset < 0
          ? anchorY - contextHeight * tone.scale - gap
          : track.offset > 0
            ? anchorY + activeHeight + gap
            : anchorY
        if (track.offset === 0 && track.status === 'active') {
          targetY -= resolveLatticeLongLineOffset(
            track.view.layout,
            time,
            room,
            typography.lineHeight,
          )
        }
        if (track.leaving) {
          targetY += track.offset < 0 || track.status === 'passed' ? -38 : 38
        }
        const sy = stepSpring(track.y, track.vy, targetY, delta, MONET_SCROLL_SPRING)
        const ss = stepSpring(track.scale, track.vs, tone.scale, delta, MONET_SCALE_SPRING)
        track.y = quiet ? targetY : sy.value
        track.vy = quiet ? 0 : sy.velocity
        track.scale = quiet ? tone.scale : ss.value
        track.vs = quiet ? 0 : ss.velocity
        track.elapsed += delta
        const targetAlpha = track.leaving ? 0 : tone.alpha
        const fade = quiet ? 1 : ease(Math.min(1, track.elapsed / 0.28))
        const blurFade = quiet ? 1 : ease(Math.min(1, track.elapsed / 0.32))
        track.alpha = track.fromAlpha + (targetAlpha - track.fromAlpha) * fade
        track.blur = track.fromBlur + (tone.blur - track.fromBlur) * blurFade
        if (track.leaving && fade === 1) {
          track.view.destroy()
          tracks.delete(key)
          continue
        }
        moving ||= !quiet && (!sy.settled || !ss.settled || track.elapsed < 0.32)
        track.view.container.position.set(typography.padding, track.y)
        track.view.container.scale.set(track.scale)
        track.view.container.alpha = track.alpha
        track.view.container.zIndex = track.status === 'active'
          ? 4
          : track.status === 'waiting'
            ? 2
            : 1
        track.view.blur.strength = quiet ? 0 : track.blur
        track.view.blur.enabled = !quiet && track.blur > 0.05
        track.view.update(
          time,
          track.status,
          tone.baseAlpha,
          height,
          track.y,
          track.scale,
          quiet,
        )
      }
      app.render()
      return moving
    } catch (error) {
      reportError(error)
      return false
    }
  }

  const loop = createLatticeLyricFrameLoop(draw)
  const runtime: LatticeLyricRuntime = {
    attach(nextHost) {
      if (!destroyed && app.canvas.parentElement !== nextHost) nextHost.appendChild(app.canvas)
    },
    setErrorHandler(handler) {
      reportError = handler
    },
    update(next) {
      if (destroyed) return
      const fontsChanged = next.fontsEpoch !== input.fontsEpoch
      const rebuild = next.songKey !== input.songKey
        || next.lines !== input.lines
        || next.theme !== input.theme
        || next.subtitleTheme !== input.subtitleTheme
        || fontsChanged
        || next.keywordColoringEnabled !== input.keywordColoringEnabled
        || next.showTranslation !== input.showTranslation
        || next.subtitleContentMode !== input.subtitleContentMode
      if (fontsChanged) raster.clearMeasureCache()
      input = next
      if (rebuild) {
        clear()
        timeline = createTimeline(input.lines)
        typography = resolveLatticeTypography(
          input.theme,
          width,
          height,
          raster.measure,
          input.showTranslation,
          input.subtitleContentMode,
        )
      }
      loop.wake()
    },
    setTime(next) {
      if (destroyed || next === time) return
      time = next
      loop.wake()
    },
    resize(nextWidth, nextHeight, devicePixelRatio) {
      const nextResolution = latticeLyricResolution(devicePixelRatio)
      if (
        destroyed
        || (nextWidth === width && nextHeight === height && nextResolution === resolution)
      ) {
        return
      }
      width = nextWidth
      height = nextHeight
      resolution = nextResolution
      app.renderer.resize(Math.max(1, width), Math.max(1, height), resolution)
      edge.filter.resolution = resolution
      stage.filterArea = new pixi.Rectangle(0, 0, width, height)
      typography = resolveLatticeTypography(
        input.theme,
        width,
        height,
        raster.measure,
        input.showTranslation,
        input.subtitleContentMode,
      )
      clear()
      loop.wake()
    },
    setVisible(visible) {
      loop.setVisible(visible)
    },
    wake: loop.wake,
    destroy() {
      if (destroyed) return
      destroyed = true
      loop.destroy()
      clear()
      edge.filter.destroy()
      destroyApplication(app)
    },
  }
  return runtime
}
