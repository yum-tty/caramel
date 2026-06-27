import { getStringWidth } from "./ansi"
import { Wrap } from "./wrap"

export function btoi(b: boolean): number { return b ? 1 : 0 }
function bton(b: boolean, n: number): number { return b ? n : 0 }
export function sum(n: number[]): number { return n.reduce((a, b) => a + b, 0) }
function median(n: number[]): number {
  const sorted = [...n].sort((a, b) => a - b)
  if (sorted.length <= 0) return 0
  if (sorted.length % 2 === 0) {
    const h = Math.floor(sorted.length / 2)
    return Math.floor((sorted[h - 1]! + sorted[h]!) / 2)
  }
  return sorted[Math.floor(sorted.length / 2)]!
}

export interface ResizerColumn {
  index: number
  min: number
  max: number
  median: number
  rows: string[][]
  xPadding: number
  fixedWidth: number
}

export interface ResizerResult {
  colWidths: number[]
  rowHeights: number[]
  firstVisibleRowIndex: number
  lastVisibleRowIndex: number
  overflowHeight: number
}

export class Resizer {
  tableWidth: number
  tableHeight: number
  headers: string[]
  allRows: string[][]
  rowHeights: number[] = []
  columns: ResizerColumn[] = []

  wrap = true
  borderColumn = true
  yPaddings: number[][] = []

  yOffset = 0
  useManualHeight = false
  borderTop = true
  borderBottom = true
  borderLeft = true
  borderRight = true
  borderHeader = true
  borderRow = false

  constructor(tableWidth: number, tableHeight: number, headers: string[], rows: string[][]) {
    this.tableWidth = tableWidth
    this.tableHeight = tableHeight
    this.headers = headers

    if (headers.length > 0) {
      this.allRows = [headers, ...rows]
    } else {
      this.allRows = rows
    }

    for (const row of this.allRows) {
      for (let i = 0; i < row.length; i++) {
        const cellLen = getStringWidth(row[i]!)
        if (this.columns.length <= i) {
          this.columns.push({
            index: i,
            min: cellLen,
            max: cellLen,
            median: cellLen,
            rows: [],
            xPadding: 0,
            fixedWidth: 0,
          })
          continue
        }
        this.columns[i]!.rows.push(row)
        this.columns[i]!.min = Math.min(this.columns[i]!.min, cellLen)
        this.columns[i]!.max = Math.max(this.columns[i]!.max, cellLen)
      }
    }
    for (let j = 0; j < this.columns.length; j++) {
      const widths = this.columns[j]!.rows.map(row => getStringWidth(row[j]!))
      this.columns[j]!.median = median(widths)
    }
  }

  optimizedWidths(): ResizerResult {
    let colWidths: number[]
    if (this.maxTotal() <= this.tableWidth) {
      colWidths = this.expandTableWidth()
    } else {
      colWidths = this.shrinkTableWidth()
    }
    const { first, last, overflow } = this.visibleRowIndexes()
    return {
      colWidths,
      rowHeights: this.rowHeights,
      firstVisibleRowIndex: first,
      lastVisibleRowIndex: last,
      overflowHeight: overflow,
    }
  }

  detectTableWidth(): number {
    return this.maxCharCount() + this.totalHorizontalPadding() + this.totalHorizontalBorder()
  }

  private maxColumnWidths(): number[] {
    return this.columns.map((col) => {
      if (col.fixedWidth > 0) return col.fixedWidth
      return col.max + this.xPaddingForCol(col.index)
    })
  }

  private expandTableWidth(): number[] {
    const colWidths = this.maxColumnWidths()

    while (true) {
      const totalWidth = sum(colWidths) + this.totalHorizontalBorder()
      if (totalWidth >= this.tableWidth) break

      let shorterColumnIndex = 0
      let shorterColumnWidth = Number.MAX_SAFE_INTEGER

      for (let j = 0; j < colWidths.length; j++) {
        if (colWidths[j] === this.columns[j]!.fixedWidth) continue
        if (colWidths[j]! < shorterColumnWidth) {
          shorterColumnWidth = colWidths[j]!
          shorterColumnIndex = j
        }
      }

      colWidths[shorterColumnIndex]!++
    }

    this.expandRowHeights(colWidths)
    return colWidths
  }

  private shrinkTableWidth(): number[] {
    const colWidths = this.maxColumnWidths()

    const shrinkBiggestColumns = (veryBigOnly: boolean) => {
      while (true) {
        const totalWidth = sum(colWidths) + this.totalHorizontalBorder()
        if (totalWidth <= this.tableWidth) break

        let bigColumnIndex = -1
        let bigColumnWidth = -1

        for (let j = 0; j < colWidths.length; j++) {
          if (colWidths[j] === this.columns[j]!.fixedWidth) continue
          if (veryBigOnly) {
            if (colWidths[j]! >= (this.tableWidth / 2) && colWidths[j]! > bigColumnWidth) {
              bigColumnWidth = colWidths[j]!
              bigColumnIndex = j
            }
          } else {
            if (colWidths[j]! > bigColumnWidth) {
              bigColumnWidth = colWidths[j]!
              bigColumnIndex = j
            }
          }
        }

        if (bigColumnIndex < 0 || colWidths[bigColumnIndex] === 0) break
        colWidths[bigColumnIndex]!--
      }
    }

    const shrinkToMedian = () => {
      while (true) {
        const totalWidth = sum(colWidths) + this.totalHorizontalBorder()
        if (totalWidth <= this.tableWidth) break

        let biggestDiffToMedian = -1
        let biggestDiffToMedianIndex = -1

        for (let j = 0; j < colWidths.length; j++) {
          if (colWidths[j] === this.columns[j]!.fixedWidth) continue
          const diffToMedian = colWidths[j]! - this.columns[j]!.median
          if (diffToMedian > 0 && diffToMedian > biggestDiffToMedian) {
            biggestDiffToMedian = diffToMedian
            biggestDiffToMedianIndex = j
          }
        }

        if (biggestDiffToMedianIndex <= 0 || colWidths[biggestDiffToMedianIndex] === 0) break
        colWidths[biggestDiffToMedianIndex]!--
      }
    }

    shrinkBiggestColumns(true)
    shrinkToMedian()
    shrinkBiggestColumns(false)

    this.expandRowHeights(colWidths)
    return colWidths
  }

