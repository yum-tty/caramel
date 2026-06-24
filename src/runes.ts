// runes.ts | rune styling (lipgloss port)

import type { Style } from "./style"
import { styleToString } from "./styled"

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
