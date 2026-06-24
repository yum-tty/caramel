import {
  type Color,
  NoColor,
  fg,
  bg,
  ulColor as ulColorFn,
  reset,
  bold,
  dim,
  italic,
  underline,
  blink,
  reverse,
  strikethrough,
  colorToAnsi,
} from "./color"
import { type BorderStyle, borders, type BorderType, getTopSize, getRightSize, getBottomSize, getLeftSize } from "./border"
import { type Position } from "./position"
import { getStringWidth, stripAnsi } from "./ansi"
import { Blend1D } from "./blending"

export type TextAlign = "left" | "center" | "right"

export type UnderlineStyle = "none" | "single" | "double" | "curly" | "dotted" | "dashed"

export const NBSP = "\u00A0"
export const NoTabConversion = -1

const DEFAULT_TAB_WIDTH = 4

export class Style {
  private _attrs: number = 0

  private _fgColor: Color = null
  private _bgColor: Color = null
  private _ulColor: Color = null
  private _ul: UnderlineStyle = "none"

  private _value: string = ""
  private _link: string = ""
  private _linkParams: string = ""

  private _width: number = 0
  private _height: number = 0

  private _alignH: TextAlign = "left"
  private _alignV: TextAlign = "left"

  private _paddingTop: number = 0
  private _paddingRight: number = 0
  private _paddingBottom: number = 0
  private _paddingLeft: number = 0
  private _paddingChar: string = " "

  private _marginTop: number = 0
  private _marginRight: number = 0
  private _marginBottom: number = 0
  private _marginLeft: number = 0
  private _marginBg: Color = null
  private _marginChar: string = " "

  private _borderStyle: BorderStyle | null = null
  private _borderTopEnabled: boolean = false
  private _borderRightEnabled: boolean = false
  private _borderBottomEnabled: boolean = false
  private _borderLeftEnabled: boolean = false
  private _borderSidesSet: boolean = false

  private _borderTopFgColor: Color = null
  private _borderRightFgColor: Color = null
  private _borderBottomFgColor: Color = null
  private _borderLeftFgColor: Color = null
  private _borderTopBgColor: Color = null
  private _borderRightBgColor: Color = null
  private _borderBottomBgColor: Color = null
  private _borderLeftBgColor: Color = null
  private _borderBlendFgColors: Color[] | null = null
  private _borderForegroundBlendOffset: number = 0

  private _maxWidth: number = 0
  private _maxHeight: number = 0
  private _tabWidth: number = DEFAULT_TAB_WIDTH
  private _inline: boolean = false

  private _underlineSpaces: boolean = false
  private _strikethroughSpaces: boolean = false

  private _transformFn: ((s: string) => string) | null = null

  private static readonly BOLD = 1 << 0
  private static readonly ITALIC = 1 << 1
  private static readonly STRIKETHROUGH = 1 << 2
  private static readonly REVERSE = 1 << 3
  private static readonly BLINK = 1 << 4
  private static readonly DIM = 1 << 5

  static newStyle(): Style {
    return new Style()
  }

  bold(v: boolean): Style {
    const s = this.clone()
    if (v) s._attrs |= Style.BOLD
    else s._attrs &= ~Style.BOLD
    return s
  }

  italic(v: boolean): Style {
    const s = this.clone()
    if (v) s._attrs |= Style.ITALIC
    else s._attrs &= ~Style.ITALIC
    return s
  }

  underline(v: boolean): Style {
    return this.underlineStyle(v ? "single" : "none")
  }

  underlineStyle(u: UnderlineStyle): Style {
    const s = this.clone()
    s._ul = u
    return s
  }

  underlineColor(c: Color): Style {
    const s = this.clone()
    s._ulColor = c
    return s
  }

  strikethrough(v: boolean): Style {
    const s = this.clone()
    if (v) s._attrs |= Style.STRIKETHROUGH
    else s._attrs &= ~Style.STRIKETHROUGH
    return s
  }

  reverse(v: boolean): Style {
    const s = this.clone()
    if (v) s._attrs |= Style.REVERSE
    else s._attrs &= ~Style.REVERSE
    return s
  }

  blink(v: boolean): Style {
    const s = this.clone()
    if (v) s._attrs |= Style.BLINK
    else s._attrs &= ~Style.BLINK
    return s
  }

  faint(v: boolean): Style {
    const s = this.clone()
    if (v) s._attrs |= Style.DIM
    else s._attrs &= ~Style.DIM
    return s
  }

  dim(v: boolean): Style {
    return this.faint(v)
  }

  foreground(c: Color): Style {
    const s = this.clone()
    s._fgColor = c
    return s
  }

  background(c: Color): Style {
    const s = this.clone()
    s._bgColor = c
    return s
  }

  width(i: number): Style {
    const s = this.clone()
    s._width = Math.max(0, i)
    return s
  }

  height(i: number): Style {
    const s = this.clone()
    s._height = Math.max(0, i)
    return s
  }

  align(...p: TextAlign[]): Style {
    const s = this.clone()
    if (p.length > 0) s._alignH = p[0]!
    if (p.length > 1) s._alignV = p[1]!
    return s
  }

  alignHorizontal(p: TextAlign): Style {
    const s = this.clone()
    s._alignH = p
    return s
  }

  alignVertical(p: TextAlign): Style {
    const s = this.clone()
    s._alignV = p
    return s
  }

