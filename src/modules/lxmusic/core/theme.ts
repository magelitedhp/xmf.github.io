/**
 * Theme model for the immersive stage.
 *
 * The palette is derived from the current cover art (dominant colours + accent),
 * and the visualizer reads background/primary/
 * secondary/accent from the same object. Falls back to a curated dark palette when
 * the cover cannot be sampled (cross-origin taint, missing art).
 */

export interface WordColorEntry {
  word: string
  color: string
}

export interface LxTheme {
  backgroundColor: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  fontFamilyStack?: string[]
  fontStyle: 'sans' | 'serif' | 'mono'
  fontWeight?: number
  animationIntensity: 'calm' | 'normal' | 'chaotic'
  wordColors: WordColorEntry[]
  lyricsIcons: string[]
}

export const DEFAULT_THEME: LxTheme = {
  backgroundColor: '#09090b',
  primaryColor: '#f4f4f5',
  secondaryColor: '#71717a',
  accentColor: '#f4f4f5',
  fontFamily: '',
  fontFamilyStack: [],
  fontStyle: 'sans',
  fontWeight: 700,
  animationIntensity: 'normal',
  wordColors: [],
  lyricsIcons: [],
}

/** Source: `services/baseThemes.ts#DAYLIGHT_THEME`. */
export const DAYLIGHT_THEME: LxTheme = {
  backgroundColor: '#f5f5f4',
  primaryColor: '#1c1917',
  secondaryColor: '#44403c',
  accentColor: '#ea580c',
  fontFamily: '',
  fontFamilyStack: [],
  fontStyle: 'sans',
  fontWeight: 700,
  animationIntensity: 'normal',
  wordColors: [],
  lyricsIcons: [],
}

interface Rgb {
  r: number
  g: number
  b: number
}

