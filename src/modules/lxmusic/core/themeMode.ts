import { computed, ref } from 'vue'
import { appSetting } from './settings'

/**
 * Shared day/night state.
 *
 * The shell and the poster wall must agree on "daylight": `theme.id === 'auto'`
 * follows both the explicit `theme.light` switch and the system preference, so a
 * single wall-local check against `theme.id === 'light'` is not enough.
 */
export const prefersDark = ref(false)

let colorScheme: MediaQueryList | null = null
let syncColorScheme: (() => void) | null = null

export const isDaylight = computed(
  () =>
    appSetting['theme.id'] === 'light'
    || (
      appSetting['theme.id'] === 'auto'
      && (appSetting['theme.light'] || !prefersDark.value)
    ),
)

export function watchSystemTheme(): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined
  }
  colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
  syncColorScheme = () => {
    prefersDark.value = colorScheme?.matches ?? false
  }
  syncColorScheme()
  colorScheme.addEventListener('change', syncColorScheme)
  return () => {
    if (colorScheme && syncColorScheme) {
      colorScheme.removeEventListener('change', syncColorScheme)
    }
    colorScheme = null
    syncColorScheme = null
  }
}