  padding(...args: number[]): Style {
    const s = this.clone()
    if (args.length === 1) {
      s._paddingTop = s._paddingRight = s._paddingBottom = s._paddingLeft = args[0]!
    } else if (args.length === 2) {
      s._paddingTop = s._paddingBottom = args[0]!
      s._paddingRight = s._paddingLeft = args[1]!
    } else if (args.length === 3) {
      s._paddingTop = args[0]!
      s._paddingRight = s._paddingLeft = args[1]!
      s._paddingBottom = args[2]!
    } else if (args.length >= 4) {
      s._paddingTop = args[0]!
      s._paddingRight = args[1]!
      s._paddingBottom = args[2]!
      s._paddingLeft = args[3]!
    }
    return s
  }

  paddingTop(i: number): Style { const s = this.clone(); s._paddingTop = Math.max(0, i); return s }
  paddingRight(i: number): Style { const s = this.clone(); s._paddingRight = Math.max(0, i); return s }
  paddingBottom(i: number): Style { const s = this.clone(); s._paddingBottom = Math.max(0, i); return s }
  paddingLeft(i: number): Style { const s = this.clone(); s._paddingLeft = Math.max(0, i); return s }

  paddingChar(c: string): Style {
    const s = this.clone()
    s._paddingChar = c
    return s
  }

  margin(...args: number[]): Style {
    const s = this.clone()
    if (args.length === 1) {
      s._marginTop = s._marginRight = s._marginBottom = s._marginLeft = args[0]!
    } else if (args.length === 2) {
      s._marginTop = s._marginBottom = args[0]!
      s._marginRight = s._marginLeft = args[1]!
    } else if (args.length === 3) {
      s._marginTop = args[0]!
      s._marginRight = s._marginLeft = args[1]!
      s._marginBottom = args[2]!
    } else if (args.length >= 4) {
      s._marginTop = args[0]!
      s._marginRight = args[1]!
      s._marginBottom = args[2]!
      s._marginLeft = args[3]!
    }
    return s
  }

  marginTop(i: number): Style { const s = this.clone(); s._marginTop = Math.max(0, i); return s }
  marginRight(i: number): Style { const s = this.clone(); s._marginRight = Math.max(0, i); return s }
  marginBottom(i: number): Style { const s = this.clone(); s._marginBottom = Math.max(0, i); return s }
  marginLeft(i: number): Style { const s = this.clone(); s._marginLeft = Math.max(0, i); return s }

  marginBackground(c: Color): Style {
    const s = this.clone()
    s._marginBg = c
    return s
  }

  marginChar(c: string): Style {
    const s = this.clone()
    s._marginChar = c
    return s
  }

  border(t: BorderType | BorderStyle | null, ...sides: boolean[]): Style {
    const s = this.clone()
    if (typeof t === "string") {
      s._borderStyle = (borders as any)[t] ?? null
    } else {
      s._borderStyle = t
    }
    if (sides.length === 0) {
      s._borderTopEnabled = true
      s._borderRightEnabled = true
      s._borderBottomEnabled = true
      s._borderLeftEnabled = true
      s._borderSidesSet = false
    } else {
      const resolved = resolveSides(sides)
      s._borderTopEnabled = resolved[0]
      s._borderRightEnabled = resolved[1]
      s._borderBottomEnabled = resolved[2]
      s._borderLeftEnabled = resolved[3]
      s._borderSidesSet = true
    }
    return s
  }

  borderStyle(b: BorderStyle | null): Style {
    const s = this.clone()
    s._borderStyle = b
    return s
  }

  borderTop(v: boolean): Style { const s = this.clone(); s._borderTopEnabled = v; s._borderSidesSet = true; return s }
  borderRight(v: boolean): Style { const s = this.clone(); s._borderRightEnabled = v; s._borderSidesSet = true; return s }
  borderBottom(v: boolean): Style { const s = this.clone(); s._borderBottomEnabled = v; s._borderSidesSet = true; return s }
  borderLeft(v: boolean): Style { const s = this.clone(); s._borderLeftEnabled = v; s._borderSidesSet = true; return s }

  borderForeground(...c: Color[]): Style {
    const s = this.clone()
    if (c.length === 0) return s
    if (c.length === 1) {
      s._borderTopFgColor = c[0]!
      s._borderRightFgColor = c[0]!
      s._borderBottomFgColor = c[0]!
      s._borderLeftFgColor = c[0]!
    } else if (c.length === 2) {
      s._borderTopFgColor = c[0]!
      s._borderBottomFgColor = c[0]!
      s._borderLeftFgColor = c[1]!
      s._borderRightFgColor = c[1]!
    } else if (c.length === 3) {
      s._borderTopFgColor = c[0]!
      s._borderLeftFgColor = c[1]!
      s._borderRightFgColor = c[1]!
      s._borderBottomFgColor = c[2]!
    } else if (c.length >= 4) {
      s._borderTopFgColor = c[0]!
      s._borderRightFgColor = c[1]!
      s._borderBottomFgColor = c[2]!
      s._borderLeftFgColor = c[3]!
    }
    return s
  }

  borderColor(c: Color): Style {
    const s = this.clone()
    s._borderTopFgColor = c
    s._borderRightFgColor = c
    s._borderBottomFgColor = c
    s._borderLeftFgColor = c
    return s
  }

  borderTopForeground(c: Color): Style { const s = this.clone(); s._borderTopFgColor = c; return s }
  borderRightForeground(c: Color): Style { const s = this.clone(); s._borderRightFgColor = c; return s }
  borderBottomForeground(c: Color): Style { const s = this.clone(); s._borderBottomFgColor = c; return s }
  borderLeftForeground(c: Color): Style { const s = this.clone(); s._borderLeftFgColor = c; return s }

