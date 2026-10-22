/**
 * Canvas layout and timing helpers for the lyric scene inside an expanded
 * Lattice poster.
 *
 * Source: `app/lattice/lyrics/latticeLyricLayout.ts` and the Monet token model.
 * The reference renderer uses Pixi for its sweep shader; these helpers keep the
 * same measurements, wrapping rules, token timing and fill widths so a Canvas2D
 * renderer can reproduce the visible result without a WebGL dependency.
 */

import type { LxTheme } from './theme'
import { resolveThemeFontStack, resolveThemeFontWeight, resolveThemeTranslationFontStack } from './theme'
import {
  splitGraphemes,
  type GraphemeTiming,
} from './foliaMotion'
import {
  findLatestActiveLineIndex,
  getLineRenderEndTime,
  resolveSingleTrackSubtitleMode,
  type LyricLine,
  type LyricWord,
  type SubtitleContentMode,
} from './lyric'

export interface MeasureText {
  (text: string, font: string): { width: number; height: number }
}

export interface LatticeTypography {
  fontPx: number
  font: string
  translationPx: number
  translationFont: string
  showTranslation: boolean
  subtitleContentMode: SubtitleContentMode
  lineHeight: number
  translationLineHeight: number
  padding: number
}

export interface MonetDisplayToken {
  text: string
  startTime: number | null
  endTime: number | null
  key: string
  timed: boolean
  startOffset: number
  endOffset: number
  graphemeTimings: GraphemeTiming[]
}

export interface LatticeLyricPiece {
  text: string
  x: number
  y: number
  width: number
  row: number
  token: MonetDisplayToken
  offsets: number[]
  tokenOffset: number
  translation: boolean
}

export interface LatticeLineLayout {
  pieces: LatticeLyricPiece[]
  rows: number
  textHeight: number
  height: number
}

export interface LatticeTrackInput {
  index: number
  line: LyricLine
  offset: number
  status: 'waiting' | 'active' | 'passed'
}

function buildEvenGraphemeTimings(
  text: string,
  startTime: number,
  endTime: number,
): GraphemeTiming[] {
  const graphemes = splitGraphemes(text)
  if (!graphemes.length) return []
  const duration = Math.max(endTime - startTime, 0)
  const unit = duration / graphemes.length
  return graphemes.map((char, index) => ({
    char,
    startTime: startTime + unit * index,
    endTime: index === graphemes.length - 1 ? endTime : startTime + unit * (index + 1),
  }))
}

function buildWordGraphemeTimings(word: LyricWord): GraphemeTiming[] {
  return buildEvenGraphemeTimings(word.text, word.startTime, word.endTime)
}

function findGraphemeSequence(source: string[], target: string[], fromIndex: number): number {
  if (!target.length) return fromIndex
  for (let index = fromIndex; index <= source.length - target.length; index += 1) {
    let matched = true
    for (let targetIndex = 0; targetIndex < target.length; targetIndex += 1) {
      if (source[index + targetIndex] !== target[targetIndex]) {
        matched = false
        break
      }
    }
    if (matched) return index
  }
  return -1
}

/**
 * Maps word timing back onto the full line, including spaces and punctuation that
 * the parser removed. Source: `utils/lyrics/graphemeTiming.ts`.
 */
export function buildLineGraphemeTimings(line: LyricLine): GraphemeTiming[] {
  const lineGraphemes = splitGraphemes(line.fullText)
  if (!lineGraphemes.length) return []
  if (!line.words.length) {
    return buildEvenGraphemeTimings(line.fullText, line.startTime, line.endTime)
  }

  const timeline: GraphemeTiming[] = []
  let cursor = 0
  let lastResolvedTime = line.startTime

  line.words.forEach((word, wordIndex) => {
    const wordGraphemes = splitGraphemes(word.text)
    if (!wordGraphemes.length) return

    const matchedStart = findGraphemeSequence(lineGraphemes, wordGraphemes, cursor)
    const start = matchedStart >= 0 ? matchedStart : cursor
    const end = Math.min(start + wordGraphemes.length, lineGraphemes.length)

    for (let gapIndex = cursor; gapIndex < start; gapIndex += 1) {
      timeline[gapIndex] = {
        char: lineGraphemes[gapIndex],
        startTime: word.startTime,
        endTime: word.startTime,
      }
    }

    const wordTimings = buildWordGraphemeTimings(word)
    for (let localIndex = 0; localIndex < end - start; localIndex += 1) {
      const timing = wordTimings[localIndex]
        ?? buildEvenGraphemeTimings(
          wordGraphemes[localIndex] ?? '',
          word.startTime,
          word.endTime,
        )[0]
      if (!timing) continue
      timeline[start + localIndex] = {
        ...timing,
        char: lineGraphemes[start + localIndex],
      }
      lastResolvedTime = Math.max(lastResolvedTime, timing.endTime)
    }

    cursor = Math.max(cursor, end)
    void wordIndex
  })

  for (let index = 0; index < lineGraphemes.length; index += 1) {
    if (timeline[index]) continue
    timeline[index] = {
      char: lineGraphemes[index],
      startTime: lastResolvedTime,
      endTime: lastResolvedTime,
    }
  }

  return timeline
}