function toHex({ r, g, b }: Rgb): string {
  const part = (value: number) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`
}

function luminance({ r, g, b }: Rgb): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

function saturate(color: Rgb, amount: number): Rgb {
  const grey = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b
  return {
    r: grey + (color.r - grey) * amount,
    g: grey + (color.g - grey) * amount,
    b: grey + (color.b - grey) * amount,
  }
}

function mix(a: Rgb, b: Rgb, ratio: number): Rgb {
  return {
    r: a.r + (b.r - a.r) * ratio,
    g: a.g + (b.g - a.g) * ratio,
    b: a.b + (b.b - a.b) * ratio,
  }
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 }
const BLACK: Rgb = { r: 8, g: 9, b: 14 }

function sampleCover(url: string): Promise<Rgb[]> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !url) {
      resolve([])
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => {
      try {
        const size = 32
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          resolve([])
          return
        }
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)
        const buckets = new Map<string, { color: Rgb; count: number }>()
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3]
          if (alpha < 200) continue
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          // Quantise to 32-level buckets so near-identical pixels merge.
          const key = `${r >> 5}-${g >> 5}-${b >> 5}`
          const bucket = buckets.get(key)
          if (bucket) {
            bucket.count += 1
            bucket.color.r += r
            bucket.color.g += g
            bucket.color.b += b
          } else {
            buckets.set(key, { color: { r, g, b }, count: 1 })
          }
        }
        const sorted = [...buckets.values()]
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
          .map((bucket) => ({
            r: bucket.color.r / bucket.count,
            g: bucket.color.g / bucket.count,
            b: bucket.color.b / bucket.count,
          }))
        resolve(sorted)
      } catch {
        // Cross-origin cover without CORS headers taints the canvas.
        resolve([])
      }
    }
    img.onerror = () => resolve([])
    img.src = url
  })
}

/** Builds a folia-shaped theme from the sampled cover palette. */
export function buildThemeFromPalette(palette: Rgb[], base: LxTheme = DEFAULT_THEME): LxTheme {
  if (!palette.length) return { ...base }

  const dominant = palette[0]
  const accent = palette.find((color) => luminance(color) > 0.25 && luminance(color) < 0.8) ?? palette[1] ?? dominant
  const secondarySource = palette[1] ?? dominant
  const isDark = luminance(dominant) < 0.5

  const backgroundColor = isDark ? mix(dominant, BLACK, 0.72) : mix(dominant, WHITE, 0.86)
  const backgroundLum = luminance(backgroundColor)
  const textBase = backgroundLum < 0.45 ? WHITE : BLACK

  return {
    ...base,
    backgroundColor: toHex(backgroundColor),
    primaryColor: toHex(mix(textBase, accent, 0.12)),
    secondaryColor: toHex(mix(textBase, secondarySource, 0.42)),
    accentColor: toHex(saturate(accent, 1.35)),
  }
}

const themeCache = new Map<string, LxTheme>()

export async function resolveCoverTheme(coverUrl: string, base: LxTheme = DEFAULT_THEME): Promise<LxTheme> {
  if (!coverUrl) return { ...base }
  const cached = themeCache.get(coverUrl)
  if (cached) return { ...cached, ...pickDynamic(base) }
  const palette = await sampleCover(coverUrl)
  const theme = buildThemeFromPalette(palette, base)
  themeCache.set(coverUrl, theme)
  return theme
}

function pickDynamic(base: LxTheme) {
  return {
    animationIntensity: base.animationIntensity,
    fontFamily: base.fontFamily,
    fontFamilyStack: base.fontFamilyStack,
    fontStyle: base.fontStyle,
    fontWeight: base.fontWeight,
    wordColors: base.wordColors,
    lyricsIcons: base.lyricsIcons,
  }
}

export function colorWithAlpha(color: string, alpha: number): string {
  const hex = color.trim()
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex)
  if (short) {
    const r = parseInt(short[1] + short[1], 16)
    const g = parseInt(short[2] + short[2], 16)
    const b = parseInt(short[3] + short[3], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (long) {
    const r = parseInt(long[1], 16)
    const g = parseInt(long[2], 16)
    const b = parseInt(long[3], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(hex)
  if (rgb) {
    const [r, g, b] = rgb[1].split(',').map((part) => Number(part.trim()))
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return hex
}

export function resolveThemeFontStack(theme: LxTheme): string {
  const fallback = theme.fontStyle === 'serif'
    ? '"獅尾四季春加糖SC", "Iowan Old Style", "Noto Serif CJK SC", "Noto Serif JP", "Source Han Serif SC", "Songti SC", "STSong", "Georgia", serif'
    : theme.fontStyle === 'mono'
      ? '"IBM Plex Mono", "Sarasa Mono SC", "Noto Sans Mono CJK SC", "Noto Sans Mono", "SFMono-Regular", Consolas, monospace'
      : '"Inter", "Noto Sans CJK SC", "Noto Sans JP", "Source Han Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif'
  // Folia's default stack is the measurement baseline for every lyric mode.
  // A user-selected font is only substituted when it is not the built-in
  // default, so the visualizer keeps the source's type metrics.
  const custom = [theme.fontFamily, ...(theme.fontFamilyStack ?? [])]
    .map((entry) => entry?.trim())
    .filter((entry): entry is string => Boolean(entry) && entry !== DEFAULT_THEME.fontFamily)
  return custom.length ? `${custom.join(', ')}, ${fallback}` : fallback
}

export function resolveThemeTranslationFontStack(theme: LxTheme): string {
  const fallback = theme.fontStyle === 'serif'
    ? '"獅尾四季春加糖SC", "Folia Noto Serif SC", "Iowan Old Style", Georgia, "Times New Roman", "Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", "STSong", "SimSun", "Noto Serif JP", "Source Han Serif JP", "Yu Mincho", "MS PMincho", serif'
    : theme.fontStyle === 'mono'
      ? 'Consolas, "IBM Plex Mono", "SFMono-Regular", Menlo, Monaco, "Sarasa Mono SC", "Noto Sans Mono CJK SC", "SimHei", "DengXian", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans Mono CJK JP", "MS Gothic", monospace'
      : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Helvetica Neue", Arial, "Noto Sans CJK SC", "Source Han Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans JP", "Source Han Sans JP", "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif'
  const custom = [theme.fontFamily, ...(theme.fontFamilyStack ?? [])]
    .map((entry) => entry?.trim())
    .filter((entry): entry is string => Boolean(entry) && entry !== DEFAULT_THEME.fontFamily)
  return custom.length ? `${custom.join(', ')}, ${fallback}` : fallback
}

export function resolveThemeFontWeight(theme: LxTheme, fallback: number): number {
  const weight = Number(theme.fontWeight)
  if (!Number.isFinite(weight)) return fallback
  const clamped = Math.min(900, Math.max(100, weight))
  return Math.round(clamped / 10) * 10
}