  borderForegroundBlend(...c: Color[]): Style {
    const s = this.clone()
    if (c.length === 0) return s
    if (c.length === 1) return s.borderForeground(c[0]!)
    s._borderBlendFgColors = c
    return s
  }

  borderForegroundBlendOffset(v: number): Style {
    const s = this.clone()
    s._borderForegroundBlendOffset = v
    return s
  }

  borderTopBackground(c: Color): Style { const s = this.clone(); s._borderTopBgColor = c; return s }
  borderRightBackground(c: Color): Style { const s = this.clone(); s._borderRightBgColor = c; return s }
  borderBottomBackground(c: Color): Style { const s = this.clone(); s._borderBottomBgColor = c; return s }
  borderLeftBackground(c: Color): Style { const s = this.clone(); s._borderLeftBgColor = c; return s }

  inline(v: boolean): Style {
    const s = this.clone()
    s._inline = v
    return s
  }

  maxWidth(i: number): Style { const s = this.clone(); s._maxWidth = Math.max(0, i); return s }
  maxHeight(i: number): Style { const s = this.clone(); s._maxHeight = Math.max(0, i); return s }

  tabWidth(n: number): Style {
    const s = this.clone()
    s._tabWidth = n <= -1 ? -1 : n
    return s
  }

  underlineSpaces(v: boolean): Style {
    const s = this.clone()
    s._underlineSpaces = v
    return s
  }

  strikethroughSpaces(v: boolean): Style {
    const s = this.clone()
    s._strikethroughSpaces = v
    return s
  }

  transform(fn: (s: string) => string): Style {
    const s = this.clone()
    s._transformFn = fn
    return s
  }

  hyperlink(link: string, ...params: string[]): Style {
    const s = this.clone()
    s._link = link
    if (params.length > 0) s._linkParams = params.join(":")
    return s
  }

  setString(...strs: string[]): Style {
    const s = this.clone()
    s._value = strs.join(" ")
    return s
  }

  value(): string { return this._value }

  string(): string { return this.render() }

  copy(): Style { return this.clone() }

  inherit(i: Style): Style {
    const s = this.clone()
    if (i._fgColor !== null && s._fgColor === null) s._fgColor = i._fgColor
    if (i._bgColor !== null && s._bgColor === null) s._bgColor = i._bgColor
    if (i._ulColor !== null && s._ulColor === null) s._ulColor = i._ulColor
    if (i._ul !== "none" && s._ul === "none") s._ul = i._ul
    if (i._width !== 0 && s._width === 0) s._width = i._width
    if (i._height !== 0 && s._height === 0) s._height = i._height
    if (i._alignH !== "left" && s._alignH === "left") s._alignH = i._alignH
    if (i._alignV !== "left" && s._alignV === "left") s._alignV = i._alignV
    if (i._borderStyle !== null && s._borderStyle === null) s._borderStyle = i._borderStyle
    if (i._maxWidth !== 0 && s._maxWidth === 0) s._maxWidth = i._maxWidth
    if (i._maxHeight !== 0 && s._maxHeight === 0) s._maxHeight = i._maxHeight
    if (i._tabWidth !== DEFAULT_TAB_WIDTH && s._tabWidth === DEFAULT_TAB_WIDTH) s._tabWidth = i._tabWidth
    if (i._transformFn !== null && s._transformFn === null) s._transformFn = i._transformFn
    if (i._link !== "" && s._link === "") s._link = i._link
    if (i._linkParams !== "" && s._linkParams === "") s._linkParams = i._linkParams
    s._attrs |= (i._attrs & ~s._attrs)
    if (i._bgColor !== null && s._marginBg === null && i._marginBg === null) {
      s._marginBg = i._bgColor
    }
    return s
  }

