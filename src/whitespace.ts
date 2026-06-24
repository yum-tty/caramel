// whitespace.ts | whitespace rendering (lipgloss port)

import { Style } from "./style"

/**
 * WhitespaceOption sets a styling rule for rendering whitespace.
 */
export type WhitespaceOption = (w: Whitespace) => void

/**
 * WithWhitespaceStyle sets the style for the whitespace.
 */
export function WithWhitespaceStyle(s: Style): WhitespaceOption {
  return (w) => {
    w.style = s
  }
}

/**
 * WithWhitespaceChars sets the characters to be rendered in the whitespace.
 */
export function WithWhitespaceChars(s: string): WhitespaceOption {
  return (w) => {
    w.chars = s
  }
}

/**
 * Whitespace is a whitespace renderer.
 */
export class Whitespace {
  chars: string = " "
  style: Style = Style.newStyle()

  constructor(...opts: WhitespaceOption[]) {
    for (const opt of opts) {
      opt(this)
    }
  }

  /**
   * Render whitespace of a given width.
   */
  render(width: number): string {
    if (this.chars === "") this.chars = " "

    const runes = [...this.chars]
    let result = ""
    let j = 0

    for (let i = 0; i < width; i++) {
      result += runes[j % runes.length]
      j++
    }

    // Fill any extra gaps
    const short = width - result.length
    if (short > 0) {
      result += " ".repeat(short)
    }

    return this.style.render(result)
  }
}

/**
 * Place places a string in an unstyled box of a given width and height.
 */
export function Place(
  width: number,
  height: number,
  hPos: number,
  vPos: number,
  str: string,
  ...opts: WhitespaceOption[]
): string {
  return PlaceVertical(height, vPos, PlaceHorizontal(width, hPos, str, ...opts), ...opts)
}

/**
 * PlaceHorizontal places a string horizontally in an unstyled block.
 */
export function PlaceHorizontal(
  width: number,
  pos: number,
  str: string,
  ...opts: WhitespaceOption[]
): string {
  const lines = str.split("\n")
  let contentWidth = 0
  for (const line of lines) {
    const w = line.length
    if (w > contentWidth) contentWidth = w
  }

  const gap = width - contentWidth
  if (gap <= 0) return str

  const ws = new Whitespace(...opts)
  const result: string[] = []

  for (const line of lines) {
    const short = Math.max(0, contentWidth - line.length)

    if (pos === 0) {
      result.push(line + ws.render(gap + short))
    } else if (pos === 1) {
      result.push(ws.render(gap + short) + line)
    } else {
      const totalGap = gap + short
      const split = Math.round(totalGap * pos)
      const left = totalGap - split
      const right = totalGap - left
      result.push(ws.render(left) + line + ws.render(right))
    }
  }

  return result.join("\n")
}

/**
 * PlaceVertical places a string vertically in an unstyled block.
 */
export function PlaceVertical(
  height: number,
  pos: number,
  str: string,
  ...opts: WhitespaceOption[]
): string {
  const lines = str.split("\n")
  const contentHeight = lines.length
  const gap = height - contentHeight

  if (gap <= 0) return str

  const ws = new Whitespace(...opts)
  let contentWidth = 0
  for (const line of lines) {
    const w = line.length
    if (w > contentWidth) contentWidth = w
  }

  const emptyLine = ws.render(contentWidth)
  const result: string[] = []

  if (pos === 0) {
    result.push(str)
    for (let i = 0; i < gap; i++) {
      result.push(emptyLine)
    }
  } else if (pos === 1) {
    for (let i = 0; i < gap; i++) {
      result.push(emptyLine)
    }
    result.push(str)
  } else {
    const split = Math.round(gap * pos)
    const top = gap - split
    const bottom = gap - top

    for (let i = 0; i < top; i++) {
      result.push(emptyLine)
    }
    result.push(str)
    for (let i = 0; i < bottom; i++) {
      result.push(emptyLine)
    }
  }

  return result.join("\n")
}
