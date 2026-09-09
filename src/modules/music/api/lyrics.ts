export interface LyricLine {
  time: number
  text: string
}

const LRC_LINE = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\](.*)/

export function parseLrc(raw = '', translated = ''): LyricLine[] {
  const primary = parseSingleLrc(raw)
  if (!translated.trim()) return primary

  const translatedMap = new Map(parseSingleLrc(translated).map((line) => [line.time, line.text]))
  return primary.map((line) => {
    const extra = translatedMap.get(line.time)
    return extra && extra !== line.text ? { ...line, text: `${line.text}  ${extra}` } : line
  })
}

function parseSingleLrc(raw: string): LyricLine[] {
  return raw
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(LRC_LINE)
      if (!match) return null
      const text = match[4].trim()
      if (!text) return null
      const fraction = match[3] ?? '0'
      const millis = fraction.length === 3 ? Number(fraction) : Number(fraction.padEnd(2, '0')) * 10
      const time = Number(match[1]) * 60 + Number(match[2]) + millis / 1000
      return { time, text }
    })
    .filter((line): line is LyricLine => Boolean(line))
}

export function currentLyricIndex(lines: LyricLine[], time: number) {
  let index = 0
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].time <= time) index = i
    else break
  }
  return index
}