  render(...strs: string[]): string {
    if (this._value) strs = [this._value, ...strs]
    let str = strs.join(" ")

    if (this._transformFn) str = this._transformFn(str)

    const hasStyles = this._attrs !== 0 || this._fgColor !== null || this._bgColor !== null || this._ulColor !== null || this._ul !== "none" ||
      this._width !== 0 || this._height !== 0 || this._maxWidth !== 0 || this._maxHeight !== 0 ||
      this._paddingTop !== 0 || this._paddingRight !== 0 || this._paddingBottom !== 0 || this._paddingLeft !== 0 ||
      this._marginTop !== 0 || this._marginRight !== 0 || this._marginBottom !== 0 || this._marginLeft !== 0 ||
      this._borderStyle !== null || this._alignH !== "left" || this._alignV !== "left" || this._inline ||
      this._link !== ""
    if (!hasStyles) return this.maybeConvertTabs(str)

    const bold_ = (this._attrs & Style.BOLD) !== 0
    const italic_ = (this._attrs & Style.ITALIC) !== 0
    const strikethrough_ = (this._attrs & Style.STRIKETHROUGH) !== 0
    const reverse_ = (this._attrs & Style.REVERSE) !== 0
    const blink_ = (this._attrs & Style.BLINK) !== 0
    const faint_ = (this._attrs & Style.DIM) !== 0
    const underline_ = this._ul !== "none"

    const fgColor = this._fgColor
    const bgColor = this._bgColor
    const ulColor = this._ulColor

    const styleWhitespace = reverse_
    const useSpaceStyler = (underline_ && !this._underlineSpaces) ||
      (strikethrough_ && !this._strikethroughSpaces) ||
      this._underlineSpaces || this._strikethroughSpaces

    let te = ""
    let teSpace = ""
    let teWhitespace = ""

    if (bold_) te += bold
    if (italic_) te += italic
    if (underline_) te += underline
    if (reverse_) { te += reverse; teWhitespace += reverse }
    if (blink_) te += blink
    if (faint_) te += dim
    if (strikethrough_) te += strikethrough

    if (fgColor !== null) {
      te += fg(fgColor)
      if (styleWhitespace) teWhitespace += fg(fgColor)
      if (useSpaceStyler) teSpace += fg(fgColor)
    }
    if (bgColor !== null) {
      te += bg(bgColor)
      teWhitespace += bg(bgColor)
      if (useSpaceStyler) teSpace += bg(bgColor)
    }
    if (ulColor !== null) {
      te += ulColorFn(ulColor)
      teWhitespace += ulColorFn(ulColor)
      if (useSpaceStyler) teSpace += ulColorFn(ulColor)
    }

    str = this.maybeConvertTabs(str)
    str = str.replace(/\r\n/g, "\n")

    if (this._inline) str = str.replace(/\n/g, "")

    const hBorderSize = this.getHorizontalBorderSize()
    const vBorderSize = this.getVerticalBorderSize()
    const blockWidth = this._width - hBorderSize
    const blockHeight = this._height - vBorderSize

    if (!this._inline && blockWidth > 0) {
      const wrapAt = blockWidth - this._paddingLeft - this._paddingRight
      str = wordWrapStr(str, wrapAt)
    }

    {
      const lines = str.split("\n")
      const styledLines: string[] = []
      for (const line of lines) {
        if (line.length === 0) {
          styledLines.push("")
        } else if (useSpaceStyler) {
          let styled = ""
          for (const ch of line) {
            if (/\s/.test(ch)) {
              styled += teSpace + ch + reset
            } else {
              styled += te + ch + reset
            }
          }
          styledLines.push(styled)
        } else {
          styledLines.push(te + line + reset)
        }
      }
      str = styledLines.join(reset + "\n")
    }

    if (this._link) {
      str = `\x1b]8;;${this._link}\x07${str}\x1b]8;;\x07`
    }

    if (!this._inline) {
      const useWhitespaceStyle = this._bgColor !== null || styleWhitespace
      const whitespaceStyle = useWhitespaceStyle ? teWhitespace : ""
      const padChar = this._paddingChar || " "
      if (this._paddingLeft > 0) str = padStr(str, -this._paddingLeft, padChar, whitespaceStyle)
      if (this._paddingRight > 0) str = padStr(str, this._paddingRight, padChar, whitespaceStyle)
      if (this._paddingTop > 0) str = "\n".repeat(this._paddingTop) + str
      if (this._paddingBottom > 0) str += "\n".repeat(this._paddingBottom)
    }

    if (blockHeight > 0) str = alignTextVertical(str, this._alignV, blockHeight)

    if (blockWidth > 0 || str.includes("\n")) {
      const useWhitespaceStyle = this._bgColor !== null || styleWhitespace
      const whitespaceStyle = useWhitespaceStyle ? teWhitespace : ""
      str = alignTextHorizontal(str, this._alignH, blockWidth, whitespaceStyle)
    }

    if (!this._inline) {
      str = this.applyBorder(str)
      str = this.applyMargins(str)
    }

    if (this._maxWidth > 0) {
      str = str.split("\n").map(l => truncateStr(l, this._maxWidth)).join("\n")
    }

    if (this._maxHeight > 0) {
      str = str.split("\n").slice(0, this._maxHeight).join("\n")
    }

    return str
  }

  static width(str: string): number { return getStringWidth(str) }
  static height(str: string): number { return str.split("\n").length }

