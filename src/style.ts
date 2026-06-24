// style.ts | Style class (lipgloss port)

import {
  type Color,
  fg,
  bg,
  reset,
  bold,
  dim,
  italic,
  underline,
  blink,
  reverse,
  strikethrough,
} from "./color"
import { type BorderStyle, borders, type BorderType } from "./border"

/**
 * Position for alignment.
 */
export type Position = "left" | "center" | "right"

/**
 * Underline styles.
 */
export type UnderlineStyle = "none" | "single" | "double" | "curly" | "dotted" | "dashed"

/**
 * Style contains a set of rules for styling text.
 */
export class Style {
  // Boolean props (stored as bitmask)
  private attrs: number = 0

  // Colors
  private fgColor: Color = null
  private bgColor: Color = null
  private ulColor: Color = null

  // Underline style
  private ul: UnderlineStyle = "none"

  // Dimensions
  private width: number = 0
  private height: number = 0

  // Alignment
  private alignH: Position = "left"
  private alignV: Position = "left"

  // Padding
  private paddingTop: number = 0
  private paddingRight: number = 0
  private paddingBottom: number = 0
  private paddingLeft: number = 0
  private paddingChar: string = " "

  // Margins
  private marginTop: number = 0
  private marginRight: number = 0
  private marginBottom: number = 0
  private marginLeft: number = 0
  private marginBg: Color = null
  private marginChar: string = " "

  // Border
  private border: BorderStyle | null = null
  private borderColor: Color = null

  // Max dimensions
  private maxWidth: number = 0
  private maxHeight: number = 0

  // Inline mode
  private inline: boolean = false

  // Transform function
  private transformFn: ((s: string) => string) | null = null

  // Bitmask keys
  private static readonly BOLD = 1 << 0
  private static readonly ITALIC = 1 << 1
  private static readonly STRIKETHROUGH = 1 << 2
  private static readonly REVERSE = 1 << 3
  private static readonly BLINK = 1 << 4
  private static readonly DIM = 1 << 5

  /**
   * Create a new empty style.
   */
  static newStyle(): Style {
    return new Style()
  }

  /**
   * Bold sets bold formatting.
   */
  bold(v: boolean): Style {
    const s = this.clone()
    if (v) s.attrs |= Style.BOLD
    else s.attrs &= ~Style.BOLD
    return s
  }

  /**
   * Italic sets italic formatting.
   */
  italic(v: boolean): Style {
    const s = this.clone()
    if (v) s.attrs |= Style.ITALIC
    else s.attrs &= ~Style.ITALIC
    return s
  }

  /**
   * Strikethrough sets strikethrough formatting.
   */
  strikethrough(v: boolean): Style {
    const s = this.clone()
    if (v) s.attrs |= Style.STRIKETHROUGH
    else s.attrs &= ~Style.STRIKETHROUGH
    return s
  }

  /**
   * Reverse sets reverse (invert) formatting.
   */
  reverse(v: boolean): Style {
    const s = this.clone()
    if (v) s.attrs |= Style.REVERSE
    else s.attrs &= ~Style.REVERSE
    return s
  }

  /**
   * Blink sets blink formatting.
   */
  blink(v: boolean): Style {
    const s = this.clone()
    if (v) s.attrs |= Style.BLINK
    else s.attrs &= ~Style.BLINK
    return s
  }

  /**
   * Faint sets dim/faint formatting.
   */
  faint(v: boolean): Style {
    const s = this.clone()
    if (v) s.attrs |= Style.DIM
    else s.attrs &= ~Style.DIM
    return s
  }

  /**
   * Foreground sets the foreground color.
   */
  foreground(c: Color): Style {
    const s = this.clone()
    s.fgColor = c
    return s
  }

  /**
   * Background sets the background color.
   */
  background(c: Color): Style {
    const s = this.clone()
    s.bgColor = c
    return s
  }

  /**
   * Width sets the width of the block.
   */
  width(i: number): Style {
    const s = this.clone()
    s.width = Math.max(0, i)
    return s
  }

  /**
   * Height sets the height of the block.
   */
  height(i: number): Style {
    const s = this.clone()
    s.height = Math.max(0, i)
    return s
  }

