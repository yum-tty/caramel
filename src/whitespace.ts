import { Style } from "./style"
import { getStringWidth } from "./ansi"

export type WhitespaceOption = (w: Whitespace) => void

export function WithWhitespaceStyle(s: Style): WhitespaceOption {
  return (w) => { w.style = s }
}

export function WithWhitespaceChars(s: string): WhitespaceOption {
  return (w) => { w.chars = s }
}

export class Whitespace {
  chars: string = " "
  style: Style = Style.newStyle()

  constructor(...opts: WhitespaceOption[]) {
    for (const opt of opts) opt(this)
  }

  render(width: number): string {
    if (this.chars === "") this.chars = " "
    const runes = [...this.chars]
    let result = ""
    let j = 0
    for (let i = 0; i < width; i++) {
      result += runes[j % runes.length]!
      j++
    }
    const short = width - getStringWidth(result)
    if (short > 0) result += " ".repeat(short)
    return this.style.render(result)
  }
}

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

export function PlaceHorizontal(
  width: number,
  pos: number,
  str: string,
  ...opts: WhitespaceOption[]
): string {
  const lines = str.split("\n")
  let contentWidth = 0
  for (const line of lines) {
    const w = getStringWidth(line)
    if (w > contentWidth) contentWidth = w
  }

  const gap = width - contentWidth
  if (gap <= 0) return str

  const ws = new Whitespace(...opts)
  const result: string[] = []

  for (const line of lines) {
    const short = Math.max(0, contentWidth - getStringWidth(line))
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
    const w = getStringWidth(line)
    if (w > contentWidth) contentWidth = w
  }

  const emptyLine = ws.render(contentWidth)
  const result: string[] = []

  if (pos === 0) {
    result.push(str)
    for (let i = 0; i < gap; i++) result.push(emptyLine)
  } else if (pos === 1) {
    for (let i = 0; i < gap; i++) result.push(emptyLine)
    result.push(str)
  } else {
    const split = Math.round(gap * pos)
    const top = gap - split
    const bottom = gap - top
    for (let i = 0; i < top; i++) result.push(emptyLine)
    result.push(str)
    for (let i = 0; i < bottom; i++) result.push(emptyLine)
  }

  return result.join("\n")
}
