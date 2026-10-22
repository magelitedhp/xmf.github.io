/**
 * Three-line title fitting from Folia's `utils/fitSettledTitle.ts`.
 *
 * The reference build predicts the fit with `@chenglou/pretext`, then lets the
 * browser correct it. This port keeps the same visible contract without adding
 * that dependency: an isolated probe copies the title's typography and binary
 * searches by grapheme, so the browser remains the measurement authority.
 */

export const TITLE_MAX_LINES = 3

const ELLIPSIS = '…'

/** What the cascade contributes to a poster title's column. */
export interface TitleColumn {
  /** Horizontal insets, padding and borders of the copy block, in pixels. */
  inset: number
  /** The title's computed `max-width`, kept as written so a percentage can follow the poster. */
  maxWidth: string
}

export interface TitleMetrics {
  font: string
  letterSpacing: number
  lineHeight: number
  fontSize: number
  width: number
  maxLines?: number
}

export interface TitleTypography {
  font: string
  letterSpacing: number
  lineHeight: number
  fontSize: number
  column: TitleColumn
}

/** Reads only the typography the title fit consumes. */
export function readTitleMetrics(node: HTMLElement, targetWidth: number | null): TitleMetrics | null {
  const style = getComputedStyle(node)
  const lineHeight = Number.parseFloat(style.lineHeight)
  const width = targetWidth ?? Number.parseFloat(style.width)
  if (!(lineHeight > 0) || !(width > 0)) return null
  return {
    font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily}`,
    letterSpacing: Number.parseFloat(style.letterSpacing) || 0,
    lineHeight,
    fontSize: Number.parseFloat(style.fontSize),
    width,
  }
}

/**
 * Reads the copy block's insets and the title's cap from the live cascade.
 * Source: `components/wall/titleLayoutWidth.ts`.
 */
export function readTitleColumn(node: HTMLElement): TitleColumn | null {
  const box = node.parentElement
  if (!box) return null
  const style = getComputedStyle(box)
  if (style.position !== 'absolute') return null
  const inset =
    parseFloat(style.left)
    + parseFloat(style.right)
    + parseFloat(style.paddingLeft)
    + parseFloat(style.paddingRight)
    + parseFloat(style.borderLeftWidth)
    + parseFloat(style.borderRightWidth)
  if (!Number.isFinite(inset)) return null
  return { inset, maxWidth: getComputedStyle(node).maxWidth }
}

export function readTitleTypography(node: HTMLElement): TitleTypography | null {
  const column = readTitleColumn(node)
  if (!column) return null
  const metrics = readTitleMetrics(node, 1)
  if (!metrics) return null
  return {
    font: metrics.font,
    letterSpacing: metrics.letterSpacing,
    lineHeight: metrics.lineHeight,
    fontSize: metrics.fontSize,
    column,
  }
}

/** The arithmetic half: null where the poster leaves no room for a title. */
export function titleColumnWidth(column: TitleColumn, posterWidth: number): number | null {
  const available = posterWidth - column.inset
  if (!(available > 0)) return null
  if (column.maxWidth.endsWith('%')) {
    return (available * parseFloat(column.maxWidth)) / 100
  }
  const pixels = parseFloat(column.maxWidth)
  return Number.isFinite(pixels) ? Math.min(available, pixels) : available
}

const TYPOGRAPHY = [
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-stretch',
  'font-variation-settings',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'text-transform',
  'text-wrap',
  'word-break',
  'overflow-wrap',
  'white-space',
] as const

type SegmenterConstructor = new (
  locales?: string | string[],
  options?: { granularity: 'grapheme' },
) => { segment(input: string): Iterable<{ segment: string }> }

const Segmenter = (Intl as typeof Intl & { Segmenter?: SegmenterConstructor }).Segmenter
const segmenter = Segmenter ? new Segmenter(undefined, { granularity: 'grapheme' }) : null

export function splitTitleGraphemes(text: string): string[] {
  if (!text) return []
  if (segmenter) {
    return Array.from(segmenter.segment(text), ({ segment }) => segment)
  }
  return Array.from(text)
}

export interface TitleFitCache {
  get(key: string): string | undefined
  set(key: string, value: string): void
}

const TITLE_FIT_CACHE_LIMIT = 512

/** Bounded LRU shared by every title on the wall. */
export function createTitleFitCache(limit = TITLE_FIT_CACHE_LIMIT): TitleFitCache {
  const entries = new Map<string, string>()
  return {
    get(key) {
      const value = entries.get(key)
      if (value === undefined) return undefined
      entries.delete(key)
      entries.set(key, value)
      return value
    },
    set(key, value) {
      entries.delete(key)
      entries.set(key, value)
      while (entries.size > limit) {
        const oldest = entries.keys().next()
        if (oldest.done) break
        entries.delete(oldest.value)
      }
    },
  }
}

export const sharedTitleFitCache = createTitleFitCache()

export function titleFitCacheKey(text: string, metrics: TitleMetrics, epoch = ''): string {
  return [
    epoch,
    metrics.width,
    metrics.lineHeight,
    metrics.letterSpacing,
    metrics.maxLines ?? TITLE_MAX_LINES,
    metrics.font,
    text,
  ].join('|')
}

/**
 * Fit against an isolated copy of the title node. The visible card is never
 * edited, and the limit comes from the title's own line height, as in Folia.
 */
export function fitTitle(
  node: HTMLElement,
  text: string,
  options: { width: number; maxLines?: number },
): string {
  if (typeof document === 'undefined') return text
  const style = getComputedStyle(node)
  const probe = document.createElement('div')
  for (const property of TYPOGRAPHY) {
    probe.style.setProperty(property, style.getPropertyValue(property))
  }
  Object.assign(probe.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    visibility: 'hidden',
    pointerEvents: 'none',
    width: `${options.width}px`,
    maxWidth: 'none',
    padding: '0',
    margin: '0',
    border: '0',
    boxSizing: 'border-box',
    display: 'block',
    overflow: 'visible',
    WebkitLineClamp: 'unset',
    WebkitBoxOrient: 'unset',
  })
  document.body.append(probe)

  const lineHeight = Number.parseFloat(style.lineHeight)
  if (!(lineHeight > 0) || !(options.width > 0)) {
    probe.remove()
    return text
  }
  const limit = lineHeight * (options.maxLines ?? TITLE_MAX_LINES) + 1
  const fits = (value: string) => {
    probe.textContent = value
    return probe.getBoundingClientRect().height <= limit
  }

  try {
    if (fits(text)) return text
    const graphemes = splitTitleGraphemes(text)
    let low = 0
    let high = graphemes.length
    while (low < high) {
      const middle = Math.ceil((low + high) / 2)
      const candidate = `${graphemes.slice(0, middle).join('').trimEnd()}${ELLIPSIS}`
      if (fits(candidate)) low = middle
      else high = middle - 1
    }
    return `${graphemes.slice(0, low).join('').trimEnd()}${ELLIPSIS}`
  } finally {
    probe.remove()
  }
}