  /**
   * Align sets horizontal and vertical alignment.
   */
  align(horizontal: Position, vertical?: Position): Style {
    const s = this.clone()
    s.alignH = horizontal
    if (vertical) s.alignV = vertical
    return s
  }

  /**
   * Padding sets padding on all sides.
   */
  padding(args: number[]): Style {
    const s = this.clone()
    if (args.length === 1) {
      s.paddingTop = s.paddingRight = s.paddingBottom = s.paddingLeft = args[0]!
    } else if (args.length === 2) {
      s.paddingTop = s.paddingBottom = args[0]!
      s.paddingRight = s.paddingLeft = args[1]!
    } else if (args.length === 3) {
      s.paddingTop = args[0]!
      s.paddingRight = s.paddingLeft = args[1]!
      s.paddingBottom = args[2]!
    } else if (args.length >= 4) {
      s.paddingTop = args[0]!
      s.paddingRight = args[1]!
      s.paddingBottom = args[2]!
      s.paddingLeft = args[3]!
    }
    return s
  }

  /**
   * PaddingTop sets top padding.
   */
  paddingTop(i: number): Style {
    const s = this.clone()
    s.paddingTop = Math.max(0, i)
    return s
  }

  /**
   * PaddingRight sets right padding.
   */
  paddingRight(i: number): Style {
    const s = this.clone()
    s.paddingRight = Math.max(0, i)
    return s
  }

  /**
   * PaddingBottom sets bottom padding.
   */
  paddingBottom(i: number): Style {
    const s = this.clone()
    s.paddingBottom = Math.max(0, i)
    return s
  }

  /**
   * PaddingLeft sets left padding.
   */
  paddingLeft(i: number): Style {
    const s = this.clone()
    s.paddingLeft = Math.max(0, i)
    return s
  }

  /**
   * PaddingChar sets the padding character.
   */
  paddingChar(c: string): Style {
    const s = this.clone()
    s.paddingChar = c
    return s
  }

  /**
   * Margin sets margin on all sides.
   */
  margin(args: number[]): Style {
    const s = this.clone()
    if (args.length === 1) {
      s.marginTop = s.marginRight = s.marginBottom = s.marginLeft = args[0]!
    } else if (args.length === 2) {
      s.marginTop = s.marginBottom = args[0]!
      s.marginRight = s.marginLeft = args[1]!
    } else if (args.length === 3) {
      s.marginTop = args[0]!
      s.marginRight = s.marginLeft = args[1]!
      s.marginBottom = args[2]!
    } else if (args.length >= 4) {
      s.marginTop = args[0]!
      s.marginRight = args[1]!
      s.marginBottom = args[2]!
      s.marginLeft = args[3]!
    }
    return s
  }

  /**
   * MarginTop sets top margin.
   */
  marginTop(i: number): Style {
    const s = this.clone()
    s.marginTop = Math.max(0, i)
    return s
  }

  /**
   * MarginRight sets right margin.
   */
  marginRight(i: number): Style {
    const s = this.clone()
    s.marginRight = Math.max(0, i)
    return s
  }

  /**
   * MarginBottom sets bottom margin.
   */
  marginBottom(i: number): Style {
    const s = this.clone()
    s.marginBottom = Math.max(0, i)
    return s
  }

  /**
   * MarginLeft sets left margin.
   */
  marginLeft(i: number): Style {
    const s = this.clone()
    s.marginLeft = Math.max(0, i)
    return s
  }

  /**
   * Border sets the border style.
   */
  border(t: BorderType | BorderStyle | null): Style {
    const s = this.clone()
    if (typeof t === "string") {
      s.border = borders[t] ?? null
    } else {
      s.border = t
    }
    return s
  }

  /**
   * BorderForeground sets the border foreground color.
   */
  borderForeground(c: Color): Style {
    const s = this.clone()
    s.borderColor = c
    return s
  }

  /**
   * Inline sets inline mode (single line, no wrapping).
   */
  inline(v: boolean): Style {
    const s = this.clone()
    s.inline = v
    return s
  }

