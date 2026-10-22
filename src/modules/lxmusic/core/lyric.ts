/**
 * Lyric pipeline for Yumo Music.
 *
 * Parses plain LRC plus enhanced (word-timed) LRC into the line/word model that the
 * immersive visualizer consumes. Render hints keep line and word transitions fluid.
 */

export interface LyricWord {
  text: string
  startTime: number
  endTime: number
}

export interface LyricLine {
  startTime: number
  endTime: number
  fullText: string
  words: LyricWord[]
  translation: string
  romanization: string
  isChorus: boolean
  renderHints: LyricRenderHints
}

export interface LyricRenderHints {
  rawDuration: number
  timingClass: 'normal' | 'short' | 'micro'
  renderEndTime: number
  wordRevealMode: 'normal' | 'fast' | 'instant'
  lineTransitionMode: 'normal' | 'fast' | 'none'
}

export interface ParsedLyric {
  lines: LyricLine[]
  /** Offset applied by the metadata tags, kept for the settings panel. */
  offset: number
}

export type SubtitleContentMode = 'translation' | 'romanization' | 'both' | 'none'
export type SubtitleTrackRole = 'romanization' | 'translation'

export interface SubtitleTrack {
  role: SubtitleTrackRole
  text: string
}

const SUBTITLE_TRACK_ORDER: SubtitleTrackRole[] = ['romanization', 'translation']

/**
 * Resolves one alternate-text row for renderers that only have room for a
 * single subtitle. Lattice falls back to translation in `both` mode.
 */
export function resolveSingleTrackSubtitleMode(
  mode: SubtitleContentMode,
): Exclude<SubtitleContentMode, 'both'> {
  return mode === 'both' ? 'translation' : mode
}

export function resolveSubtitleContentMode(
  mode: SubtitleContentMode | undefined,
  legacyShowTranslation = true,
): SubtitleContentMode {
  return mode ?? (legacyShowTranslation ? 'translation' : 'none')
}

/** Translation and romanization use two independent switches. */
export function resolveLegacySubtitleContentMode(
  showTranslation: boolean,
  showRomanization: boolean,
): SubtitleContentMode {
  if (showTranslation && showRomanization) return 'both'
  if (showRomanization) return 'romanization'
  return showTranslation ? 'translation' : 'none'
}

/**
 * Ordered subtitle rows: romanization first, translation second.
 * `both` omits whichever track is missing and de-duplicates identical text.
 */
export function resolveSubtitleTracks(
  line: Pick<LyricLine, 'translation' | 'romanization'> | null | undefined,
  mode: SubtitleContentMode,
  isReadable: (text: string) => boolean = () => true,
): SubtitleTrack[] {
  if (!line || mode === 'none') return []
  const roles = mode === 'both' ? SUBTITLE_TRACK_ORDER : [mode]
  const tracks: SubtitleTrack[] = []
  for (const role of roles) {
    const text = (role === 'translation' ? line.translation : line.romanization)?.trim() ?? ''
    if (!text || !isReadable(text)) continue
    if (tracks.some((track) => track.text === text)) continue
    tracks.push({ role, text })
  }
  return tracks
}

export function resolveAlternateText(
  line: Pick<LyricLine, 'translation' | 'romanization'> | null | undefined,
  mode: SubtitleContentMode,
): string {
  const single = resolveSingleTrackSubtitleMode(mode)
  if (!line || single === 'none') return ''
  return (single === 'translation' ? line.translation : line.romanization)?.trim() ?? ''
}

const TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g
const WORD_TAG = /<(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?>/g
const META_TAG = /^\[(ti|ar|al|by|offset|length|re|ve):(.*)\]$/i
const ALTERNATE_TRACK_MATCH_WINDOW = 1

function fractionToSeconds(fraction: string | undefined): number {
  if (!fraction) return 0
  if (fraction.length === 3) return Number(fraction) / 1000
  if (fraction.length === 2) return Number(fraction) / 100
  return Number(fraction) / 10
}

function tagToSeconds(min: string, sec: string, frac?: string): number {
  return Number(min) * 60 + Number(sec) + fractionToSeconds(frac)
}

/** Splits a raw LRC body into `{ time, text }` pairs, expanding multi-timestamp lines. */
function collectTimedLines(raw: string): Array<{ time: number; text: string }> {
  const out: Array<{ time: number; text: string }> = []
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    TIME_TAG.lastIndex = 0
    const stamps: number[] = []
    let match: RegExpExecArray | null
    while ((match = TIME_TAG.exec(line)) !== null) {
      stamps.push(tagToSeconds(match[1], match[2], match[3]))
    }
    if (!stamps.length) continue
    const text = line.replace(TIME_TAG, '').trim()
    if (!text) continue
    for (const time of stamps) out.push({ time, text })
  }
  return out.sort((a, b) => a.time - b.time)
}

