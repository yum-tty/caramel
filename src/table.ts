import { Style } from "./style"
import { borders, type BorderStyle } from "./border"
import { getStringWidth, stripAnsi } from "./ansi"
import { JoinHorizontal } from "./join"
import { Top } from "./position"
import { Resizer, btoi, sum } from "./table-resizing"
import { Truncate } from "./wrap"

export const HeaderRow = -1

export type TableStyleFunc = (row: number, col: number) => Style

export function DefaultStyles(_row: number, _col: number): Style {
  return Style.newStyle()
}

// ── Data interface ──

export interface DataInterface {
  At(row: number, cell: number): string
  Rows(): number
  Columns(): number
}

// ── StringData ──

export class StringData implements DataInterface {
  private _rows: string[][] = []
  private _columns = 0

  static New(...rows: string[][]): StringData {
    const m = new StringData()
    for (const row of rows) {
      m._columns = Math.max(m._columns, row.length)
      m._rows.push(row)
    }
    return m
  }

  Append(row: string[]): void {
    this._columns = Math.max(this._columns, row.length)
    this._rows.push(row)
  }

  Item(...rows: string[]): StringData {
    this._columns = Math.max(this._columns, rows.length)
    this._rows.push(rows)
    return this
  }

  At(row: number, cell: number): string {
    if (row >= this._rows.length || cell >= this._rows[row]!.length) return ""
    return this._rows[row]![cell]!
  }

  Columns(): number {
    return this._columns
  }

  Rows(): number {
    return this._rows.length
  }
}

// ── Filter ──

export class Filter implements DataInterface {
  private data: DataInterface
  private _filter: ((row: number) => boolean) | null = null

  static New(data: DataInterface): Filter {
    return new Filter(data)
  }

  constructor(data: DataInterface) {
    this.data = data
  }

  FilterFn(f: (row: number) => boolean): Filter {
    this._filter = f
    return this
  }

  At(row: number, cell: number): string {
    if (!this._filter) return this.data.At(row, cell)
    let j = 0
    for (let i = 0; i < this.data.Rows(); i++) {
      if (this._filter(i)) {
        if (j === row) return this.data.At(i, cell)
        j++
      }
    }
    return ""
  }

  Columns(): number {
    return this.data.Columns()
  }

  Rows(): number {
    if (!this._filter) return this.data.Rows()
    let j = 0
    for (let i = 0; i < this.data.Rows(); i++) {
      if (this._filter(i)) j++
    }
    return j
  }
}

export function NewFilter(data: DataInterface): Filter {
  return Filter.New(data)
}

export function NewStringData(...rows: string[][]): StringData {
  return StringData.New(...rows)
}

// ── DataToMatrix ──

export function DataToMatrix(data: DataInterface): string[][] {
  const numRows = data.Rows()
  const numCols = data.Columns()
  const rows: string[][] = []
  for (let i = 0; i < numRows; i++) {
    const row: string[] = []
    for (let j = 0; j < numCols; j++) {
      row.push(data.At(i, j))
    }
    rows.push(row)
  }
  return rows
}

// ── Table ──

export class Table {
  private baseStyle: Style = Style.newStyle()
  private styleFunc: TableStyleFunc | null = null
  private border: BorderStyle = borders.normal!

  private borderTop = true
  private borderBottom = true
  private borderLeft = true
  private borderRight = true
  private borderHeader = true
  private borderColumn = true
  private borderRow = false

  private borderStyle: Style = Style.newStyle()
  private headers: string[] = []
  private data: DataInterface = new StringData()

  private width = 0
  private height = 0
  private useManualHeight = false
  private yOffset = 0
  private wrap = true

  private widths: number[] = []
  private heights: number[] = []

  private firstVisibleRowIndex = 0
  private lastVisibleRowIndex = -2
  private overflowHeight = 0

  static New(): Table {
    return new Table()
  }

  ClearRows(): Table {
    this.data = new StringData()
    return this
  }

  BaseStyle(baseStyle: Style): Table {
    this.baseStyle = baseStyle
    this.borderStyle = this.borderStyle.inherit(baseStyle)
    return this
  }