  getBold(): boolean { return (this._attrs & Style.BOLD) !== 0 }
  getItalic(): boolean { return (this._attrs & Style.ITALIC) !== 0 }
  getUnderline(): boolean { return this._ul !== "none" }
  getUnderlineStyle(): UnderlineStyle { return this._ul }
  getUnderlineColor(): Color { return this._ulColor }
  getStrikethrough(): boolean { return (this._attrs & Style.STRIKETHROUGH) !== 0 }
  getReverse(): boolean { return (this._attrs & Style.REVERSE) !== 0 }
  getBlink(): boolean { return (this._attrs & Style.BLINK) !== 0 }
  getFaint(): boolean { return (this._attrs & Style.DIM) !== 0 }
  getForeground(): Color { return this._fgColor }
  getBackground(): Color { return this._bgColor }
  getWidth(): number { return this._width }
  getHeight(): number { return this._height }
  getAlign(): TextAlign { return this._alignH }
  getAlignHorizontal(): TextAlign { return this._alignH }
  getAlignVertical(): TextAlign { return this._alignV }
  getPadding(): [number, number, number, number] { return [this._paddingTop, this._paddingRight, this._paddingBottom, this._paddingLeft] }
  getPaddingTop(): number { return this._paddingTop }
  getPaddingRight(): number { return this._paddingRight }
  getPaddingBottom(): number { return this._paddingBottom }
  getPaddingLeft(): number { return this._paddingLeft }
  getPaddingChar(): string { return this._paddingChar || " " }
  getHorizontalPadding(): number { return this._paddingLeft + this._paddingRight }
  getVerticalPadding(): number { return this._paddingTop + this._paddingBottom }
  getMargin(): [number, number, number, number] { return [this._marginTop, this._marginRight, this._marginBottom, this._marginLeft] }
  getMarginTop(): number { return this._marginTop }
  getMarginRight(): number { return this._marginRight }
  getMarginBottom(): number { return this._marginBottom }
  getMarginLeft(): number { return this._marginLeft }
  getMarginChar(): string { return this._marginChar || " " }
  getMarginBackground(): Color { return this._marginBg }
  getHorizontalMargins(): number { return this._marginLeft + this._marginRight }
  getVerticalMargins(): number { return this._marginTop + this._marginBottom }
  getBorderStyle(): BorderStyle | null { return this._borderStyle }
  getBorderTop(): boolean { return this._borderTopEnabled }
  getBorderRight(): boolean { return this._borderRightEnabled }
  getBorderBottom(): boolean { return this._borderBottomEnabled }
  getBorderLeft(): boolean { return this._borderLeftEnabled }
  getBorderTopForeground(): Color { return this._borderTopFgColor }
  getBorderRightForeground(): Color { return this._borderRightFgColor }
  getBorderBottomForeground(): Color { return this._borderBottomFgColor }
  getBorderLeftForeground(): Color { return this._borderLeftFgColor }
  getBorderTopBackground(): Color { return this._borderTopBgColor }
  getBorderRightBackground(): Color { return this._borderRightBgColor }
  getBorderBottomBackground(): Color { return this._borderBottomBgColor }
  getBorderLeftBackground(): Color { return this._borderLeftBgColor }
  getBorderForegroundBlend(): Color[] | null { return this._borderBlendFgColors }
  getBorderForegroundBlendOffset(): number { return this._borderForegroundBlendOffset }
  getBorderTopSize(): number {
    if (this._borderStyle && !this._borderSidesSet) return 1
    if (!this._borderTopEnabled) return 0
    return this._borderStyle ? getTopSize(this._borderStyle) : 0
  }
  getBorderRightSize(): number {
    if (this._borderStyle && !this._borderSidesSet) return 1
    if (!this._borderRightEnabled) return 0
    return this._borderStyle ? getRightSize(this._borderStyle) : 0
  }
  getBorderBottomSize(): number {
    if (this._borderStyle && !this._borderSidesSet) return 1
    if (!this._borderBottomEnabled) return 0
    return this._borderStyle ? getBottomSize(this._borderStyle) : 0
  }
  getBorderLeftSize(): number {
    if (this._borderStyle && !this._borderSidesSet) return 1
    if (!this._borderLeftEnabled) return 0
    return this._borderStyle ? getLeftSize(this._borderStyle) : 0
  }
  getHorizontalBorderSize(): number { return this.getBorderLeftSize() + this.getBorderRightSize() }
  getVerticalBorderSize(): number { return this.getBorderTopSize() + this.getBorderBottomSize() }
  getInline(): boolean { return this._inline }
  getMaxWidth(): number { return this._maxWidth }
  getMaxHeight(): number { return this._maxHeight }
  getTabWidth(): number { return this._tabWidth }
  getUnderlineSpaces(): boolean { return this._underlineSpaces }
  getStrikethroughSpaces(): boolean { return this._strikethroughSpaces }
  getTransform(): ((s: string) => string) | null { return this._transformFn }
  getHyperlink(): [string, string] { return [this._link, this._linkParams] }
  getHorizontalFrameSize(): number { return this.getHorizontalMargins() + this.getHorizontalPadding() + this.getHorizontalBorderSize() }
  getVerticalFrameSize(): number { return this.getVerticalMargins() + this.getVerticalPadding() + this.getVerticalBorderSize() }