/** Extracts `<mm:ss.xx>` word timings when the source ships enhanced LRC. */
function splitWords(text: string, lineStart: number, lineEnd: number): LyricWord[] {
  WORD_TAG.lastIndex = 0
  if (!WORD_TAG.test(text)) {
    return buildSyntheticWords(text, lineStart, lineEnd)
  }

  WORD_TAG.lastIndex = 0
  const marks: Array<{ time: number; index: number }> = []
  let match: RegExpExecArray | null
  while ((match = WORD_TAG.exec(text)) !== null) {
    marks.push({ time: tagToSeconds(match[1], match[2], match[3]), index: match.index })
  }
  const plain = text.replace(WORD_TAG, '')
  if (!marks.length) return buildSyntheticWords(plain, lineStart, lineEnd)

  // Rebuild offsets against the tag-free string.
  const words: LyricWord[] = []
  let cursor = 0
  let plainOffset = 0
  for (let i = 0; i < marks.length; i += 1) {
    const mark = marks[i]
    const next = marks[i + 1]
    const segmentEnd = next ? next.index : text.length
    const segment = text.slice(mark.index, segmentEnd).replace(WORD_TAG, '')
    const startTime = mark.time
    const endTime = next ? next.time : lineEnd
    if (segment.trim()) {
      words.push({ text: segment, startTime, endTime: Math.max(endTime, startTime + 0.05) })
    }
    plainOffset += segment.length
    cursor += 1
  }
  void cursor
  void plainOffset
  return words.length ? words : buildSyntheticWords(plain, lineStart, lineEnd)
}