  StyleFunc(fn: TableStyleFunc): Table {
    this.styleFunc = fn
    return this
  }

  private style(row: number, col: number): Style {
    if (!this.styleFunc) return this.baseStyle
    return this.styleFunc(row, col).inherit(this.baseStyle)
  }

  Data(data: DataInterface): Table {
    this.data = data
    return this
  }

  GetData(): DataInterface {
    return this.data
  }

  Rows(...rows: string[][]): Table {
    for (const row of rows) {
      if (this.data instanceof StringData) {
        this.data.Append(row)
      }
    }
    return this
  }

  Row(...row: string[]): Table {
    if (this.data instanceof StringData) {
      this.data.Append(row)
    }
    return this
  }

  Headers(...headers: string[]): Table {
    this.headers = headers
    return this
  }

  GetHeaders(): string[] {
    return this.headers
  }

  Border(border: BorderStyle | null): Table {
    this.border = border || borders.normal!
    return this
  }

  BorderTop(v: boolean): Table {
    this.borderTop = v
    return this
  }

  BorderBottom(v: boolean): Table {
    this.borderBottom = v
    return this
  }

  BorderLeft(v: boolean): Table {
    this.borderLeft = v
    return this
  }

  BorderRight(v: boolean): Table {
    this.borderRight = v
    return this
  }

  BorderHeader(v: boolean): Table {
    this.borderHeader = v
    return this
  }

  BorderColumn(v: boolean): Table {
    this.borderColumn = v
    return this
  }

  BorderRow(v: boolean): Table {
    this.borderRow = v
    return this
  }

  BorderStyle(style: Style): Table {
    this.borderStyle = style.inherit(this.baseStyle)
    return this
  }

  GetBorderTop(): boolean { return this.borderTop }
  GetBorderBottom(): boolean { return this.borderBottom }
  GetBorderLeft(): boolean { return this.borderLeft }
  GetBorderRight(): boolean { return this.borderRight }
  GetBorderHeader(): boolean { return this.borderHeader }
  GetBorderColumn(): boolean { return this.borderColumn }
  GetBorderRow(): boolean { return this.borderRow }

  Width(w: number): Table {
    this.width = w
    return this
  }

  Height(h: number): Table {
    this.height = h
    this.useManualHeight = true
    return this
  }

  GetHeight(): number {
    return this.height
  }

  YOffset(o: number): Table {
    this.yOffset = o
    return this
  }

  GetYOffset(): number {
    return this.yOffset
  }

  FirstVisibleRowIndex(): number {
    return this.firstVisibleRowIndex
  }

  LastVisibleRowIndex(): number {
    return this.lastVisibleRowIndex
  }

  VisibleRows(): number {
    if (this.lastVisibleRowIndex === -2) {
      return this.data.Rows() - this.firstVisibleRowIndex
    }
    return this.lastVisibleRowIndex - this.firstVisibleRowIndex + 1
  }

  Wrap(w: boolean): Table {
    this.wrap = w
    return this
  }

  // ── Rendering ──

  private resize(): void {
    const hasHeaders = this.headers.length > 0
    const rows = DataToMatrix(this.data)

    const r = new Resizer(this.width, this.height, this.headers, rows)
    r.wrap = this.wrap
    r.borderColumn = this.borderColumn
    r.yPaddings = []

    r.yOffset = this.yOffset
    r.useManualHeight = this.useManualHeight
    r.borderTop = this.borderTop
    r.borderBottom = this.borderBottom
    r.borderLeft = this.borderLeft
    r.borderRight = this.borderRight
    r.borderHeader = this.borderHeader
    r.borderRow = this.borderRow

    let allRows: string[][]
    if (hasHeaders) {
      allRows = [this.headers, ...rows]
    } else {
      allRows = rows
    }

    const styleFunc = this.styleFunc || DefaultStyles

    r.rowHeights = r.defaultRowHeights()

    for (let i = 0; i < allRows.length; i++) {
      r.yPaddings[i] = []
      for (let j = 0; j < allRows[i]!.length; j++) {
        const column = r.columns[j]
        if (!column) continue

        let rowIndex = i
        if (hasHeaders) rowIndex--
        const st = styleFunc(rowIndex, j)

        column.xPadding = Math.max(column.xPadding, st.getHorizontalFrameSize())
        column.fixedWidth = Math.max(column.fixedWidth, st.getWidth())
        r.rowHeights[i] = Math.max(r.rowHeights[i]!, st.getHeight())
        r.yPaddings[i]![j] = st.getVerticalFrameSize()
      }
    }

    if (r.tableWidth <= 0) {
      r.tableWidth = r.detectTableWidth()
    }

    const result = r.optimizedWidths()
    this.widths = result.colWidths
    this.heights = result.rowHeights
    this.firstVisibleRowIndex = result.firstVisibleRowIndex
    this.lastVisibleRowIndex = result.lastVisibleRowIndex
    this.overflowHeight = result.overflowHeight
  }