  private expandRowHeights(colWidths: number[]): void {
    this.rowHeights = this.defaultRowHeights()
    if (!this.wrap) return
    const hasHeaders = this.headers.length > 0

    for (let i = 0; i < this.allRows.length; i++) {
      for (let j = 0; j < this.allRows[i]!.length; j++) {
        if (hasHeaders && i === 0) {
          this.rowHeights[i] = 1 + this.yPaddingForCell(i, j)
          continue
        }
        const cell = this.allRows[i]![j]!
        const height = this.detectContentHeight(cell, colWidths[j]! - this.xPaddingForCol(j)) + this.yPaddingForCell(i, j)
        this.rowHeights[i] = Math.max(this.rowHeights[i]!, height)
      }
    }
  }

  defaultRowHeights(): number[] {
    const rowHeights = new Array(this.allRows.length).fill(0)
    for (let i = 0; i < rowHeights.length; i++) {
      if (i < this.rowHeights.length) {
        rowHeights[i] = this.rowHeights[i]!
      }
      rowHeights[i] = Math.max(rowHeights[i], 1)
    }
    return rowHeights
  }

  private maxCharCount(): number {
    let count = 0
    for (const col of this.columns) {
      if (col.fixedWidth > 0) {
        count += col.fixedWidth - this.xPaddingForCol(col.index)
      } else {
        count += col.max
      }
    }
    return count
  }

  private maxTotal(): number {
    let maxTotal = 0
    for (let j = 0; j < this.columns.length; j++) {
      const column = this.columns[j]!
      if (column.fixedWidth > 0) {
        maxTotal += column.fixedWidth
      } else {
        maxTotal += column.max + this.xPaddingForCol(j)
      }
    }
    return maxTotal
  }

  private totalHorizontalPadding(): number {
    let total = 0
    for (const col of this.columns) {
      total += col.xPadding
    }
    return total
  }

  private xPaddingForCol(j: number): number {
    if (j >= this.columns.length) return 0
    return this.columns[j]!.xPadding
  }

  private yPaddingForCell(i: number, j: number): number {
    if (i >= this.yPaddings.length || j >= this.yPaddings[i]!.length) return 0
    return this.yPaddings[i]![j]!
  }

  private totalHorizontalBorder(): number {
    return btoi(this.borderLeft) + btoi(this.borderRight) + (this.columns.length - 1) * btoi(this.borderColumn)
  }

  private detectContentHeight(content: string, width: number): number {
    if (width === 0) return 1
    content = content.replace(/\r\n/g, "\n")
    let height = 0
    for (const line of content.split("\n")) {
      height += (Wrap(line, width, "").match(/\n/g) || []).length + 1
    }
    return height
  }

  private visibleRowIndexes(): { first: number; last: number; overflow: number } {
    if (!this.useManualHeight) {
      return { first: 0, last: -2, overflow: 0 }
    }

    const hasHeaders = this.headers.length > 0
    const lastIndex = this.allRows.length - 1 - btoi(hasHeaders)

    let available = this.tableHeight - btoi(this.borderTop) -
      btoi(this.borderBottom) -
      bton(hasHeaders, this.rowHeights[0]!) -
      btoi(hasHeaders && this.borderHeader)

    available += btoi(this.borderRow)

    let firstVisibleRowIndex = this.yOffset
    let lastVisibleRowIndex = firstVisibleRowIndex - 1

    while (available > 0 && lastVisibleRowIndex < lastIndex) {
      const row = this.rowHeights[lastVisibleRowIndex + 1 + btoi(hasHeaders)]! + btoi(this.borderRow)
      const overflow = bton(lastVisibleRowIndex + 1 < lastIndex, 1 + btoi(this.borderRow) + this.yPaddingForCell(lastVisibleRowIndex + 2, 0))

      if (available - row - overflow < 0) break

      lastVisibleRowIndex++
      available -= row
    }

    if (lastVisibleRowIndex === lastIndex) {
      while (available > 0 && firstVisibleRowIndex > 0) {
        const row = this.rowHeights[firstVisibleRowIndex - 1 + btoi(hasHeaders)]! + btoi(this.borderRow)

        if (available - row < 0) break

        firstVisibleRowIndex--
        available -= row
      }
    }

    if (lastVisibleRowIndex >= lastIndex) {
      return { first: firstVisibleRowIndex, last: -2, overflow: 0 }
    }

    const overflow = 1 + this.yPaddingForCell(lastVisibleRowIndex + 1, 0)
    return { first: firstVisibleRowIndex, last: lastVisibleRowIndex, overflow }
  }
}
