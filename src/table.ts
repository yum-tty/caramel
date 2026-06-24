// table.ts | table component (lipgloss port)

import { Style } from "./style"
import { borders, type BorderStyle } from "./border"
import { getStringWidth } from "./ansi"

/**
 * Table is a component for rendering tables.
 */
export class Table {
  private headers: string[] = []
  private rows: string[][] = []
  private widths: number[] = []
  private border: BorderStyle | null = null
  private borderStyle: Style = Style.newStyle()
  private headerStyle: Style = Style.newStyle().bold(true)
  private cellStyle: Style = Style.newStyle()
  private width: number = 0
  private height: number = 0

  /**
   * Set the table headers.
   */
  setHeaders(headers: string[]): Table {
    this.headers = headers
    this.calculateWidths()
    return this
  }

  /**
   * Set headers (Go-compatible: variadic string args).
   */
  Headers(...headers: string[]): Table {
    this.headers = headers
    this.calculateWidths()
    return this
  }

  /**
   * Set the table rows.
   */
  setRows(rows: string[][]): Table {
    this.rows = rows
    this.calculateWidths()
    return this
  }

  /**
   * Set rows (Go-compatible: variadic string array args).
   */
  Rows(...rows: string[][]): Table {
    this.rows = rows
    this.calculateWidths()
    return this
  }

  /**
   * Add a row to the table.
   */
  addRow(row: string[]): Table {
    this.rows.push(row)
    this.calculateWidths()
    return this
  }

  /**
   * Add a row (Go-compatible: variadic string args).
   */
  Row(...row: string[]): Table {
    this.rows.push(row)
    this.calculateWidths()
    return this
  }

  /**
   * Clear all rows.
   */
  ClearRows(): Table {
    this.rows = []
    this.calculateWidths()
    return this
  }

  /**
   * Set the border style.
   */
  setBorder(border: BorderStyle | null): Table {
    this.border = border
    return this
  }

  /**
   * Set the border style.
   */
  setBorderStyle(style: Style): Table {
    this.borderStyle = style
    return this
  }

  /**
   * Set the header style.
   */
  setHeaderStyle(style: Style): Table {
    this.headerStyle = style
    return this
  }

  /**
   * Set the cell style.
   */
  setCellStyle(style: Style): Table {
    this.cellStyle = style
    return this
  }

  /**
   * Set the table width.
   */
  setWidth(width: number): Table {
    this.width = width
    return this
  }

  /**
   * Set the table height.
   */
  setHeight(height: number): Table {
    this.height = height
    return this
  }

  /**
   * Render the table.
   */
  render(): string {
    const lines: string[] = []

    // Calculate column widths
    const allRows = [this.headers, ...this.rows]
    const colCount = Math.max(...allRows.map((r) => r.length))
    const colWidths: number[] = new Array(colCount).fill(0)

    for (const row of allRows) {
      for (let i = 0; i < row.length; i++) {
        const cellWidth = getStringWidth(row[i] || "")
        if (cellWidth > colWidths[i]!) {
          colWidths[i] = cellWidth
        }
      }
    }

    // Render header
    if (this.headers.length > 0) {
      const headerLine = this.headers
        .map((cell, i) => {
          const padding = colWidths[i]! - getStringWidth(cell)
          return this.headerStyle.render(cell + " ".repeat(padding))
        })
        .join(this.border ? this.border.left : " │ ")

      lines.push(headerLine)

      if (this.border) {
        const separator = this.border.topLeft
          + this.border.top.repeat(colWidths.reduce((a, b) => a + b + 3, -1))
          + this.border.topRight
        lines.push(this.borderStyle.render(separator))
      }
    }

    // Render rows
    for (const row of this.rows) {
      const rowLine = row
        .map((cell, i) => {
          const padding = (colWidths[i] || 0) - getStringWidth(cell)
          return this.cellStyle.render(cell + " ".repeat(Math.max(0, padding)))
        })
        .join(this.border ? this.border.left : " │ ")

      lines.push(rowLine)
    }

    return lines.join("\n")
  }

  private calculateWidths(): void {
    const allRows = [this.headers, ...this.rows]
    this.widths = []

    for (let i = 0; i < (this.headers.length || 0); i++) {
      let maxWidth = 0
      for (const row of allRows) {
        const cellWidth = getStringWidth(row[i] || "")
        if (cellWidth > maxWidth) maxWidth = cellWidth
      }
      this.widths.push(maxWidth)
    }
  }

  /**
   * Render the table (Go-compatible alias).
   */
  Render(): string {
    return this.render()
  }

  /**
   * Get headers (Go-compatible).
   */
  GetHeaders(): string[] {
    return this.headers
  }

  /**
   * Get data as matrix (Go-compatible).
   */
  GetData(): string[][] {
    return this.rows
  }

  /**
   * Set width (Go-compatible alias).
   */
  Width(w: number): Table {
    this.width = w
    return this
  }

  /**
   * Set height (Go-compatible alias).
   */
  Height(h: number): Table {
    this.height = h
    return this
  }

  /**
   * Set word wrap (Go-compatible).
   */
  Wrap(v: boolean): Table {
    // TODO: implement word wrap
    return this
  }

  /**
   * Set Y offset for scrolling (Go-compatible).
   */
  YOffset(y: number): Table {
    // TODO: implement scroll offset
    return this
  }

  /**
   * Toggle header separator border (Go-compatible).
   */
  BorderHeader(v: boolean): Table {
    // TODO: implement header border toggle
    return this
  }

  /**
   * Toggle column separator border (Go-compatible).
   */
  BorderColumn(v: boolean): Table {
    // TODO: implement column border toggle
    return this
  }

  /**
   * Toggle row separator border (Go-compatible).
   */
  BorderRow(v: boolean): Table {
    // TODO: implement row border toggle
    return this
  }
}

/**
 * Create a new table.
 */
export function CreateTable(): Table {
  return new Table()
}