  unsetBold(): Style { const s = this.clone(); s._attrs &= ~Style.BOLD; return s }
  unsetItalic(): Style { const s = this.clone(); s._attrs &= ~Style.ITALIC; return s }
  unsetUnderline(): Style { return this.underline(false) }
  unsetStrikethrough(): Style { const s = this.clone(); s._attrs &= ~Style.STRIKETHROUGH; return s }
  unsetReverse(): Style { const s = this.clone(); s._attrs &= ~Style.REVERSE; return s }
  unsetBlink(): Style { const s = this.clone(); s._attrs &= ~Style.BLINK; return s }
  unsetFaint(): Style { const s = this.clone(); s._attrs &= ~Style.DIM; return s }
  unsetForeground(): Style { const s = this.clone(); s._fgColor = null; return s }
  unsetBackground(): Style { const s = this.clone(); s._bgColor = null; return s }
  unsetWidth(): Style { const s = this.clone(); s._width = 0; return s }
  unsetHeight(): Style { const s = this.clone(); s._height = 0; return s }
  unsetAlign(): Style { const s = this.clone(); s._alignH = "left"; s._alignV = "left"; return s }
  unsetAlignHorizontal(): Style { const s = this.clone(); s._alignH = "left"; return s }
  unsetAlignVertical(): Style { const s = this.clone(); s._alignV = "left"; return s }
  unsetPadding(): Style {
    const s = this.clone()
    s._paddingTop = s._paddingRight = s._paddingBottom = s._paddingLeft = 0
    s._paddingChar = " "
    return s
  }
  unsetPaddingChar(): Style { const s = this.clone(); s._paddingChar = " "; return s }
  unsetPaddingLeft(): Style { const s = this.clone(); s._paddingLeft = 0; return s }
  unsetPaddingRight(): Style { const s = this.clone(); s._paddingRight = 0; return s }
  unsetPaddingTop(): Style { const s = this.clone(); s._paddingTop = 0; return s }
  unsetPaddingBottom(): Style { const s = this.clone(); s._paddingBottom = 0; return s }
  unsetMargins(): Style {
    const s = this.clone()
    s._marginTop = s._marginRight = s._marginBottom = s._marginLeft = 0
    return s
  }
  unsetMarginLeft(): Style { const s = this.clone(); s._marginLeft = 0; return s }
  unsetMarginRight(): Style { const s = this.clone(); s._marginRight = 0; return s }
  unsetMarginTop(): Style { const s = this.clone(); s._marginTop = 0; return s }
  unsetMarginBottom(): Style { const s = this.clone(); s._marginBottom = 0; return s }
  unsetMarginBackground(): Style { const s = this.clone(); s._marginBg = null; return s }
  unsetBorderStyle(): Style { const s = this.clone(); s._borderStyle = null; return s }
  unsetBorderTop(): Style { const s = this.clone(); s._borderTopEnabled = false; return s }
  unsetBorderRight(): Style { const s = this.clone(); s._borderRightEnabled = false; return s }
  unsetBorderBottom(): Style { const s = this.clone(); s._borderBottomEnabled = false; return s }
  unsetBorderLeft(): Style { const s = this.clone(); s._borderLeftEnabled = false; return s }
  unsetBorderForeground(): Style {
    const s = this.clone()
    s._borderTopFgColor = null
    s._borderRightFgColor = null
    s._borderBottomFgColor = null
    s._borderLeftFgColor = null
    return s
  }
  unsetBorderTopForeground(): Style { const s = this.clone(); s._borderTopFgColor = null; return s }
  unsetBorderRightForeground(): Style { const s = this.clone(); s._borderRightFgColor = null; return s }
  unsetBorderBottomForeground(): Style { const s = this.clone(); s._borderBottomFgColor = null; return s }
  unsetBorderLeftForeground(): Style { const s = this.clone(); s._borderLeftFgColor = null; return s }
  unsetBorderBackground(): Style {
    const s = this.clone()
    s._borderTopBgColor = null
    s._borderRightBgColor = null
    s._borderBottomBgColor = null
    s._borderLeftBgColor = null
    return s
  }
  unsetBorderTopBackground(): Style { const s = this.clone(); s._borderTopBgColor = null; return s }
  unsetBorderRightBackground(): Style { const s = this.clone(); s._borderRightBgColor = null; return s }
  unsetBorderBottomBackground(): Style { const s = this.clone(); s._borderBottomBgColor = null; return s }
  unsetBorderLeftBackground(): Style { const s = this.clone(); s._borderLeftBgColor = null; return s }
  unsetInline(): Style { const s = this.clone(); s._inline = false; return s }
  unsetMaxWidth(): Style { const s = this.clone(); s._maxWidth = 0; return s }
  unsetMaxHeight(): Style { const s = this.clone(); s._maxHeight = 0; return s }
  unsetTabWidth(): Style { const s = this.clone(); s._tabWidth = DEFAULT_TAB_WIDTH; return s }
  unsetUnderlineSpaces(): Style { const s = this.clone(); s._underlineSpaces = false; return s }
  unsetStrikethroughSpaces(): Style { const s = this.clone(); s._strikethroughSpaces = false; return s }
  unsetTransform(): Style { const s = this.clone(); s._transformFn = null; return s }
  unsetHyperlink(): Style { const s = this.clone(); s._link = ""; s._linkParams = ""; return s }
  unsetString(): Style { const s = this.clone(); s._value = ""; return s }

  private clone(): Style {
    const s = new Style()
    s._attrs = this._attrs
    s._fgColor = this._fgColor
    s._bgColor = this._bgColor
    s._ulColor = this._ulColor
    s._ul = this._ul
    s._value = this._value
    s._link = this._link
    s._linkParams = this._linkParams
    s._width = this._width
    s._height = this._height
    s._alignH = this._alignH
    s._alignV = this._alignV
    s._paddingTop = this._paddingTop
    s._paddingRight = this._paddingRight
    s._paddingBottom = this._paddingBottom
    s._paddingLeft = this._paddingLeft
    s._paddingChar = this._paddingChar
    s._marginTop = this._marginTop
    s._marginRight = this._marginRight
    s._marginBottom = this._marginBottom
    s._marginLeft = this._marginLeft
    s._marginBg = this._marginBg
    s._marginChar = this._marginChar
    s._borderStyle = this._borderStyle
    s._borderTopEnabled = this._borderTopEnabled
    s._borderRightEnabled = this._borderRightEnabled
    s._borderBottomEnabled = this._borderBottomEnabled
    s._borderLeftEnabled = this._borderLeftEnabled
    s._borderSidesSet = this._borderSidesSet
    s._borderTopFgColor = this._borderTopFgColor
    s._borderRightFgColor = this._borderRightFgColor
    s._borderBottomFgColor = this._borderBottomFgColor
    s._borderLeftFgColor = this._borderLeftFgColor
    s._borderTopBgColor = this._borderTopBgColor
    s._borderRightBgColor = this._borderRightBgColor
    s._borderBottomBgColor = this._borderBottomBgColor
    s._borderLeftBgColor = this._borderLeftBgColor
    s._borderBlendFgColors = this._borderBlendFgColors
    s._borderForegroundBlendOffset = this._borderForegroundBlendOffset
    s._maxWidth = this._maxWidth
    s._maxHeight = this._maxHeight
    s._tabWidth = this._tabWidth
    s._inline = this._inline
    s._underlineSpaces = this._underlineSpaces
    s._strikethroughSpaces = this._strikethroughSpaces
    s._transformFn = this._transformFn
    return s
  }

  private maybeConvertTabs(str: string): string {
    switch (this._tabWidth) {
      case -1: return str
      case 0: return str.replace(/\t/g, "")
      default: return str.replace(/\t/g, " ".repeat(this._tabWidth))
    }
  }

