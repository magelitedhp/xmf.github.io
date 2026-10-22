import type { LyricLine, LyricWord } from './lyric'

/**
 * Parser-preserving CJK semantic layout, ported from Folia's
 * `utils/lyrics/cjkSemanticLayout.ts`.
 *
 * Parser words remain the timing source. Display words only merge punctuation and
 * contractions; semantic CJK units keep their individual parser words so per-glyph
 * karaoke timing is not lost.
 */

export interface LyricLayoutUnit {
  text: string
  words: LyricWord[]
  startTime: number
  endTime: number
  isSemantic: boolean
  isSticky?: boolean
}

interface Segment {
  segment: string
  isWordLike?: boolean
}

type SegmenterConstructor = new (
  locales?: string | string[],
  options?: { granularity: 'word' },
) => { segment(input: string): Iterable<Segment> }

const CJK_REGEX = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/
const WHITESPACE_REGEX = /^\s+$/
const APOSTROPHE_ONLY_REGEX = /^['’]\s*$/
const CONTRACTION_SUFFIX_REGEX = /^(s|t|m|d|ll|re|ve|em)\s*$/i
const DIRECT_CONTRACTION_REGEX = /^['’](s|t|m|d|ll|re|ve|em)\s*$/i
const TRAILING_APOSTROPHE_REGEX = /['’]\s*$/
const TRAILING_WORD_CHAR_REGEX = /[\p{L}\p{N}]$/u
const INLINE_CONTRACTION_REGEX = /[\p{L}\p{N}]+['’](s|t|m|d|ll|re|ve|em)/iu
const STICKY_TRAILING_PUNCTUATION_REGEX =
  /^[,.;:!?，。！？、：；）】》」』〉〕］)}\]"'’”’]+$/u

const segmenterConstructor = (Intl as typeof Intl & { Segmenter?: SegmenterConstructor }).Segmenter
const wordSegmenter = segmenterConstructor
  ? new segmenterConstructor(undefined, { granularity: 'word' })
  : null

const hasCjkText = (text: string) => CJK_REGEX.test(text)

const createSingleWordUnits = (words: LyricWord[]): LyricLayoutUnit[] =>
  words.map((word) => ({
    text: word.text,
    words: [word],
    startTime: word.startTime,
    endTime: word.endTime,
    isSemantic: false,
  }))

const appendWordsToUnit = (unit: LyricLayoutUnit, text: string, words: LyricWord[]) => {
  unit.text += text
  unit.words.push(...words)
  unit.endTime = words[words.length - 1]?.endTime ?? unit.endTime
}

const cloneUnit = (unit: LyricLayoutUnit): LyricLayoutUnit => ({
  ...unit,
  words: [...unit.words],
})

const appendUnitToStickyUnit = (target: LyricLayoutUnit, unit: LyricLayoutUnit) => {
  target.text += unit.text
  target.words.push(...unit.words)
  target.endTime = unit.endTime
  target.isSticky = true
}

const stripWhitespace = (text: string) => text.replace(/\s+/g, '')

function mapSegmentsToWords(segments: Segment[], words: LyricWord[]): LyricLayoutUnit[] | null {
  const units: LyricLayoutUnit[] = []
  let wordIndex = 0
  const normalizedWords = words.map((word) => stripWhitespace(word.text))

  for (const segment of segments) {
    const segmentText = segment.segment
    if (!segmentText || WHITESPACE_REGEX.test(segmentText)) continue

    const normalizedSegment = stripWhitespace(segmentText)
    if (!normalizedSegment) continue

    const startWordIndex = wordIndex
    let collectedText = ''
    while (wordIndex < words.length && collectedText.length < normalizedSegment.length) {
      collectedText += normalizedWords[wordIndex] ?? ''
      wordIndex += 1
      if (!normalizedSegment.startsWith(collectedText)) return null
    }

    if (collectedText !== normalizedSegment) return null

    const segmentWords = words.slice(startWordIndex, wordIndex)
    const firstWord = segmentWords[0]
    const lastWord = segmentWords[segmentWords.length - 1]
    if (!firstWord || !lastWord) return null

    if (!segment.isWordLike && units.length > 0) {
      appendWordsToUnit(units[units.length - 1], segmentText, segmentWords)
      continue
    }

    units.push({
      text: segmentText,
      words: segmentWords,
      startTime: firstWord.startTime,
      endTime: lastWord.endTime,
      isSemantic: Boolean(segment.isWordLike && hasCjkText(segmentText) && segmentWords.length > 1),
    })
  }

  if (wordIndex !== words.length || units.length === 0) return null
  return units
}

function buildSemanticUnits(line: LyricLine): LyricLayoutUnit[] {
  if (!line.words.length) return []
  const fallback = createSingleWordUnits(line.words)
  if (!hasCjkText(line.fullText) || !wordSegmenter) return fallback
  return mapSegmentsToWords([...wordSegmenter.segment(line.fullText)], line.words) ?? fallback
}

function applyStickyPunctuation(units: LyricLayoutUnit[]): LyricLayoutUnit[] {
  const merged: LyricLayoutUnit[] = []

  for (let index = 0; index < units.length; index += 1) {
    const current = units[index]
    const previous = merged[merged.length - 1]
    if (!previous) {
      merged.push(cloneUnit(current))
      continue
    }

    const next = units[index + 1]
    if (
      APOSTROPHE_ONLY_REGEX.test(current.text.trim())
      && next
      && TRAILING_WORD_CHAR_REGEX.test(previous.text.trimEnd())
      && CONTRACTION_SUFFIX_REGEX.test(next.text.trim())
    ) {
      appendUnitToStickyUnit(previous, current)
      appendUnitToStickyUnit(previous, next)
      index += 1
      continue
    }

    if (
      DIRECT_CONTRACTION_REGEX.test(current.text.trim())
      && TRAILING_WORD_CHAR_REGEX.test(previous.text.trimEnd())
    ) {
      appendUnitToStickyUnit(previous, current)
      continue
    }

    if (
      CONTRACTION_SUFFIX_REGEX.test(current.text.trim())
      && TRAILING_APOSTROPHE_REGEX.test(previous.text.trimEnd())
    ) {
      appendUnitToStickyUnit(previous, current)
      continue
    }

    if (
      STICKY_TRAILING_PUNCTUATION_REGEX.test(current.text.trim())
      && TRAILING_WORD_CHAR_REGEX.test(previous.text.trimEnd())
    ) {
      appendUnitToStickyUnit(previous, current)
      continue
    }

    merged.push(cloneUnit(current))
  }

  return merged.map((unit) => {
    const lastWord = unit.words[unit.words.length - 1]
    const attachedTrailingPunctuation = Boolean(
      unit.words.length > 1
      && lastWord
      && STICKY_TRAILING_PUNCTUATION_REGEX.test(lastWord.text.trim()),
    )
    const inlineContraction = unit.words.length > 1
      && !unit.isSemantic
      && INLINE_CONTRACTION_REGEX.test(unit.text)
    return attachedTrailingPunctuation || inlineContraction
      ? { ...unit, isSticky: true }
      : unit
  })
}

export function buildDisplayWordsForLine(line: LyricLine): LyricWord[] {
  const units = applyStickyPunctuation(buildSemanticUnits(line))
  return displayWordsFromLayoutUnits(units)
}

export function buildLayoutUnitsForLine(line: LyricLine): LyricLayoutUnit[] {
  return applyStickyPunctuation(buildSemanticUnits(line))
}

export function displayWordsFromLayoutUnits(units: LyricLayoutUnit[]): LyricWord[] {
  return units.flatMap((unit) => {
    if (!unit.isSticky || unit.isSemantic) return unit.words
    return [{
      text: unit.text,
      startTime: unit.startTime,
      endTime: unit.endTime,
    }]
  })
}
