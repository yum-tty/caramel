// join.ts | JoinHorizontal/JoinVertical (lipgloss port)

import type { Position } from "./position"
import { positionValue } from "./position"
import { getStringWidth } from "./ansi"

/**
 * Split a string into lines and return max width.
 */
function getLines(str: string): [string[], number] {
  const lines = str.split("\n")
  let maxWidth = 0
  for (const line of lines) {
    const w = getStringWidth(line)
    if (w > maxWidth) maxWidth = w
  }
  return [lines, maxWidth]
}

/**
 * JoinHorizontal joins strings horizontally along a vertical axis.
 * pos: 0 = top, 1 = bottom, 0.5 = center
 */
export function JoinHorizontal(pos: Position, ...strs: string[]): string {
  if (strs.length === 0) return ""
  if (strs.length === 1) return strs[0]

  const blocks: string[][] = []
  const maxWidths: number[] = []
  let maxHeight = 0

  for (const str of strs) {
    const [lines, maxWidth] = getLines(str)
    blocks.push(lines)
    maxWidths.push(maxWidth)
    if (lines.length > maxHeight) maxHeight = lines.length
  }

  // Pad blocks to same height
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i]!.length >= maxHeight) continue

    const extraLines = new Array(maxHeight - blocks[i]!.length).fill("")
    const p = positionValue(pos)

    if (pos === 0) {
      blocks[i]!.push(...extraLines)
    } else if (pos === 1) {
      blocks[i]!.unshift(...extraLines)
    } else {
      const n = extraLines.length
      const split = Math.round(n * p)
      const top = n - split
      const bottom = n - top
      blocks[i]!.unshift(...extraLines.slice(top))
      blocks[i]!.push(...extraLines.slice(bottom))
    }
  }

  // Merge lines
  const result: string[] = []
  for (let i = 0; i < maxHeight; i++) {
    let line = ""
    for (let j = 0; j < blocks.length; j++) {
      const blockLine = blocks[j]![i] || ""
      const padding = " ".repeat(Math.max(0, maxWidths[j]! - getStringWidth(blockLine)))
      const hasAnsi = blockLine.includes("\x1b[")
      line += blockLine + (hasAnsi ? "\x1b[0m" : "") + padding
    }
    result.push(line)
  }

  return result.join("\n")
}

/**
 * JoinVertical joins strings vertically along a horizontal axis.
 * pos: 0 = left, 1 = right, 0.5 = center
 */
export function JoinVertical(pos: Position, ...strs: string[]): string {
  if (strs.length === 0) return ""
  if (strs.length === 1) return strs[0]

  const blocks: string[][] = []
  let maxWidth = 0

  for (const str of strs) {
    const [lines, width] = getLines(str)
    blocks.push(lines)
    if (width > maxWidth) maxWidth = width
  }

  const result: string[] = []
  const p = positionValue(pos)

  for (const block of blocks) {
    for (const line of block) {
      const w = maxWidth - getStringWidth(line)
      const hasAnsi = line.includes("\x1b[")

      if (pos === 0) {
        result.push(line + (hasAnsi ? "\x1b[0m" : "") + " ".repeat(w))
      } else if (pos === 1) {
        result.push(" ".repeat(w) + line)
      } else {
        if (w < 1) {
          result.push(line)
        } else {
          const split = Math.round(w * p)
          const right = w - split
          const left = w - right
          result.push(" ".repeat(left) + line + (hasAnsi ? "\x1b[0m" : "") + " ".repeat(right))
        }
      }
    }
  }

  return result.join("\n")
}