  private applyMargins(str: string): string {
    const topMargin = this._marginTop
    const rightMargin = this._marginRight
    const bottomMargin = this._marginBottom
    const leftMargin = this._marginLeft

    if (!topMargin && !rightMargin && !bottomMargin && !leftMargin) return str

    const marginBg = this._marginBg
    let marginStyle = ""
    if (marginBg !== null) {
      marginStyle = bg(marginBg)
    }

    const marginChar = this._marginChar || " "

    const leftPad = marginStyle ? marginStyle + marginChar.repeat(leftMargin) + reset : marginChar.repeat(leftMargin)
    const rightPad = marginStyle ? marginStyle + marginChar.repeat(rightMargin) + reset : marginChar.repeat(rightMargin)

    const lines = str.split("\n")
    const margined = lines.map((line) => leftPad + line + rightPad)

    const topPadLines: string[] = []
    const bottomPadLines: string[] = []

    if (topMargin > 0) {
      const [, marginWidth] = getLines(str)
      const spaces = marginStyle ? marginStyle + " ".repeat(marginWidth) + reset : " ".repeat(marginWidth)
      for (let i = 0; i < topMargin; i++) {
        topPadLines.push(spaces)
      }
    }
    if (bottomMargin > 0) {
      const [, marginWidth2] = getLines(str)
      const spaces = marginStyle ? marginStyle + " ".repeat(marginWidth2) + reset : " ".repeat(marginWidth2)
      for (let i = 0; i < bottomMargin; i++) {
        bottomPadLines.push(spaces)
      }
    }

    return [...topPadLines, ...margined, ...bottomPadLines].join("\n")
  }

  private applyBorder(str: string): string {
    const border = this._borderStyle
    if (!border) return str

    let hasTop = this._borderSidesSet ? this._borderTopEnabled : true
    let hasRight = this._borderSidesSet ? this._borderRightEnabled : true
    let hasBottom = this._borderSidesSet ? this._borderBottomEnabled : true
    let hasLeft = this._borderSidesSet ? this._borderLeftEnabled : true

    if (!hasTop && !hasRight && !hasBottom && !hasLeft) return str

    const [lines, width] = getLines(str)

    let leftWidth = hasLeft ? getLeftSize(border) : 0
    let rightWidth = hasRight ? getRightSize(border) : 0
    const borderWidth = width + leftWidth + rightWidth

    let tl = border.topLeft
    let tr = border.topRight
    let bl = border.bottomLeft
    let br = border.bottomRight

    if (hasTop && hasLeft && tl === "") tl = " "
    if (hasTop && hasRight && tr === "") tr = " "
    if (hasBottom && hasLeft && bl === "") bl = " "
    if (hasBottom && hasRight && br === "") br = " "

    if (hasTop) {
      if (!hasLeft && !hasRight) { tl = ""; tr = "" }
      else if (!hasLeft) { tl = "" }
      else if (!hasRight) { tr = "" }
    }
    if (hasBottom) {
      if (!hasLeft && !hasRight) { bl = ""; br = "" }
      else if (!hasLeft) { bl = "" }
      else if (!hasRight) { br = "" }
    }

    tl = getFirstRune(tl)
    tr = getFirstRune(tr)
    br = getFirstRune(br)
    bl = getFirstRune(bl)

    const topFg = this._borderTopFgColor
    const rightFg = this._borderRightFgColor
    const bottomFg = this._borderBottomFgColor
    const leftFg = this._borderLeftFgColor
    const topBg = this._borderTopBgColor
    const rightBg = this._borderRightBgColor
    const bottomBg = this._borderBottomBgColor
    const leftBg = this._borderLeftBgColor
    const blendFG = this._borderBlendFgColors

    let blend: string[] | null = null
    if (blendFG && blendFG.length >= 2) {
      const totalSteps = (borderWidth + 2) * 2
      blend = Blend1D(totalSteps, ...(blendFG as string[]))
      if (this._borderForegroundBlendOffset !== 0) {
        let r = -this._borderForegroundBlendOffset
        const n = blend.length
        r = ((r % n) + n) % n
        blend = [...blend.slice(r), ...blend.slice(0, r)].reverse()
      }
    }

    const out: string[] = []

    if (hasTop) {
      const top = renderHorizontalEdge(tl, border.top || " ", tr, borderWidth)
      if (blend) {
        out.push(styleBorderGradient(top, blend.slice(0, borderWidth + 2), topBg))
      } else {
        out.push(styleBorderStr(top, topFg, topBg))
      }
    }

    const leftRunes = [...(border.left || " ")]
    const rightRunes = [...(border.right || " ")]
    let leftIndex = 0
    let rightIndex = 0

    const padded = lines.map((line) => {
      const vis = getStringWidth(line)
      if (vis < width) return line + " ".repeat(width - vis)
      return line
    })

    const sideStart = borderWidth + 2

    for (let i = 0; i < padded.length; i++) {
      if (i === 0) out.push("\n")
      if (hasLeft) {
        const r = leftRunes[leftIndex % leftRunes.length]!
        leftIndex++
        if (blend) {
          out.push(styleBorderStr(r, blend[sideStart + i] || leftFg, leftBg))
        } else {
          out.push(styleBorderStr(r, leftFg, leftBg))
        }
      }
      out.push(padded[i]!)
      if (hasRight) {
        const r = rightRunes[rightIndex % rightRunes.length]!
        rightIndex++
        if (blend) {
          const ri = sideStart + lines.length + i
          out.push(styleBorderStr(r, blend[ri] || rightFg, rightBg))
        } else {
          out.push(styleBorderStr(r, rightFg, rightBg))
        }
      }
      if (i < padded.length - 1) {
        out.push("\n")
      }
    }

    if (hasBottom) {
      const bottomEdgeStart = borderWidth + 2 + lines.length * 2
      const bottom = renderHorizontalEdge(bl, border.bottom || " ", br, borderWidth)
      out.push("\n")
      if (blend) {
        const bottomGrad = blend.slice(bottomEdgeStart, bottomEdgeStart + borderWidth + 2).reverse()
        out.push(styleBorderGradient(bottom, bottomGrad, bottomBg))
      } else {
        out.push(styleBorderStr(bottom, bottomFg, bottomBg))
      }
    }

    return out.join("")
  }
}

