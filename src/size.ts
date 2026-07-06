import { getStringWidth } from "./ansi"

/**
 * Get maximum line width of a multi-line string.
 * @param str - Multi-line string
 * @returns Maximum width in columns
 */
export function Width(str: string): number {
  let maxWidth = 0
  const lines = str.split("\n")
  for (const line of lines) {
    const w = getStringWidth(line)
    if (w > maxWidth) maxWidth = w
  }
  return maxWidth
}

/**
 * Count lines in a string.
 * @param str - String to measure
 * @returns Number of lines
 */
export function Height(str: string): number {
  return str.split("\n").length
}

/**
 * Get width and height of a multi-line string.
 * @param str - Multi-line string
 * @returns [width, height] tuple
 */
export function Size(str: string): [number, number] {
  return [Width(str), Height(str)]
}
