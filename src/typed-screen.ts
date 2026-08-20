// typed-screen.ts | TypedArray-based screen buffer for JSC optimization

import type { Rectangle, Screen, Cell } from "./canvas"

// Style index mapping for compact storage
const styleMap = new Map<string, number>()
const styleReverse = new Map<number, string>()
let nextStyleIndex = 1

function getStyleIndex(style: string): number {
  if (style === "") return 0

  let idx = styleMap.get(style)
  if (idx === undefined) {
    idx = nextStyleIndex++
    styleMap.set(style, idx)
    styleReverse.set(idx, style)
  }
  return idx
}

function getStyleString(idx: number): string {
  if (idx === 0) return ""
  return styleReverse.get(idx) ?? ""
}

export class TypedScreenBuffer implements Screen {
  private charCodes: Uint32Array  // Unicode code points
  private charWidths: Uint8Array  // Character widths (1 or 2)
  private styleIndices: Uint16Array  // Style indices
  private w: number
  private h: number

  constructor(width: number, height: number) {
    this.w = width
    this.h = height
    const size = width * height
    this.charCodes = new Uint32Array(size)
    this.charWidths = new Uint8Array(size)
    this.styleIndices = new Uint16Array(size)

    // Initialize with spaces
    this.charCodes.fill(32) // ASCII space
    this.charWidths.fill(1)
    this.styleIndices.fill(0)
  }

  private idx(x: number, y: number): number {
    return y * this.w + x
  }

  cellAt(x: number, y: number): Cell | null {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return null

    const i = this.idx(x, y)
    const code = this.charCodes[i]!

    if (code === 0) return null

    const char = String.fromCodePoint(code)
    const style = getStyleString(this.styleIndices[i]!)

    return { char, width: this.charWidths[i]!, style }
  }

  setCell(x: number, y: number, cell: Cell): void {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return

    const i = this.idx(x, y)
    const code = cell.char.codePointAt(0) ?? 32

    this.charCodes[i] = code
    this.charWidths[i] = cell.width ?? 1
    this.styleIndices[i] = getStyleIndex(cell.style)
  }

  setCellDirect(x: number, y: number, char: string, style: string, width: number = 1): void {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return

    const i = this.idx(x, y)
    this.charCodes[i] = char.codePointAt(0) ?? 32
    this.charWidths[i] = width
    this.styleIndices[i] = getStyleIndex(style)
  }

  width(): number { return this.w }
  height(): number { return this.h }

  resize(width: number, height: number): void {
    const newCharCodes = new Uint32Array(width * height)
    const newCharWidths = new Uint8Array(width * height)
    const newStyleIndices = new Uint16Array(width * height)

    // Initialize with spaces
    newCharCodes.fill(32)
    newCharWidths.fill(1)

    // Copy existing data
    for (let y = 0; y < Math.min(height, this.h); y++) {
      for (let x = 0; x < Math.min(width, this.w); x++) {
        const oldIdx = this.idx(x, y)
        const newIdx = y * width + x
        newCharCodes[newIdx] = this.charCodes[oldIdx]!
        newCharWidths[newIdx] = this.charWidths[oldIdx]!
        newStyleIndices[newIdx] = this.styleIndices[oldIdx]!
      }
    }

    this.charCodes = newCharCodes
    this.charWidths = newCharWidths
    this.styleIndices = newStyleIndices
    this.w = width
    this.h = height
  }

  clear(): void {
    this.charCodes.fill(32)
    this.charWidths.fill(1)
    this.styleIndices.fill(0)
  }

  bounds(): Rectangle {
    return { minX: 0, minY: 0, maxX: this.w, maxY: this.h }
  }

  draw(scr: Screen, area: Rectangle): void {
    const ox = area.minX
    const oy = area.minY
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const i = this.idx(x, y)
        const code = this.charCodes[i]!
        if (code !== 0) {
          const char = String.fromCodePoint(code)
          const style = getStyleString(this.styleIndices[i]!)
          scr.setCell(ox + x, oy + y, { char, width: this.charWidths[i]!, style })
        }
      }
    }
  }

  render(): string {
    const lines: string[] = []
    for (let y = 0; y < this.h; y++) {
      let line = ""
      for (let x = 0; x < this.w; x++) {
        const i = this.idx(x, y)
        const code = this.charCodes[i]!
        const style = getStyleString(this.styleIndices[i]!)

        if (style) line += style
        line += String.fromCodePoint(code)
        if (style) line += "\x1b[0m"
      }
      lines.push(line)
    }
    return lines.join("\n")
  }
}
