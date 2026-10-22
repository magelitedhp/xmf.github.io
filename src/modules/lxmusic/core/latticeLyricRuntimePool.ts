import type { LatticeLyricRuntime } from './latticeLyricRuntime'

const RUNTIME_REUSE_MS = 2000

type ParkedRuntime = {
  runtime: LatticeLyricRuntime
  timer: ReturnType<typeof setTimeout>
}

const parkedRuntimes = new WeakMap<object, ParkedRuntime>()

/** Keeps one stopped renderer per playback clock so a song change can reuse its WebGL context. */
export function parkLatticeLyricRuntime(clock: object, runtime: LatticeLyricRuntime) {
  runtime.setVisible(false)
  const previous = parkedRuntimes.get(clock)
  if (previous) {
    clearTimeout(previous.timer)
    previous.runtime.destroy()
  }
  const parked: ParkedRuntime = {
    runtime,
    timer: setTimeout(() => {
      if (parkedRuntimes.get(clock) === parked) parkedRuntimes.delete(clock)
      runtime.destroy()
    }, RUNTIME_REUSE_MS),
  }
  parkedRuntimes.set(clock, parked)
}

export function takeLatticeLyricRuntime(clock: object) {
  const parked = parkedRuntimes.get(clock)
  if (!parked) return null
  clearTimeout(parked.timer)
  parkedRuntimes.delete(clock)
  return parked.runtime
}