  /**
   * MaxWidth sets maximum width.
   */
  maxWidth(i: number): Style {
    const s = this.clone()
    s.maxWidth = Math.max(0, i)
    return s
  }

  /**
   * MaxHeight sets maximum height.
   */
  maxHeight(i: number): Style {
    const s = this.clone()
    s.maxHeight = Math.max(0, i)
    return s
  }

  /**
   * Transform sets a transform function.
   */
  transform(fn: (s: string) => string): Style {
    const s = this.clone()
    s.transformFn = fn
    return s
  }

  /**
   * Render applies the style to text.
   */
  render(...strs: string[]): string {
    let str = strs.join(" ")

    // Apply transform
    if (this.transformFn) {
      str = this.transformFn(str)
    }

    // Build ANSI escape codes
    const attrs: string[] = []

    if (this.attrs & Style.BOLD) attrs.push(bold)
    if (this.attrs & Style.DIM) attrs.push(dim)
    if (this.attrs & Style.ITALIC) attrs.push(italic)
    if (this.attrs & Style.REVERSE) attrs.push(reverse)
    if (this.attrs & Style.BLINK) attrs.push(blink)
    if (this.attrs & Style.STRIKETHROUGH) attrs.push(strikethrough)

    if (this.fgColor !== null) attrs.push(fg(this.fgColor))
    if (this.bgColor !== null) attrs.push(bg(this.bgColor))

    // Wrap text with styles
    if (attrs.length > 0) {
      str = attrs.join("") + str + reset
    }

    // Word wrap if width is set and not inline
    if (this.width > 0 && !this.inline) {
      const wrapWidth = this.width - this.paddingLeft - this.paddingRight
      str = wordWrap(str, wrapWidth)
    }

    // Apply padding
    str = this.applyPadding(str)

    // Apply border
    str = this.applyBorder(str)

    // Apply width/height
    if (this.width > 0) {
      str = constrainWidth(str, this.width)
    }
    if (this.height > 0) {
      str = constrainHeight(str, this.height)
    }

    // Apply alignment
    if (this.alignH !== "left" && this.width > 0) {
      str = alignText(str, this.alignH, this.width)
    }

    // Apply margins
    str = this.applyMargins(str)

    // Truncate
    if (this.maxWidth > 0) {
      str = truncateWidth(str, this.maxWidth)
    }
    if (this.maxHeight > 0) {
      str = truncateHeight(str, this.maxHeight)
    }

    return str
  }

  /**
   * Get the visible width of styled text.
   */
  static width(str: string): number {
    return stripAnsi(str).length
  }

  /**
   * Get the visible height of styled text.
   */
  static height(str: string): number {
    return str.split("\n").length
  }

  // Getters

  getBold(): boolean { return (this.attrs & Style.BOLD) !== 0 }
  getItalic(): boolean { return (this.attrs & Style.ITALIC) !== 0 }
  getUnderline(): boolean { return this.ul !== "none" }
  getUnderlineStyle(): UnderlineStyle { return this.ul }
  getUnderlineColor(): Color { return this.ulColor }
  getStrikethrough(): boolean { return (this.attrs & Style.STRIKETHROUGH) !== 0 }
  getReverse(): boolean { return (this.attrs & Style.REVERSE) !== 0 }
  getBlink(): boolean { return (this.attrs & Style.BLINK) !== 0 }
  getFaint(): boolean { return (this.attrs & Style.DIM) !== 0 }
  getForeground(): Color { return this.fgColor }
  getBackground(): Color { return this.bgColor }
  getWidth(): number { return this.width }
  getHeight(): number { return this.height }
  getAlign(): Position { return this.alignH }
  getAlignHorizontal(): Position { return this.alignH }
  getAlignVertical(): Position { return this.alignV }
  getPadding(): [number, number, number, number] {
    return [this.paddingTop, this.paddingRight, this.paddingBottom, this.paddingLeft]
  }
  getPaddingTop(): number { return this.paddingTop }
  getPaddingRight(): number { return this.paddingRight }
  getPaddingBottom(): number { return this.paddingBottom }
  getPaddingLeft(): number { return this.paddingLeft }
  getPaddingChar(): string { return this.paddingChar }
  getHorizontalPadding(): number { return this.paddingLeft + this.paddingRight }
  getVerticalPadding(): number { return this.paddingTop + this.paddingBottom }
  getMargin(): [number, number, number, number] {
    return [this.marginTop, this.marginRight, this.marginBottom, this.marginLeft]
  }
  getMarginTop(): number { return this.marginTop }
  getMarginRight(): number { return this.marginRight }
  getMarginBottom(): number { return this.marginBottom }
  getMarginLeft(): number { return this.marginLeft }
  getBorderStyle(): BorderStyle | null { return this.border }
  getMaxWidth(): number { return this.maxWidth }
  getMaxHeight(): number { return this.maxHeight }
  getInline(): boolean { return this.inline }
  getTransform(): ((s: string) => string) | null { return this.transformFn }

