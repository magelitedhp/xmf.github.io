const RETRY_KEY = 'yumo:route-chunk-retry'
const RETRY_WINDOW = 60_000

/** Recover an open tab whose lazy route files were replaced by a deployment. */
export function recoverRouteChunk(error: unknown, fullPath: string): boolean {
  const message = error instanceof Error ? error.message : String(error)
  if (!/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|Loading chunk [\w-]+ failed/i.test(message)) return false
  try {
    const now = Date.now()
    const previous = Number(window.sessionStorage.getItem(RETRY_KEY))
    // Network outages must not produce an endless reload loop.
    if (previous && now - previous < RETRY_WINDOW) return false
    window.sessionStorage.setItem(RETRY_KEY, String(now))
    const url = new URL(window.location.href)
    url.hash = `#${fullPath}`
    // Request a fresh HTML entry even when a CDN has cached the old one.
    url.searchParams.set('__yumo_reload', String(now))
    window.location.replace(url.href)
    return true
  } catch {
    return false
  }
}