  String(): string {
    const hasHeaders = this.headers.length > 0
    const hasRows = this.data && this.data.Rows() > 0

    if (!hasHeaders && !hasRows) return ""

    if (hasHeaders) {
      while (this.headers.length < this.data.Columns()) {
        this.headers.push("")
      }
    }

    this.resize()

    const sb: string[] = []

    if (this.borderTop) {
      sb.push(this.constructTopBorder())
      sb.push("\n")
    }

    if (hasHeaders) {
      sb.push(this.constructHeaders())
    }

    let bottom = ""
    if (this.borderBottom) {
      bottom = this.constructBottomBorder()
    }

    if (this.data.Rows() > 0) {
      for (let r = this.firstVisibleRowIndex; r < this.data.Rows(); r++) {
        if (this.lastVisibleRowIndex !== -2 && r > this.lastVisibleRowIndex) break
        sb.push(this.constructRow(r, false))
      }

      if (this.lastVisibleRowIndex !== -2) {
        sb.push(this.constructRow(this.lastVisibleRowIndex + 1, true))
      }
    }

    sb.push(bottom)

    const joined = sb.join("").replace(/\n$/, "")
    return Style.newStyle()
      .maxHeight(Math.min(this.height || Infinity, this.computeHeight()))
      .maxWidth(this.width || 0)
      .render(joined)
  }

  Render(): string {
    return this.String()
  }

  private computeHeight(): number {
    const hasHeaders = this.headers.length > 0
    return sum(this.heights) - 1 + btoi(hasHeaders) +
      btoi(this.borderTop) + btoi(this.borderBottom) +
      btoi(this.borderHeader) + this.data.Rows() * btoi(this.borderRow)
  }

  // ── Border construction ──

  private constructTopBorder(): string {
    const s: string[] = []
    if (this.borderLeft) {
      s.push(this.borderStyle.render(this.border.topLeft))
    }
    for (let i = 0; i < this.widths.length; i++) {
      s.push(this.borderStyle.render(this.border.top.repeat(this.widths[i]!)))
      if (i < this.widths.length - 1 && this.borderColumn) {
        s.push(this.borderStyle.render(this.border.middleTop || this.border.top))
      }
    }
    if (this.borderRight) {
      s.push(this.borderStyle.render(this.border.topRight))
    }
    return s.join("")
  }

  private constructBottomBorder(): string {
    const s: string[] = []
    if (this.borderLeft) {
      s.push(this.borderStyle.render(this.border.bottomLeft))
    }
    for (let i = 0; i < this.widths.length; i++) {
      s.push(this.borderStyle.render(this.border.bottom.repeat(this.widths[i]!)))
      if (i < this.widths.length - 1 && this.borderColumn) {
        s.push(this.borderStyle.render(this.border.middleBottom || this.border.bottom))
      }
    }
    if (this.borderRight) {
      s.push(this.borderStyle.render(this.border.bottomRight))
    }
    return s.join("")
  }