export const resolveLatticeTypography = (
  theme: LxTheme,
  width: number,
  height: number,
  measure: MeasureText,
  showTranslation = true,
  subtitleContentMode: SubtitleContentMode = showTranslation ? 'translation' : 'none',
): LatticeTypography => {
  const family = resolveThemeFontStack(theme)
  const translationFamily = resolveThemeTranslationFontStack(theme)
  const weight = resolveThemeFontWeight(theme, 600)
  const translationWeight = resolveThemeFontWeight(theme, 500)

  let fontPx = 24
  for (let size = 64; size >= 24; size -= 1) {
    const main = measure('国Agyp', `${weight} ${size}px ${family}`)
    const sub = measure('国Agyp', `${translationWeight} ${size * 0.5}px ${translationFamily}`)
    const lineHeight = Math.max(size * 1.18, main.height + 2)
    const budget =
      lineHeight * (3 + 2 * 0.72)
      + size * 0.49 * 2
      + size * 1.2
      + (showTranslation
        ? Math.max(size * 0.5 * 1.35, sub.height + 2) * 2 + size * 0.3
        : 0)
    if (budget <= height && main.width * 3 <= Math.max(0, width - size * 1.2)) {
      fontPx = size
      break
    }
  }

  const font = `${weight} ${fontPx}px ${family}`
  const translationPx = fontPx * 0.5
  const translationFont = `${translationWeight} ${translationPx}px ${translationFamily}`
  const visibleMode = subtitleContentMode === 'none' ? 'none' : subtitleContentMode
  return {
    fontPx,
    font,
    translationPx,
    translationFont,
    showTranslation: visibleMode !== 'none',
    subtitleContentMode: visibleMode,
    lineHeight: Math.max(fontPx * 1.18, measure('国Agyp', font).height + 2),
    translationLineHeight: Math.max(
      translationPx * 1.35,
      measure('国Agyp', translationFont).height + 2,
    ),
    padding: Math.ceil(fontPx * 0.6),
  }
}

/** Mirrors `buildMonetDisplayTokens`: parser words keep their timing, gaps stay static. */
export function buildLatticeDisplayTokens(line: LyricLine): MonetDisplayToken[] {
  if (line.words.length === 0) {
    return [{
      text: line.fullText,
      startTime: line.startTime,
      endTime: getLineRenderEndTime(line),
      key: `${line.startTime}-full`,
      timed: true,
      startOffset: 0,
      endOffset: line.fullText.length,
      graphemeTimings: buildLineGraphemeTimings(line),
    }]
  }

  const tokens: MonetDisplayToken[] = []
  let cursor = 0
  line.words.forEach((word, index) => {
    const matchIndex = line.fullText.indexOf(word.text, cursor)
    if (matchIndex < 0) return
    if (matchIndex > cursor) {
      tokens.push({
        text: line.fullText.slice(cursor, matchIndex),
        startTime: null,
        endTime: null,
        key: `${line.startTime}-static-${cursor}`,
        timed: false,
        startOffset: cursor,
        endOffset: matchIndex,
        graphemeTimings: [],
      })
    }
    const endOffset = matchIndex + word.text.length
    tokens.push({
      text: word.text,
      startTime: word.startTime,
      endTime: word.endTime,
      key: `${line.startTime}-${index}-${word.startTime}`,
      timed: true,
      startOffset: matchIndex,
      endOffset,
      graphemeTimings: buildWordGraphemeTimings(word),
    })
    cursor = endOffset
  })

  if (cursor < line.fullText.length) {
    tokens.push({
      text: line.fullText.slice(cursor),
      startTime: null,
      endTime: null,
      key: `${line.startTime}-tail-${cursor}`,
      timed: false,
      startOffset: cursor,
      endOffset: line.fullText.length,
      graphemeTimings: [],
    })
  }

  return tokens.length
    ? tokens
    : [{
        text: line.fullText,
        startTime: line.startTime,
        endTime: getLineRenderEndTime(line),
        key: `${line.startTime}-fallback`,
        timed: true,
        startOffset: 0,
        endOffset: line.fullText.length,
        graphemeTimings: buildLineGraphemeTimings(line),
      }]
}

