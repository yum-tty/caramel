// ranges.ts | style ranges (lipgloss port)

import type { Style } from "./style"
import { styleToString } from "./styled"

/**
 * Range represents a styled range of text.
 */
export interface Range {
  start: number
  end: number
  style: Style
}

/**
 * NewRange creates a new range.
 */
export function NewRange(start: number, end: number, style: Style): Range {
  return { start, end, style }
}

/**
 * StyleRanges applies styles to specific ranges of a string.
 */
export function StyleRanges(str: string, ...ranges: Range[]): string {
  if (ranges.length === 0) return str

  // Sort ranges by start position
  const sorted = [...ranges].sort((a, b) => a.start - b.start)

  let result = ""
  let lastEnd = 0

  for (const range of sorted) {
    // Add text before this range
    if (range.start > lastEnd) {
      result += str.slice(lastEnd, range.start)
    }

    // Add styled text
    const text = str.slice(range.start, range.end)
    result += styleToString(range.style) + text + "\x1b[0m"

    lastEnd = range.end
  }

  // Add remaining text
  if (lastEnd < str.length) {
    result += str.slice(lastEnd)
  }

  return result
}