  private constructHeaders(): string {
    const cells: string[] = []
    const height = this.heights[0]!

    const left = this.borderStyle.render(this.border.left) + "\n"

    if (this.borderLeft) {
      cells.push(left.repeat(height))
    }

    for (let j = 0; j < this.headers.length; j++) {
      const cellStyle = this.style(HeaderRow, j)
      let header = this.headers[j]!
      header = this.truncateCell(header, HeaderRow, j)

      cells.push(
        cellStyle
          .height(height - cellStyle.getVerticalMargins())
          .width(this.widths[j]! - cellStyle.getHorizontalMargins())
          .render(header)
      )

      if (j < this.headers.length - 1 && this.borderColumn) {
        cells.push(left.repeat(height))
      }
    }

    if (this.borderRight) {
      const right = this.borderStyle.render(this.border.right) + "\n"
      cells.push(right.repeat(height))
    }

    for (let i = 0; i < cells.length; i++) {
      cells[i] = cells[i]!.replace(/\n+$/, "")
    }

    let s = JoinHorizontal(Top, ...cells) + "\n"

    if (this.borderHeader) {
      if (this.borderLeft) {
        s += this.borderStyle.render(this.border.middleLeft || this.border.left)
      }
      for (let i = 0; i < this.headers.length; i++) {
        s += this.borderStyle.render(this.border.top.repeat(this.widths[i]!))
        if (i < this.headers.length - 1 && this.borderColumn) {
          s += this.borderStyle.render(this.border.middle || this.border.top)
        }
      }
      if (this.borderRight) {
        s += this.borderStyle.render(this.border.middleRight || this.border.right)
      }
      s += "\n"
    }

    return s
  }

  private constructRow(index: number, isOverflow: boolean): string {
    const cells: string[] = []
    const hasHeaders = this.headers.length > 0

    let height: number
    if (!isOverflow) {
      height = this.heights[index + btoi(hasHeaders)]!
    } else {
      height = this.overflowHeight
    }

    const left = this.borderStyle.render(this.border.left) + "\n"
    if (this.borderLeft) {
      cells.push(left.repeat(height))
    }

    for (let c = 0; c < this.data.Columns(); c++) {
      let cell = "\u2026"
      if (!isOverflow) {
        cell = this.data.At(index, c)
      }

      const cellStyle = this.style(index, c)
      if (!this.wrap) {
        cell = this.truncateCell(cell, index, c)
      }
      cells.push(
        cellStyle
          .height(height - cellStyle.getVerticalMargins())
          .maxHeight(height)
          .width(this.widths[c]! - cellStyle.getHorizontalMargins())
          .maxWidth(this.widths[c]!)
          .render(cell)
      )

      if (c < this.data.Columns() - 1 && this.borderColumn) {
        cells.push(left.repeat(height))
      }
    }

    if (this.borderRight) {
      const right = this.borderStyle.render(this.border.right) + "\n"
      cells.push(right.repeat(height))
    }

    for (let i = 0; i < cells.length; i++) {
      cells[i] = cells[i]!.replace(/\n+$/, "")
    }

    let s = JoinHorizontal(Top, ...cells) + "\n"

    if (this.borderRow && !isOverflow && index < this.data.Rows() - 1) {
      if (this.borderLeft) {
        s += this.borderStyle.render(this.border.middleLeft || this.border.left)
      }
      for (let i = 0; i < this.widths.length; i++) {
        s += this.borderStyle.render(this.border.bottom.repeat(this.widths[i]!))
        if (i < this.widths.length - 1 && this.borderColumn) {
          s += this.borderStyle.render(this.border.middle || this.border.top)
        }
      }
      if (this.borderRight) {
        s += this.borderStyle.render(this.border.middleRight || this.border.right)
      }
      s += "\n"
    }

    return s
  }

  private truncateCell(cell: string, rowIndex: number, colIndex: number): string {
    const hasHeaders = this.headers.length > 0
    let height = this.heights[rowIndex + btoi(hasHeaders)]!
    const cellWidth = this.widths[colIndex]!
    const cellStyle = this.style(rowIndex, colIndex)

    if (rowIndex === HeaderRow) {
      height = 1
    }

    const length = (cellWidth * height) - cellStyle.getHorizontalPadding() - cellStyle.getHorizontalMargins()
    return Truncate(cell, length, "\u2026")
  }
}

/**
 * Create a new table.
 */
export function CreateTable(): Table {
  return Table.New()
}