function resolveSides(sides: boolean[]): [boolean, boolean, boolean, boolean] {
  if (sides.length === 1) return [sides[0]!, sides[0]!, sides[0]!, sides[0]!]
  if (sides.length === 2) return [sides[0]!, sides[1]!, sides[0]!, sides[1]!]
  if (sides.length === 3) return [sides[0]!, sides[1]!, sides[2]!, sides[1]!]
  if (sides.length >= 4) return [sides[0]!, sides[1]!, sides[2]!, sides[3]!]
  return [true, true, true, true]
}

function getFirstRune(str: string): string {
  if (str === "") return str
  const iter = str[Symbol.iterator]()
  const first = iter.next()
  return first.done ? "" : first.value
}

function renderHorizontalEdge(left: string, middle: string, right: string, width: number): string {
  const leftWidth = getStringWidth(left)
  const rightWidth = getStringWidth(right)
  const middleRunes = [...middle]
  let out = left
  let j = 0
  for (let i = 0; i < width - leftWidth - rightWidth;) {
    const r = middleRunes[j % middleRunes.length]!
    out += r
    i += getStringWidth(r)
    j++
  }
  out += right
  return out
}

function styleBorderStr(border: string, fgColor: Color | null, bgColor: Color | null): string {
  if (!fgColor && !bgColor) return border
  let style = ""
  if (fgColor) style += fg(fgColor)
  if (bgColor) style += bg(bgColor)
  return style + border + reset
}

function styleBorderGradient(border: string, fgColors: string[], bgColor: Color | null): string {
  const chars = [...border]
  let out = ""
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!
    let style = ""
    if (i < fgColors.length) style += `\x1b[${colorToAnsi(fgColors[i]!, "38")}m`
    if (bgColor) style += bg(bgColor)
    out += style + ch + reset
  }
  return out
}

function getLines(s: string): [string[], number] {
  let str = s.replace(/\t/g, "    ").replace(/\r\n/g, "\n")
  const lines = str.split("\n")
  let widest = 0
  for (const l of lines) {
    const w = getStringWidth(l)
    if (w > widest) widest = w
  }
  return [lines, widest]
}

function wordWrapStr(str: string, maxWidth: number): string {
  if (maxWidth <= 0) return str
  const lines = str.split("\n")
  const result: string[] = []
  for (const line of lines) {
    if (getStringWidth(line) <= maxWidth) { result.push(line); continue }
    const words = line.split(" ")
    let currentLine = ""
    for (const word of words) {
      if (currentLine && getStringWidth(currentLine + " " + word) > maxWidth) {
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

function alignTextHorizontal(str: string, align: TextAlign, width: number, whitespaceStyle: string = ""): string {
  const lines = str.split("\n")
  return lines.map((line) => {
    const vis = getStringWidth(line)
    if (width > 0 && vis < width) {
      const padding = width - vis
      const pad = whitespaceStyle ? whitespaceStyle + " ".repeat(padding) + reset : " ".repeat(padding)
      if (align === "center") {
        const left = Math.floor(padding / 2)
        const lPad = whitespaceStyle ? whitespaceStyle + " ".repeat(left) + reset : " ".repeat(left)
        const rPad = whitespaceStyle ? whitespaceStyle + " ".repeat(padding - left) + reset : " ".repeat(padding - left)
        return lPad + line + rPad
      }
      if (align === "right") return pad + line
      return line + pad
    }
    if (width > 0 && vis > width) return truncateStr(line, width)
    return line
  }).join("\n")
}

function alignTextVertical(str: string, align: TextAlign, height: number): string {
  const lines = str.split("\n")
  if (lines.length >= height) return str
  const diff = height - lines.length
  if (align === "right") return "\n".repeat(diff) + str
  if (align === "center") {
    const top = Math.floor(diff / 2)
    return "\n".repeat(top) + str + "\n".repeat(diff - top)
  }
  return str + "\n".repeat(diff)
}

function truncateStr(str: string, maxWidth: number): string {
  if (getStringWidth(str) <= maxWidth) return str
  let result = ""
  let count = 0
  let inEscape = false
  for (const char of str) {
    if (char === "\x1b") { inEscape = true; result += char; continue }
    if (inEscape) { result += char; if (char === "m") inEscape = false; continue }
    if (count >= maxWidth - 1) { result += "\u2026"; break }
    result += char
    count++
  }
  return result
}

function padStr(str: string, n: number, char: string, style: string = ""): string {
  if (n === 0) return str
  const abs = Math.abs(n)
  const sp = style ? style + char.repeat(abs) + reset : char.repeat(abs)
  return str.split("\n").map((line) => n > 0 ? line + sp : sp + line).join("\n")
}

export function NewStyle(): Style {
  return Style.newStyle()
}