/** Token-boundary wrapping with grapheme splitting only when a token overflows. */
export function wrapLatticeTokens(
  tokens: MonetDisplayToken[],
  width: number,
  font: string,
  lineHeight: number,
  measure: MeasureText,
  translation = false,
): LatticeLyricPiece[] {
  const pieces: LatticeLyricPiece[] = []
  let x = 0
  let row = 0
  for (const token of tokens) {
    const glyphs = splitGraphemes(token.text)
    const offsets = [0]
    for (let index = 1; index <= glyphs.length; index += 1) {
      offsets.push(measure(glyphs.slice(0, index).join(''), font).width)
    }
    const fullWidth = offsets[offsets.length - 1] ?? 0
    if (!token.text.includes('\n') && x > 0 && x + fullWidth > width) {
      row += 1
      x = 0
    }
    let first = 0
    while (first < glyphs.length) {
      if (glyphs[first] === '\n') {
        row += 1
        x = 0
        first += 1
        continue
      }
      let last = first + 1
      while (
        last < glyphs.length
        && glyphs[last] !== '\n'
        && measure(glyphs.slice(first, last + 1).join(''), font).width + x <= width
      ) {
        last += 1
      }
      const text = glyphs.slice(first, last).join('')
      const pieceWidth = measure(text, font).width
      pieces.push({
        text,
        x,
        y: row * lineHeight,
        width: pieceWidth,
        row,
        token,
        offsets,
        tokenOffset: offsets[first],
        translation,
      })
      x += pieceWidth
      first = last
      if (first < glyphs.length && glyphs[first] !== '\n') {
        row += 1
        x = 0
      }
    }
  }
  return pieces
}

export function layoutLatticeLine(
  line: LyricLine,
  type: LatticeTypography,
  width: number,
  measure: MeasureText,
): LatticeLineLayout {
  const tokens = buildLatticeDisplayTokens(line)
  const pieces = wrapLatticeTokens(tokens, width, type.font, type.lineHeight, measure)
  const rows = (pieces[pieces.length - 1]?.row ?? 0) + 1
  const subtitleMode = resolveSingleTrackSubtitleMode(type.subtitleContentMode)
  const translation = type.showTranslation && subtitleMode === 'romanization'
    ? line.romanization?.trim() ?? ''
    : type.showTranslation
      ? line.translation?.trim() ?? ''
      : ''
  const translationToken: MonetDisplayToken = {
    text: translation,
    timed: false,
    startTime: null,
    endTime: null,
    key: 'translation',
    startOffset: 0,
    endOffset: translation.length,
    graphemeTimings: [],
  }
  const sub = translation
    ? wrapLatticeTokens(
        [translationToken],
        width,
        type.translationFont,
        type.translationLineHeight,
        measure,
        true,
      ).filter((piece) => piece.row < 2)
    : []
  const textHeight = rows * type.lineHeight
  for (const piece of sub) {
    piece.y += textHeight + type.fontPx * 0.3
  }
  const translationHeight = sub.length
    ? type.fontPx * 0.3 + ((sub[sub.length - 1]?.row ?? 0) + 1) * type.translationLineHeight
    : 0
  return {
    pieces: [...pieces, ...sub],
    rows,
    textHeight,
    height: textHeight + translationHeight,
  }
}

export const clampLatticeProgress = (value: number) =>
  Math.min(1, Math.max(0, value))