const CJK = /[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/
const LATIN_TOKEN = /[A-Za-z0-9'’\-]+/g

/**
 * Splits a line into timed tokens. CJK text is split per character (like lx-music's
 * karaoke mode), latin text per word.
 */
function buildSyntheticWords(text: string, startTime: number, endTime: number): LyricWord[] {
  const tokens: string[] = []
  if (CJK.test(text)) {
    for (const char of Array.from(text)) tokens.push(char)
  } else {
    LATIN_TOKEN.lastIndex = 0
    let match: RegExpExecArray | null
    let last = 0
    while ((match = LATIN_TOKEN.exec(text)) !== null) {
      if (match.index > last) tokens.push(text.slice(last, match.index))
      tokens.push(match[0])
      last = match.index + match[0].length
    }
    if (last < text.length) tokens.push(text.slice(last))
  }

  const visible = tokens.filter((token) => token.trim().length > 0)
  const total = Math.max(endTime - startTime, 0.3)
  const weights = visible.map((token) => (CJK.test(token) ? 1 : Math.max(token.length, 1)))
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0) || 1

  let cursor = startTime
  return visible.map((token, index) => {
    const span = (total * weights[index]) / weightSum
    const word = { text: token, startTime: cursor, endTime: cursor + span }
    cursor += span
    return word
  })
}

function isChorusLine(text: string, index: number, all: string[]): boolean {
  const previous = all[index - 1]
  const next = all[index + 1]
  return Boolean(previous && previous === text) || Boolean(next && next === text)
}

// src/utils/lyrics/renderHints.ts
const MICRO_LINE_DURATION_THRESHOLD = 0.1
const SHORT_LINE_DURATION_THRESHOLD = 0.18
const MICRO_LINE_RENDER_FLOOR = 0.067

function lineTiming(rawDuration: number): 'normal' | 'short' | 'micro' {
  if (rawDuration < MICRO_LINE_DURATION_THRESHOLD) return 'micro'
  if (rawDuration < SHORT_LINE_DURATION_THRESHOLD) return 'short'
  return 'normal'
}

/**
 * The lyric pipeline's complete render-hint block, ported verbatim from Folia.
 * `renderEndTime` deliberately outlives the parser's line end so the stage can
 * finish its exit polish without cutting the last word.
 */
function buildRenderHints(words: LyricWord[], startTime: number, endTime: number): LyricRenderHints {
  const rawDuration = Math.max(endTime - startTime, 0)
  const timingClass = lineTiming(rawDuration)
  const lineTransitionMode: LyricRenderHints['lineTransitionMode'] =
    timingClass === 'micro' ? 'none' : timingClass === 'short' ? 'fast' : 'normal'
  const wordRevealMode: LyricRenderHints['wordRevealMode'] =
    timingClass === 'micro' ? 'instant' : timingClass === 'short' ? 'fast' : 'normal'

  if (lineTransitionMode === 'none') {
    return {
      rawDuration,
      timingClass,
      renderEndTime: Math.max(endTime, startTime + MICRO_LINE_RENDER_FLOOR),
      lineTransitionMode,
      wordRevealMode,
    }
  }

  let enterDuration = 0
  let exitDuration = 0
  let linePassHold = 0
  if (lineTransitionMode === 'fast') {
    enterDuration = Math.min(0.06, Math.max(0.045, rawDuration * 0.45))
    exitDuration = Math.min(0.04, Math.max(0.03, rawDuration * 0.22))
    linePassHold = wordRevealMode === 'instant' ? 0 : 0.03
  } else {
    enterDuration = Math.min(0.42, Math.max(0.22, Math.max(rawDuration, 0.12) * 0.34))
    exitDuration = Math.min(0.32, Math.max(0.18, Math.max(rawDuration, 0.12) * 0.18))
    linePassHold = wordRevealMode === 'instant' ? 0 : 0.06
  }

  const lastWordEnd = words[words.length - 1]?.endTime ?? endTime
  const linePassStart = Math.max(lastWordEnd, startTime) + linePassHold
  const exitStart =
    lineTransitionMode === 'fast'
      ? Math.max(startTime + enterDuration + 0.01, linePassStart, endTime - exitDuration)
      : Math.max(linePassStart, endTime - exitDuration)

  return {
    rawDuration,
    timingClass,
    renderEndTime: Math.max(endTime, exitStart + exitDuration),
    lineTransitionMode,
    wordRevealMode,
  }
}

function buildLines(
  timed: Array<{ time: number; text: string }>,
  alternates: {
    translations: string[]
    romanizations: string[]
  },
  offset: number,
): LyricLine[] {
  const lines: LyricLine[] = []
  const texts = timed.map((entry) => entry.text)

  timed.forEach((entry, index) => {
    const next = timed[index + 1]
    const startTime = Math.max(0, entry.time - offset)
    const rawEnd = next ? next.time - offset : startTime + 6
    const endTime = Math.max(rawEnd, startTime + 0.4)
    const words = splitWords(entry.text, startTime, endTime)
    lines.push({
      startTime,
      endTime,
      fullText: entry.text,
      words,
      translation: alternates.translations[index] ?? '',
      romanization: alternates.romanizations[index] ?? '',
      isChorus: isChorusLine(entry.text, index, texts),
      renderHints: buildRenderHints(words, startTime, endTime),
    })
  })

  return lines
}

function lowerBoundByTime(entries: Array<{ time: number }>, time: number): number {
  let low = 0
  let high = entries.length
  while (low < high) {
    const middle = (low + high) >> 1
    if (entries[middle].time < time) low = middle + 1
    else high = middle
  }
  return low
}

/**
 * Port of `findTranslationsForSortedStartTimes` from Folia's parser.
 * Every line and alternate entry is used at most once; candidate pairs inside
 * the ±1s window are settled by smallest time difference first.
 */
function matchAlternateTexts(
  startTimes: number[],
  entries: Array<{ time: number; text: string }>,
): string[] {
  const result = startTimes.map(() => '')
  if (!startTimes.length || !entries.length) return result

  const candidates: Array<{ line: number; entry: number; diff: number }> = []
  startTimes.forEach((startTime, line) => {
    for (
      let entry = lowerBoundByTime(entries, startTime - ALTERNATE_TRACK_MATCH_WINDOW);
      entry < entries.length && entries[entry].time < startTime + ALTERNATE_TRACK_MATCH_WINDOW;
      entry += 1
    ) {
      const diff = Math.abs(entries[entry].time - startTime)
      if (diff < ALTERNATE_TRACK_MATCH_WINDOW) candidates.push({ line, entry, diff })
    }
  })

  candidates.sort(
    (left, right) =>
      left.diff - right.diff || left.line - right.line || left.entry - right.entry,
  )

  const lineTaken = new Array<boolean>(startTimes.length).fill(false)
  const entryTaken = new Array<boolean>(entries.length).fill(false)
  for (const candidate of candidates) {
    if (lineTaken[candidate.line] || entryTaken[candidate.entry]) continue
    lineTaken[candidate.line] = true
    entryTaken[candidate.entry] = true
    result[candidate.line] = entries[candidate.entry].text
  }
  return result
}

export function parseLyric(raw = '', translated = '', userOffset = 0, romanized = ''): ParsedLyric {
  if (!raw.trim()) return { lines: [], offset: userOffset }

  let offset = userOffset
  const body: string[] = []
  for (const line of raw.split(/\r?\n/)) {
    const meta = line.trim().match(META_TAG)
    if (meta) {
      if (meta[1].toLowerCase() === 'offset') {
        // LRC offset is milliseconds and shifts lyrics *earlier* when positive.
        offset = userOffset - Number(meta[2] || 0) / 1000
      }
      continue
    }
    body.push(line)
  }

  const timed = collectTimedLines(body.join('\n'))
  const startTimes = timed.map((entry) => entry.time)
  const translations = matchAlternateTexts(
    startTimes,
    translated.trim() ? collectTimedLines(translated) : [],
  )
  const romanizations = matchAlternateTexts(
    startTimes,
    romanized.trim() ? collectTimedLines(romanized) : [],
  )

  return { lines: buildLines(timed, { translations, romanizations }, offset), offset }
}

export function findLineIndex(lines: LyricLine[], time: number): number {
  if (!lines.length) return -1
  if (time < lines[0].startTime) return -1
  let low = 0
  let high = lines.length - 1
  let result = -1
  while (low <= high) {
    const mid = (low + high) >> 1
    if (lines[mid].startTime <= time) {
      result = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return result
}

export function getLineRenderEndTime(line: LyricLine): number {
  return line.renderHints.renderEndTime
}

/**
 * Folia keeps a line active only until its render hints say its exit is done. The
 * difference matters in instrumental gaps: the stage must clear the line so the
 * subtitle rail can fall back to the recently completed line.
 */
export function findLatestActiveLineIndex(lines: LyricLine[], time: number): number {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]
    if (!line || time < line.startTime) continue
    if (time <= getLineRenderEndTime(line)) return index
  }
  return -1
}

export function getRecentCompletedLine(
  lines: LyricLine[],
  currentLineIndex: number,
  time: number,
): LyricLine | null {
  if (currentLineIndex !== -1 || lines.length === 0) return null
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (time > getLineRenderEndTime(lines[index])) return lines[index]
  }
  return null
}

