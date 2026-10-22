/**
 * Port of `hooks/useViewportSettle.ts`.
 *
 * Viewport-relative title type changes continuously while the window is being
 * dragged. Refitting every card per frame is wasteful, so measurement waits for
 * the resize to settle and exposes the settled state to avoid clamping flashes.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const QUIET_MS = 140

const resizing = ref(false)
const epoch = ref(0)
let timer = 0
let subscribers = 0

function onResize() {
  window.clearTimeout(timer)
  if (!resizing.value) resizing.value = true
  timer = window.setTimeout(() => {
    timer = 0
    resizing.value = false
    epoch.value += 1
  }, QUIET_MS)
}

export function useViewportSettle() {
  onMounted(() => {
    subscribers += 1
    if (subscribers === 1) window.addEventListener('resize', onResize)
  })

  onBeforeUnmount(() => {
    subscribers = Math.max(0, subscribers - 1)
    if (subscribers > 0) return
    window.removeEventListener('resize', onResize)
    window.clearTimeout(timer)
    timer = 0
    resizing.value = false
  })

  return { resizing, epoch }
}
