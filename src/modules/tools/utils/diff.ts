export type DiffKind = 'equal' | 'add' | 'remove'

export interface DiffLine {
  kind: DiffKind
  text: string
  leftLine?: number
  rightLine?: number
}

interface DiffOptions {
  ignoreCase?: boolean
  ignoreWhitespace?: boolean
}

function normalize(line: string, options: DiffOptions) {
  let value = line
  if (options.ignoreWhitespace) value = value.replace(/\s+/g, ' ').trim()
  if (options.ignoreCase) value = value.toLocaleLowerCase()
  return value
}

function appendCommonAndChanged(
  left: string[],
  right: string[],
  prefixLength: number,
  suffixLength: number,
): DiffLine[] {
  const result: DiffLine[] = []
  for (let index = 0; index < prefixLength; index += 1) {
    result.push({ kind: 'equal', text: left[index], leftLine: index + 1, rightLine: index + 1 })
  }
  for (let index = prefixLength; index < left.length - suffixLength; index += 1) {
    result.push({ kind: 'remove', text: left[index], leftLine: index + 1 })
  }
  for (let index = prefixLength; index < right.length - suffixLength; index += 1) {
    result.push({ kind: 'add', text: right[index], rightLine: index + 1 })
  }
  for (let offset = suffixLength; offset > 0; offset -= 1) {
    const leftIndex = left.length - offset
    const rightIndex = right.length - offset
    result.push({
      kind: 'equal',
      text: left[leftIndex],
      leftLine: leftIndex + 1,
      rightLine: rightIndex + 1,
    })
  }
  return result
}

export function diffLines(leftText: string, rightText: string, options: DiffOptions = {}): DiffLine[] {
  const left = leftText.replace(/\r\n/g, '\n').split('\n')
  const right = rightText.replace(/\r\n/g, '\n').split('\n')
  const normalizedLeft = left.map((line) => normalize(line, options))
  const normalizedRight = right.map((line) => normalize(line, options))

  if (left.length * right.length > 400_000) {
    let prefixLength = 0
    while (
      prefixLength < left.length
      && prefixLength < right.length
      && normalizedLeft[prefixLength] === normalizedRight[prefixLength]
    ) prefixLength += 1

    let suffixLength = 0
    while (
      suffixLength < left.length - prefixLength
      && suffixLength < right.length - prefixLength
      && normalizedLeft[left.length - 1 - suffixLength] === normalizedRight[right.length - 1 - suffixLength]
    ) suffixLength += 1

    return appendCommonAndChanged(left, right, prefixLength, suffixLength)
  }

  const matrix = Array.from({ length: left.length + 1 }, () => new Uint32Array(right.length + 1))
  for (let leftIndex = left.length - 1; leftIndex >= 0; leftIndex -= 1) {
    for (let rightIndex = right.length - 1; rightIndex >= 0; rightIndex -= 1) {
      matrix[leftIndex][rightIndex] = normalizedLeft[leftIndex] === normalizedRight[rightIndex]
        ? matrix[leftIndex + 1][rightIndex + 1] + 1
        : Math.max(matrix[leftIndex + 1][rightIndex], matrix[leftIndex][rightIndex + 1])
    }
  }

  const result: DiffLine[] = []
  let leftIndex = 0
  let rightIndex = 0
  while (leftIndex < left.length || rightIndex < right.length) {
    if (
      leftIndex < left.length
      && rightIndex < right.length
      && normalizedLeft[leftIndex] === normalizedRight[rightIndex]
    ) {
      result.push({
        kind: 'equal',
        text: left[leftIndex],
        leftLine: leftIndex + 1,
        rightLine: rightIndex + 1,
      })
      leftIndex += 1
      rightIndex += 1
    } else if (
      rightIndex < right.length
      && (leftIndex >= left.length || matrix[leftIndex][rightIndex + 1] > matrix[leftIndex + 1][rightIndex])
    ) {
      result.push({ kind: 'add', text: right[rightIndex], rightLine: rightIndex + 1 })
      rightIndex += 1
    } else {
      result.push({ kind: 'remove', text: left[leftIndex], leftLine: leftIndex + 1 })
      leftIndex += 1
    }
  }
  return result
}