export function getUpcomingLines(
  lines: LyricLine[],
  currentLineIndex: number,
  count = 2,
): LyricLine[] {
  if (currentLineIndex < 0) return []
  return lines.slice(currentLineIndex + 1, currentLineIndex + 1 + count)
}

export function getWordActiveEndTime(word: LyricWord, hints: LyricRenderHints, lineEnd: number): number {
  if (hints.wordRevealMode === 'instant') return lineEnd
  if (hints.wordRevealMode === 'fast') return Math.min(lineEnd, Math.max(word.endTime, word.startTime + 0.12))
  return word.endTime
}

export function getWordLookahead(hints: LyricRenderHints): number {
  return hints.wordRevealMode === 'instant' ? 0.03 : hints.wordRevealMode === 'fast' ? 0.08 : 0.15
}

export function getWordDisplayDuration(word: LyricWord, hints: LyricRenderHints, lineEnd: number): number {
  const activeEnd = getWordActiveEndTime(word, hints, lineEnd)
  const min = hints.wordRevealMode === 'instant' ? 0.08 : hints.wordRevealMode === 'fast' ? 0.12 : 0.1
  return Math.max(activeEnd - word.startTime, min)
}

const STICKY_TRAILING_PUNCTUATION = /^[,.;:!?，。！？、：；）】》」』〉〕］)}\]"'’”’]+$/u
const APOSTROPHE_ONLY = /^['’]\s*$/
const CONTRACTION_SUFFIX = /^(s|t|m|d|ll|re|ve|em)\s*$/i
const DIRECT_CONTRACTION = /^['’](s|t|m|d|ll|re|ve|em)\s*$/i

/**
 * Folia's display-word planning: parser fragments stay authoritative for timing,
 * while punctuation and contractions are rendered with the word they follow.
 */
export function buildDisplayWords(words: LyricWord[]): LyricWord[] {
  const display: LyricWord[] = []
  for (let index = 0; index < words.length; index += 1) {
    const word = words[index]
    const previous = display[display.length - 1]
    const next = words[index + 1]
    if (!previous) {
      display.push({ ...word })
      continue
    }

    if (
      APOSTROPHE_ONLY.test(word.text)
      && next
      && CONTRACTION_SUFFIX.test(next.text)
    ) {
      previous.text += `${word.text}${next.text}`
      previous.endTime = next.endTime
      index += 1
      continue
    }

    if (
      (DIRECT_CONTRACTION.test(word.text) || CONTRACTION_SUFFIX.test(word.text)
        || STICKY_TRAILING_PUNCTUATION.test(word.text.trim()))
      && /[\p{L}\p{N}'’]$/u.test(previous.text.trimEnd())
    ) {
      previous.text += word.text
      previous.endTime = word.endTime
      continue
    }

    display.push({ ...word })
  }
  return display
}

/** Plain-text export used by the "复制歌词" action. */
export function lyricToText(lines: LyricLine[]): string {
  return lines
    .map((line) => {
      const alternate = [line.romanization, line.translation].filter(Boolean).join('\n')
      return alternate ? `${line.fullText}\n${alternate}` : line.fullText
    })
    .join('\n')
}