  // Unsetters

  unsetBold(): Style { const s = this.clone(); s.attrs &= ~Style.BOLD; return s }
  unsetItalic(): Style { const s = this.clone(); s.attrs &= ~Style.ITALIC; return s }
  unsetUnderline(): Style { const s = this.clone(); s.ul = "none"; return s }
  unsetStrikethrough(): Style { const s = this.clone(); s.attrs &= ~Style.STRIKETHROUGH; return s }
  unsetReverse(): Style { const s = this.clone(); s.attrs &= ~Style.REVERSE; return s }
  unsetBlink(): Style { const s = this.clone(); s.attrs &= ~Style.BLINK; return s }
  unsetFaint(): Style { const s = this.clone(); s.attrs &= ~Style.DIM; return s }
  unsetForeground(): Style { const s = this.clone(); s.fgColor = null; return s }
  unsetBackground(): Style { const s = this.clone(); s.bgColor = null; return s }
  unsetWidth(): Style { const s = this.clone(); s.width = 0; return s }
  unsetHeight(): Style { const s = this.clone(); s.height = 0; return s }
  unsetAlign(): Style { const s = this.clone(); s.alignH = "left"; s.alignV = "left"; return s }
  unsetPadding(): Style {
    const s = this.clone()
    s.paddingTop = s.paddingRight = s.paddingBottom = s.paddingLeft = 0
    return s
  }
  unsetMargins(): Style {
    const s = this.clone()
    s.marginTop = s.marginRight = s.marginBottom = s.marginLeft = 0
    return s
  }
  unsetBorderStyle(): Style { const s = this.clone(); s.border = null; return s }
  unsetMaxWidth(): Style { const s = this.clone(); s.maxWidth = 0; return s }
  unsetMaxHeight(): Style { const s = this.clone(); s.maxHeight = 0; return s }
  unsetInline(): Style { const s = this.clone(); s.inline = false; return s }
  unsetTransform(): Style { const s = this.clone(); s.transformFn = null; return s }

  private clone(): Style {
    const s = new Style()
    s.attrs = this.attrs
    s.fgColor = this.fgColor
    s.bgColor = this.bgColor
    s.ulColor = this.ulColor
    s.ul = this.ul
    s.width = this.width
    s.height = this.height
    s.alignH = this.alignH
    s.alignV = this.alignV
    s.paddingTop = this.paddingTop
    s.paddingRight = this.paddingRight
    s.paddingBottom = this.paddingBottom
    s.paddingLeft = this.paddingLeft
    s.paddingChar = this.paddingChar
    s.marginTop = this.marginTop
    s.marginRight = this.marginRight
    s.marginBottom = this.marginBottom
    s.marginLeft = this.marginLeft
    s.marginBg = this.marginBg
    s.marginChar = this.marginChar
    s.border = this.border
    s.borderColor = this.borderColor
    s.maxWidth = this.maxWidth
    s.maxHeight = this.maxHeight
    s.inline = this.inline
    s.transformFn = this.transformFn
    return s
  }

