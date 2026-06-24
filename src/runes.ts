// runes.ts | rune styling (lipgloss port)

import type { Style } from "./style"

/**
 * StyleRunes applies styles to specific runes in a string.
 * @param str - The string to style
 * @param indices - The indices of runes to style with the matched style
 * @param matched - The style to apply to matched runes
 * @param unmatched - The style to apply to unmatched runes (optional)
 */
export function StyleRunes(
  str: string,
  indices: number[],
  matched: Style,
  unmatched?: Style,
): string {
  const runes = [...str]
  const indexSet = new Set(indices)

  let result = ""
  for (let i = 0; i < runes.length; i++) {
    const rune = runes[i]!
    if (indexSet.has(i)) {
      result += styleToString(matched) + rune + "\x1b[0m"
    } else if (unmatched) {
      result += styleToString(unmatched) + rune + "\x1b[0m"
    } else {
      result += rune
    }
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
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `${r};${g};${b}`
}
