/**
 * Port of `hooks/useFontsEpoch.ts`.
 *
 * Canvas measurement silently uses a fallback face while a web font is in flight,
 * and the measured cache key stays the same afterwards. Bump whenever a font
 * batch settles so callers can drop measurements taken against the old face.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useFontsEpoch() {
  const epoch = ref(0)
  const fonts = typeof document !== 'undefined' ? document.fonts : undefined
  let mounted = false
  let loadingDoneSeen = false

  const bump = () => {
    if (mounted) epoch.value += 1
  }
  const onLoadingDone = () => {
    loadingDoneSeen = true
    bump()
  }

  onMounted(() => {
    mounted = true
    if (!fonts) return
    fonts.addEventListener?.('loadingdone', onLoadingDone)
    // `ready` settles for the same batch as `loadingdone`; let the event win
    // and keep this as the fallback for a batch that finished before mount.
    if (fonts.status !== 'loaded') {
      void fonts.ready
        .then(() => {
          if (!loadingDoneSeen) bump()
        })
        .catch(() => undefined)
    }
  })

  onBeforeUnmount(() => {
    mounted = false
    fonts?.removeEventListener?.('loadingdone', onLoadingDone)
  })

  return epoch
}