  private applyPadding(str: string): string {
    if (!this.paddingTop && !this.paddingRight && !this.paddingBottom && !this.paddingLeft) {
      return str
    }

    const lines = str.split("\n")
    const padLeft = this.paddingChar.repeat(this.paddingLeft)
    const padRight = this.paddingChar.repeat(this.paddingRight)

    const padded = lines.map((line) => padLeft + line + padRight)

    const topPad = Array(this.paddingTop).fill("").join("\n")
    const bottomPad = Array(this.paddingBottom).fill("").join("\n")

    return [topPad, padded.join("\n"), bottomPad].filter(Boolean).join("\n")
  }

  private applyMargins(str: string): string {
    if (!this.marginTop && !this.marginRight && !this.marginBottom && !this.marginLeft) {
      return str
    }

    const lines = str.split("\n")
    const padLeft = this.marginChar.repeat(this.marginLeft)
    const padRight = this.marginChar.repeat(this.marginRight)

    const margined = lines.map((line) => padLeft + line + padRight)

    const topPad = Array(this.marginTop).fill("").join("\n")
    const bottomPad = Array(this.marginBottom).fill("").join("\n")

    return [topPad, margined.join("\n"), bottomPad].filter(Boolean).join("\n")
  }

  private applyBorder(str: string): string {
    if (!this.border) return str

    const lines = str.split("\n")
    const maxW = Math.max(...lines.map((l) => stripAnsi(l).length))

    const padded = lines.map((line) => {
      const vis = stripAnsi(line).length
      const pad = " ".repeat(maxW - vis)
      return line + pad
    })

    const top = this.border.topLeft + this.border.top.repeat(maxW) + this.border.topRight
    const bottom = this.border.bottomLeft + this.border.bottom.repeat(maxW) + this.border.bottomRight
    const middle = padded.map((line) => this.border!.left + line + this.border!.right)

    return [top, ...middle, bottom].join("\n")
  }
}

// Helper functions
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "")
}

function visibleLength(str: string): number {
  return stripAnsi(str).length
}

function wordWrap(str: string, maxWidth: number): string {
  const lines = str.split("\n")
  const result: string[] = []

  for (const line of lines) {
    if (visibleLength(line) <= maxWidth) {
      result.push(line)
      continue
    }

    const words = line.split(" ")
    let currentLine = ""

    for (const word of words) {
      if (currentLine && visibleLength(currentLine + " " + word) > maxWidth) {
        result.push(currentLine)
        currentLine = word
      } else {
        currentLine = currentLine ? currentLine + " " + word : word
      }
    }

    if (currentLine) result.push(currentLine)
  }

  return result.join("\n")
}

function constrainWidth(str: string, width: number): string {
  const lines = str.split("\n")
  return lines
    .map((line) => {
      const vis = visibleLength(line)
      if (vis < width) return line + " ".repeat(width - vis)
      return line
    })
    .join("\n")
}

function constrainHeight(str: string, height: number): string {
  const lines = str.split("\n")
  if (lines.length < height) {
    return [...lines, ...Array(height - lines.length).fill("")].join("\n")
  }
  return lines.slice(0, height).join("\n")
}

function alignText(str: string, align: Position, width: number): string {
  const lines = str.split("\n")
  return lines
    .map((line) => {
      const vis = visibleLength(line)
      if (vis >= width) return line

      const padding = width - vis
      if (align === "center") {
        const left = Math.floor(padding / 2)
        const right = padding - left
        return " ".repeat(left) + line + " ".repeat(right)
      }
      if (align === "right") {
        return " ".repeat(padding) + line
      }
      return line + " ".repeat(padding)
    })
    .join("\n")
}

function truncateWidth(str: string, maxWidth: number): string {
  const lines = str.split("\n")
  return lines
    .map((line) => {
      if (visibleLength(line) <= maxWidth) return line
      let result = ""
      let count = 0
      for (const char of line) {
        if (char === "\x1b") {
          result += char
          continue
        }
        if (count >= maxWidth - 1) {
          result += "…"
          break
        }
        result += char
        count++
      }
      return result
    })
    .join("\n")
}

function truncateHeight(str: string, maxHeight: number): string {
  return str.split("\n").slice(0, maxHeight).join("\n")
}

// Shorthand
export function NewStyle(): Style {
  return Style.newStyle()
}
