// ranges.ts | style ranges (lipgloss port)

import type { Style } from "./style"

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

/**
 * Style a string with a style.
 */
function styleToString(style: any): string {
  const parts: string[] = []
  if (style?.bold) parts.push("1")
  if (style?.italic) parts.push("3")
  if (style?.underline) parts.push("4")
  if (style?.strikethrough) parts.push("9")
  if (style?.dim) parts.push("2")
  if (style?.reverse) parts.push("7")
  if (style?.foreground) parts.push(`38;2;${hexToRgb(style.foreground)}`)
  if (style?.background) parts.push(`48;2;${hexToRgb(style.background)}`)
  if (parts.length === 0) return ""
  return `\x1b[${parts.join(";")}m`
}

function hexToRgb(hex: string): string {
  const rgba = Bun.color(hex, "[rgba]")
  if (rgba) return `${rgba[0]};${rgba[1]};${rgba[2]}`
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `${r};${g};${b}`
}
