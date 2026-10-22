import type { WordColorEntry } from './theme'

export interface WordColorRange {
  startOffset: number
  endOffset: number
  color: string
  priority: number
}

export interface WordColorMatcher {
  color: string
  cjkPhrases: string[]
  englishWords: string[]
  priority: number
}

export interface WordColorToken {
  key: string
  timed: boolean
  startOffset: number
  endOffset: number
}

const CJK_REGEX = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/
const isCJK = (text: string) => CJK_REGEX.test(text)
const normalizeWordColorToken = (text: string) => text.toLowerCase().replace(/[^\w]/g, '')

const rangesOverlap = (
  a: Pick<WordColorRange, 'startOffset' | 'endOffset'>,
  b: Pick<WordColorRange, 'startOffset' | 'endOffset'>,
) => a.startOffset < b.endOffset && b.startOffset < a.endOffset

const selectNonOverlappingRanges = (ranges: WordColorRange[]): WordColorRange[] => {
  const selected: WordColorRange[] = []
  const prioritySorted = [...ranges].sort((a, b) =>
    b.priority - a.priority
    || a.startOffset - b.startOffset
    || a.endOffset - b.endOffset,
  )

  prioritySorted.forEach((range) => {
    if (!selected.some((current) => rangesOverlap(current, range))) selected.push(range)
  })

  return selected.sort(
    (a, b) => a.startOffset - b.startOffset || a.endOffset - b.endOffset,
  )
}

/** Ported from `components/visualizer/wordColoring.ts`. */
export function prepareWordColorMatchers(
  wordColors: WordColorEntry[] | undefined,
  keywordColoringEnabled = true,
): WordColorMatcher[] {
  if (!keywordColoringEnabled || !wordColors?.length) return []

  return wordColors.flatMap<WordColorMatcher>((entry) => {
    const target = typeof entry.word === 'string' ? entry.word.trim() : ''
    const color = typeof entry.color === 'string' ? entry.color : ''
    if (!target || !color) return []

    if (isCJK(target)) {
      return [{
        color,
        cjkPhrases: [target],
        englishWords: [],
        priority: target.length,
      }]
    }

    const englishWords = target
      .split(/\s+/)
      .map(normalizeWordColorToken)
      .filter(Boolean)
    if (!englishWords.length) return []

    return [{
      color,
      cjkPhrases: [],
      englishWords,
      priority: Math.max(...englishWords.map((word) => word.length)),
    }]
  })
}

export function buildWordColorRangesFromMatchers(
  lineText: string,
  matchers: WordColorMatcher[],
): WordColorRange[] {
  if (!lineText || !matchers.length) return []

  const ranges: WordColorRange[] = []
  const englishColorByWord = new Map<string, { color: string; priority: number }>()

  matchers.forEach((matcher) => {
    matcher.cjkPhrases.forEach((target) => {
      let cursor = 0
      while (cursor < lineText.length) {
        const startOffset = lineText.indexOf(target, cursor)
        if (startOffset < 0) break
        ranges.push({
          startOffset,
          endOffset: startOffset + target.length,
          color: matcher.color,
          priority: matcher.priority,
        })
        cursor = startOffset + Math.max(target.length, 1)
      }
    })

    matcher.englishWords.forEach((word) => {
      const current = englishColorByWord.get(word)
      if (!current || matcher.priority > current.priority) {
        englishColorByWord.set(word, { color: matcher.color, priority: matcher.priority })
      }
    })
  })

  if (englishColorByWord.size > 0) {
    const wordRegex = /\w+/g
    let match: RegExpExecArray | null
    while ((match = wordRegex.exec(lineText)) !== null) {
      const wordColor = englishColorByWord.get(normalizeWordColorToken(match[0]))
      if (!wordColor) continue
      ranges.push({
        startOffset: match.index,
        endOffset: match.index + match[0].length,
        color: wordColor.color,
        priority: wordColor.priority,
      })
    }
  }

  return selectNonOverlappingRanges(ranges)
}

export function resolveTokenColorMap(
  tokens: WordColorToken[],
  ranges: WordColorRange[],
): Map<string, string> {
  const colors = new Map<string, string>()
  let rangeIndex = 0

  tokens.forEach((token) => {
    if (!token.timed) return
    while (rangeIndex < ranges.length && ranges[rangeIndex].endOffset <= token.startOffset) {
      rangeIndex += 1
    }
    const range = ranges[rangeIndex]
    if (range && rangesOverlap(range, token)) colors.set(token.key, range.color)
  })

  return colors
}
