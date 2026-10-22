import { createLatticeLyricRuntime } from './latticeLyricRuntime'
import type { LyricLine } from './lyric'
import { DEFAULT_THEME } from './theme'

const words = (text: string, start: number, end: number) => {
  const glyphs = Array.from(text)
  const unit = (end - start) / glyphs.length
  return glyphs.map((glyph, index) => ({
    text: glyph,
    startTime: start + unit * index,
    endTime: start + unit * (index + 1),
  }))
}

const line = (
  fullText: string,
  translation: string,
  start: number,
  end: number,
  romanization = '',
  isChorus = false,
): LyricLine => ({
  startTime: start,
  endTime: end,
  fullText,
  words: words(fullText, start, end),
  translation,
  romanization,
  isChorus,
  renderHints: {
    rawDuration: end - start,
    timingClass: 'normal',
    renderEndTime: end + 0.3,
    wordRevealMode: 'normal',
    lineTransitionMode: 'normal',
  },
})

const lines: LyricLine[] = [
  line('夜が明けるまで踊ろう', '一起跳舞直到天明', 3.0, 6.4, 'yoru ga akeru made odorou'),
  line('ガラス越しの街が揺れる', '隔着玻璃的城市在摇晃', 6.2, 9.1, 'garasu goshi no machi ga yureru'),
  line('君の声だけが聞こえてる', '只听得见你的声音', 9.0, 12.4, 'kimi no koe dake ga kikoeteru', true),
  line('遠く消えてゆく電子音', '渐渐远去的电子音', 12.2, 15.2, 'tooku kiete yuku denshion'),
]

const host = document.querySelector<HTMLDivElement>('#lyrics')
const hud = document.querySelector<HTMLSpanElement>('#hud')
if (!host) throw new Error('probe host missing')

const abort = new AbortController()
const startAt = performance.now()
const startTime = 3.25

void createLatticeLyricRuntime(
  host,
  {
    songKey: 'lyric-probe',
    lines,
    theme: {
      ...DEFAULT_THEME,
      primaryColor: '#f5f3ff',
      accentColor: '#ff7add',
      secondaryColor: '#c7b8d9',
      fontWeight: 700,
    },
    subtitleTheme: {
      ...DEFAULT_THEME,
      primaryColor: '#e9ddff',
      fontWeight: 500,
    },
    showTranslation: true,
    subtitleContentMode: 'romanization',
    keywordColoringEnabled: true,
    reducedMotion: false,
    fontsEpoch: 0,
  },
  startTime,
  abort.signal,
  (error) => console.error(error),
).then((runtime) => {
  if (!runtime) return
  const rect = host.getBoundingClientRect()
  runtime.attach(host)
  runtime.resize(rect.width, rect.height, window.devicePixelRatio)
  runtime.setVisible(true)
  const update = () => {
    const time = startTime + ((performance.now() - startAt) / 1000) % 10
    runtime.setTime(time)
    if (hud) hud.textContent = `t=${time.toFixed(2)}s`
    requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
})

window.addEventListener('beforeunload', () => abort.abort(), { once: true })
