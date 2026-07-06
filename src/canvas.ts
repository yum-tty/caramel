// canvas.ts | Canvas cell-buffer (lipgloss port)

import { Width, Height } from "./size"

export interface Rectangle {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function rect(x: number, y: number, w: number, h: number): Rectangle {
  return { minX: x, minY: y, maxX: x + w, maxY: y + h }
}

export interface Drawable {
  draw(screen: Screen, area: Rectangle): void
}

export interface Screen {
  cellAt(x: number, y: number): Cell | null
  setCell(x: number, y: number, cell: Cell): void
  width(): number
  height(): number
}

export interface Cell {
  char: string
  width: number
  style: string
}

export class ScreenBuffer implements Screen {
  private cells: (Cell | null)[][]
  private w: number
  private h: number

  constructor(width: number, height: number) {
    this.w = width
    this.h = height
    this.cells = []
    for (let y = 0; y < height; y++) {
      this.cells.push(new Array(width).fill(null))
    }
  }

  cellAt(x: number, y: number): Cell | null {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return null
    return this.cells[y]![x]
  }

  setCell(x: number, y: number, cell: Cell): void {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return
    this.cells[y]![x] = cell
  }

  width(): number { return this.w }
  height(): number { return this.h }

  resize(width: number, height: number): void {
    const newCells: (Cell | null)[][] = []
    for (let y = 0; y < height; y++) {
      const row: (Cell | null)[] = new Array(width).fill(null)
      if (y < this.h) {
        for (let x = 0; x < Math.min(width, this.w); x++) {
          row[x] = this.cells[y]![x]
        }
      }
      newCells.push(row)
    }
    this.cells = newCells
    this.w = width
    this.h = height
  }

  clear(): void {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        this.cells[y]![x] = null
      }
    }
  }

  bounds(): Rectangle {
    return rect(0, 0, this.w, this.h)
  }

  draw(scr: Screen, area: Rectangle): void {
    const ox = area.minX
    const oy = area.minY
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const cell = this.cells[y]![x]
        if (cell !== null) {
          scr.setCell(ox + x, oy + y, cell)
        }
      }
    }
  }

  render(): string {
    const lines: string[] = []
    for (let y = 0; y < this.h; y++) {
      let line = ""
      for (let x = 0; x < this.w; x++) {
        const cell = this.cells[y]![x]
        if (cell !== null) {
          if (cell.style) line += cell.style
          line += cell.char
          if (cell.style) line += "\x1b[0m"
        } else {
          line += " "
        }
      }
      lines.push(line)
    }
    return lines.join("\n")
  }
}

export class Canvas implements Screen {
  private scr: ScreenBuffer

  constructor(width: number, height: number) {
    this.scr = new ScreenBuffer(width, height)
  }

  resize(width: number, height: number): void {
    this.scr.resize(width, height)
  }

  clear(): void {
    this.scr.clear()
  }

  bounds(): Rectangle {
    return this.scr.bounds()
  }

  width(): number {
    return this.scr.width()
  }

  height(): number {
    return this.scr.height()
  }

  cellAt(x: number, y: number): Cell | null {
    return this.scr.cellAt(x, y)
  }

  setCell(x: number, y: number, cell: Cell): void {
    this.scr.setCell(x, y, cell)
  }

  compose(drawer: Drawable): Canvas {
    drawer.draw(this, this.bounds())
    return this
  }

  draw(scr: Screen, area: Rectangle): void {
    this.scr.draw(scr, area)
  }

  render(): string {
    return this.scr.render()
  }
}