/** Source: `monetLyricMotion.resolveMonetFillWidth`. */
export function resolveLatticeFillWidth(
  time: number,
  start: number,
  end: number,
  offsets: number[],
  timings: GraphemeTiming[],
): number {
  const width = offsets[offsets.length - 1] ?? 0
  if (time <= start) return 0
  if (time >= end) return width
  const count = Math.min(timings.length, offsets.length - 1)
  if (count > 0) {
    for (let index = 0; index < count; index += 1) {
      const timing = timings[index]
      const timingStart = Math.max(start, timing.startTime)
      const timingEnd = Math.max(timingStart, timing.endTime)
      if (time < timingStart) return offsets[index]
      if (time <= timingEnd) {
        const progress = (time - timingStart) / Math.max(0.001, timingEnd - timingStart)
        return offsets[index] + (offsets[index + 1] - offsets[index]) * progress
      }
    }
    return offsets[count] ?? width
  }
  const index = clampLatticeProgress((time - start) / Math.max(0.001, end - start))
    * (offsets.length - 1)
  const whole = Math.floor(index)
  return (offsets[whole] ?? width)
    + ((offsets[whole + 1] ?? width) - (offsets[whole] ?? width)) * (index - whole)
}

/** Source: `monetLyricMotion.resolveMonetGlow`. */
export function resolveLatticeGlow(time: number, start: number, end: number, lineEnd: number): number {
  if (time <= start) return 0
  const rise = Math.max(0.001, end - start) * 1.18
  const peak = start + rise
  const tail = Math.max(lineEnd, end + 1.05)
  if (time <= peak) {
    const progress = clampLatticeProgress((time - start) / rise)
    return progress * progress * (3 - 2 * progress)
  }
  const remaining = 1 - clampLatticeProgress((time - peak) / Math.max(0.18, tail - peak))
  return remaining * remaining * (3 - 2 * remaining)
}

export function resolveLatticeSweepSoftness(fontPx: number): number {
  return Math.max(Math.min(fontPx * 0.45, 16), 6)
}

export function resolveLatticeSweepEnd(filledWidth: number, fullWidth: number, softness: number): number {
  if (fullWidth <= 0) return 0
  const progress = clampLatticeProgress(filledWidth / fullWidth)
  return filledWidth + softness * progress
}

export function resolveLatticeLongLineOffset(
  layout: LatticeLineLayout,
  time: number,
  available: number,
  lineHeight: number,
): number {
  if (layout.height <= available) return 0
  const timed = layout.pieces.filter((piece) => !piece.translation && piece.token.timed)
  let active: LatticeLyricPiece | undefined = timed[0]
  for (const piece of timed) {
    const start = piece.token.startTime ?? Infinity
    const end = piece.token.endTime ?? Infinity
    if (time < start) break
    const front = resolveLatticeFillWidth(
      time,
      start,
      end,
      piece.offsets,
      piece.token.graphemeTimings,
    )
    if (front >= piece.tokenOffset) active = piece
    if (time <= end && front < piece.tokenOffset + piece.width) break
  }
  return Math.min(
    Math.max(0, layout.height - available),
    Math.max(0, (active?.y ?? 0) - available * 0.46 + lineHeight / 2),
  )
}

/** Selects the previous/current/next lyric tracks, matching the reference window. */
export function buildLatticeTracks(lines: LyricLine[], time: number): LatticeTrackInput[] {
  if (!lines.length) return []
  const activeIndex = findLatestActiveLineIndex(lines, time)
  let recentIndex = -1
  if (activeIndex < 0) {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      if (time > getLineRenderEndTime(lines[index])) {
        recentIndex = index
        break
      }
    }
  }
  let upcomingIndex = -1
  if (activeIndex >= 0) {
    upcomingIndex = activeIndex + 1 < lines.length ? activeIndex + 1 : -1
  } else {
    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].startTime > time) {
        upcomingIndex = index
        break
      }
    }
  }
  const anchor = activeIndex >= 0
    ? activeIndex
    : upcomingIndex >= 0
      ? upcomingIndex
      : recentIndex
  if (anchor < 0) return []

  const tracks: LatticeTrackInput[] = []
  for (let index = Math.max(0, anchor - 1); index <= Math.min(lines.length - 1, anchor + 1); index += 1) {
    const line = lines[index]
    const status = index === activeIndex
      || (activeIndex < 0 && time >= line.startTime && time <= line.endTime)
      ? 'active'
      : time > line.endTime || (activeIndex >= 0 && index < activeIndex)
        ? 'passed'
        : 'waiting'
    tracks.push({ index, line, offset: index - anchor, status })
  }
  return tracks
}

export function lineHasReadableText(line: LyricLine): boolean {
  return /[\p{L}\p{N}]/u.test(line.fullText)
}

export function wordAtTime(word: LyricWord, time: number): boolean {
  return time >= word.startTime && time <= word.endTime
}
