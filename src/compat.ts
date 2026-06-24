// compat.ts | Lipgloss-compatible API re-exports
// These match Go lipgloss export names exactly

import { Style, NewStyle } from "./style"
import type { TextAlign as StylePosition, UnderlineStyle } from "./style"
import type { Color as ColorType } from "./color"
import { borders } from "./border"
import type { BorderType } from "./border"
import { Writer } from "./writer"

// ── 4-bit ANSI color constants (Go: ansi.BasicColor iota) ──
export const Black: ColorType = { ansi: 0 }
export const Red: ColorType = { ansi: 1 }
export const Green: ColorType = { ansi: 2 }
export const Yellow: ColorType = { ansi: 3 }
export const Blue: ColorType = { ansi: 4 }
export const Magenta: ColorType = { ansi: 5 }
export const Cyan: ColorType = { ansi: 6 }
export const White: ColorType = { ansi: 7 }
export const BrightBlack: ColorType = { ansi: 8 }
export const BrightRed: ColorType = { ansi: 9 }
export const BrightGreen: ColorType = { ansi: 10 }
export const BrightYellow: ColorType = { ansi: 11 }
export const BrightBlue: ColorType = { ansi: 12 }
export const BrightMagenta: ColorType = { ansi: 13 }
export const BrightCyan: ColorType = { ansi: 14 }
export const BrightWhite: ColorType = { ansi: 15 }

// ── Border functions (Go: func NormalBorder() Border) ──
export function NormalBorder(): BorderType { return borders.normal }
export function RoundedBorder(): BorderType { return borders.rounded }
export function DoubleBorder(): BorderType { return borders.double }
export function ThickBorder(): BorderType { return borders.thick }
export function HiddenBorder(): BorderType { return borders.hidden }
export function BlockBorder(): BorderType { return borders.block }
export function InnerHalfBlockBorder(): BorderType { return borders.innerHalfBlock }
export function OuterHalfBlockBorder(): BorderType { return borders.outerHalfBlock }
export function MarkdownBorder(): BorderType { return borders.markdown }
export function ASCIIBorder(): BorderType { return borders.ascii }

// ── Type exports ──
export interface RGBColor { r: number; g: number; b: number }
export interface ANSIColor { ansi: number }

// ── Standalone style setters (Go: lipgloss.Bold(true) → Style) ──
const _s = () => new Style()

export function Bold(v: boolean = true): Style { return _s().bold(v) }
export function Italic(v: boolean = true): Style { return _s().italic(v) }
export function Underline(v: boolean = true): Style { return _s().underline(v) }
export function Strikethrough(v: boolean = true): Style { return _s().strikethrough(v) }
export function Reverse(v: boolean = true): Style { return _s().reverse(v) }
export function Blink(v: boolean = true): Style { return _s().blink(v) }
export function Faint(v: boolean = true): Style { return _s().faint(v) }
export function Dim(v: boolean = true): Style { return _s().dim(v) }

export function Foreground(c: ColorType): Style { return _s().foreground(c) }
export function Background(c: ColorType): Style { return _s().background(c) }
export function UnderlineColor(c: ColorType): Style { return _s().underlineColor(c) }
export function UnderlineStyle(u: UnderlineStyle): Style { return _s().underlineStyle(u) }

export function Width(v: number): Style { return _s().width(v) }
export function Height(v: number): Style { return _s().height(v) }
export function MaxWidth(v: number): Style { return _s().maxWidth(v) }
export function MaxHeight(v: number): Style { return _s().maxHeight(v) }
export function Padding(...args: number[]): Style { return _s().padding(...args) }
export function Margin(...args: number[]): Style { return _s().margin(...args) }
export function Align(...args: StylePosition[]): Style { return _s().align(...args) }
export function Border(t: BorderType | string | null, ...sides: boolean[]): Style { return _s().border(t as any, ...sides) }
export function Inline(v: boolean = true): Style { return _s().inline(v) }
export function Transform(fn: (s: string) => string): Style { return _s().transform(fn) }
export function Hyperlink(link: string, ...params: string[]): Style { return _s().hyperlink(link, ...params) }
export function TabWidth(v: number): Style { return _s().tabWidth(v) }

// ── Standalone unsetters ──
export function UnsetBold(): Style { return _s().unsetBold() }
export function UnsetItalic(): Style { return _s().unsetItalic() }
export function UnsetUnderline(): Style { return _s().unsetUnderline() }
export function UnsetStrikethrough(): Style { return _s().unsetStrikethrough() }
export function UnsetReverse(): Style { return _s().unsetReverse() }
export function UnsetBlink(): Style { return _s().unsetBlink() }
export function UnsetFaint(): Style { return _s().unsetFaint() }
export function UnsetForeground(): Style { return _s().unsetForeground() }
export function UnsetBackground(): Style { return _s().unsetBackground() }
export function UnsetUnderlineColor(): Style { return _s().underlineStyle("none") }
export function UnsetWidth(): Style { return _s().unsetWidth() }
export function UnsetHeight(): Style { return _s().unsetHeight() }
export function UnsetMaxWidth(): Style { return _s().unsetMaxWidth() }
export function UnsetMaxHeight(): Style { return _s().unsetMaxHeight() }
export function UnsetPadding(): Style { return _s().unsetPadding() }
export function UnsetMargins(): Style { return _s().unsetMargins() }
export function UnsetAlign(): Style { return _s().unsetAlign() }
export function UnsetBorderStyle(): Style { return _s().unsetBorderStyle() }
export function UnsetInline(): Style { return _s().unsetInline() }
export function UnsetTransform(): Style { return _s().unsetTransform() }
export function UnsetHyperlink(): Style { return _s().unsetHyperlink() }
export function UnsetTabWidth(): Style { return _s().unsetTabWidth() }
export function UnsetString(): Style { return _s().unsetString() }

// ── Standalone getters (Go: lipgloss.GetWidth(s)) ──
export function GetWidth(s: Style): number { return s.getWidth() }
export function GetHeight(s: Style): number { return s.getHeight() }
export function GetMaxWidth(s: Style): number { return s.getMaxWidth() }
export function GetMaxHeight(s: Style): number { return s.getMaxHeight() }
export function GetForeground(s: Style): ColorType { return s.getForeground() }
export function GetBackground(s: Style): ColorType { return s.getBackground() }
export function GetBold(s: Style): boolean { return s.getBold() }
export function GetItalic(s: Style): boolean { return s.getItalic() }
export function GetUnderline(s: Style): boolean { return s.getUnderline() }
export function GetStrikethrough(s: Style): boolean { return s.getStrikethrough() }
export function GetReverse(s: Style): boolean { return s.getReverse() }
export function GetBlink(s: Style): boolean { return s.getBlink() }
export function GetFaint(s: Style): boolean { return s.getFaint() }
export function GetInline(s: Style): boolean { return s.getInline() }
export function GetPadding(s: Style): [number, number, number, number] { return s.getPadding() }
export function GetPaddingTop(s: Style): number { return s.getPaddingTop() }
export function GetPaddingRight(s: Style): number { return s.getPaddingRight() }
export function GetPaddingBottom(s: Style): number { return s.getPaddingBottom() }
export function GetPaddingLeft(s: Style): number { return s.getPaddingLeft() }
export function GetPaddingChar(s: Style): string { return s.getPaddingChar() }
export function GetMargin(s: Style): [number, number, number, number] { return s.getMargin() }
export function GetMarginTop(s: Style): number { return s.getMarginTop() }
export function GetMarginRight(s: Style): number { return s.getMarginRight() }
export function GetMarginBottom(s: Style): number { return s.getMarginBottom() }
export function GetMarginLeft(s: Style): number { return s.getMarginLeft() }
export function GetMarginChar(s: Style): string { return s.getMarginChar() }
export function GetMarginBackground(s: Style): ColorType { return s.getMarginBackground() }
export function GetBorderStyle(s: Style): BorderType | null { return s.getBorderStyle() }
export function GetBorderTop(s: Style): boolean { return s.getBorderTop() }
export function GetBorderRight(s: Style): boolean { return s.getBorderRight() }
export function GetBorderBottom(s: Style): boolean { return s.getBorderBottom() }
export function GetBorderLeft(s: Style): boolean { return s.getBorderLeft() }
export function GetBorderTopForeground(s: Style): ColorType { return s.getBorderTopForeground() }
export function GetBorderRightForeground(s: Style): ColorType { return s.getBorderRightForeground() }
export function GetBorderBottomForeground(s: Style): ColorType { return s.getBorderBottomForeground() }
export function GetBorderLeftForeground(s: Style): ColorType { return s.getBorderLeftForeground() }
export function GetBorderTopBackground(s: Style): ColorType { return s.getBorderTopBackground() }
export function GetBorderRightBackground(s: Style): ColorType { return s.getBorderRightBackground() }
export function GetBorderBottomBackground(s: Style): ColorType { return s.getBorderBottomBackground() }
export function GetBorderLeftBackground(s: Style): ColorType { return s.getBorderLeftBackground() }
export function GetBorderForegroundBlend(s: Style): ColorType[] | null { return s.getBorderForegroundBlend() }
export function GetBorderForegroundBlendOffset(s: Style): number { return s.getBorderForegroundBlendOffset() }
export function GetBorderTopSize(s: Style): number { return s.getBorderTopSize() }
export function GetBorderRightSize(s: Style): number { return s.getBorderRightSize() }
export function GetBorderBottomSize(s: Style): number { return s.getBorderBottomSize() }
export function GetBorderLeftSize(s: Style): number { return s.getBorderLeftSize() }
export function GetHorizontalBorderSize(s: Style): number { return s.getHorizontalBorderSize() }
export function GetVerticalBorderSize(s: Style): number { return s.getVerticalBorderSize() }
export function GetHorizontalPadding(s: Style): number { return s.getHorizontalPadding() }
export function GetVerticalPadding(s: Style): number { return s.getVerticalPadding() }
export function GetHorizontalMargins(s: Style): number { return s.getHorizontalMargins() }
export function GetVerticalMargins(s: Style): number { return s.getVerticalMargins() }
export function GetHorizontalFrameSize(s: Style): number { return s.getHorizontalFrameSize() }
export function GetVerticalFrameSize(s: Style): number { return s.getVerticalFrameSize() }
export function GetAlign(s: Style): StylePosition { return s.getAlign() }
export function GetAlignHorizontal(s: Style): StylePosition { return s.getAlignHorizontal() }
export function GetAlignVertical(s: Style): StylePosition { return s.getAlignVertical() }
export function GetTransform(s: Style): ((s: string) => string) | null { return s.getTransform() }
export function GetHyperlink(s: Style): [string, string] { return s.getHyperlink() }
export function GetTabWidth(s: Style): number { return s.getTabWidth() }
export function GetUnderlineStyle(s: Style): UnderlineStyle { return s.getUnderlineStyle() }
export function GetUnderlineColor(s: Style): ColorType { return s.getUnderlineColor() }
export function GetUnderlineSpaces(s: Style): boolean { return s.getUnderlineSpaces() }
export function GetStrikethroughSpaces(s: Style): boolean { return s.getStrikethroughSpaces() }

// ── Combined getters (Go: GetFrameSize, GetBorder) ──
export function GetFrameSize(s: Style): [number, number] {
  return [s.getHorizontalFrameSize(), s.getVerticalFrameSize()]
}
export function GetBorder(s: Style): [BorderType | null, boolean, boolean, boolean, boolean] {
  return [s.getBorderStyle(), s.getBorderTop(), s.getBorderRight(), s.getBorderBottom(), s.getBorderLeft()]
}

// ── IO functions ──
const _writer = new Writer()

export function Print(...args: any[]): void { _writer.print(...args) }
export function Printf(format: string, ...args: any[]): void { _writer.printf(format, ...args) }
export function Println(...args: any[]): void { _writer.println(...args) }
export function Sprint(...args: any[]): string { return _writer.sprint(...args) }
export function Sprintf(format: string, ...args: any[]): string { return _writer.sprintf(format, ...args) }
export function Sprintln(...args: any[]): string { return _writer.sprintln(...args) }
export function Fprint(w: { write(s: string): void }, ...args: any[]): void { w.write(args.map(String).join("")) }
export function Fprintf(w: { write(s: string): void }, format: string, ...args: any[]): void { let i = 0; w.write(format.replace(/%s/g, () => String(args[i++]))) }
export function Fprintln(w: { write(s: string): void }, ...args: any[]): void { w.write(args.map(String).join(" ") + "\n") }

// ── WrapWriter ──
export interface WrapWriter { write(s: string): void; flush(): void }
export function NewWrapWriter(): WrapWriter { let b = ""; return { write(s) { b += s }, flush() { process.stdout.write(b); b = "" } } }

// ── Table data ──
export interface Data { rows(): string[][]; columns(): string[] }
export class StringData implements Data {
  private _rows: string[][]; private _cols: string[]
  constructor(rows: string[][], cols: string[]) { this._rows = rows; this._cols = cols }
  rows(): string[][] { return this._rows }
  columns(): string[] { return this._cols }
  append(row: string[]): void { this._rows.push(row) }
  item(row: number, col: number): string { return this._rows[row]?.[col] ?? "" }
}
export function DataToMatrix(data: Data): string[][] { return data.rows() }
export type FilterFunc = (row: string[]) => boolean
export function NewFilter(fn: FilterFunc): FilterFunc { return fn }
export function Filter(rows: string[][], fn: FilterFunc): string[][] { return rows.filter(fn) }

// ── Aliases for Go API names ──
export { Canvas as NewCanvas } from "./canvas"
export { Compositor as NewCompositor } from "./layer"
export { Layer as NewLayer } from "./layer"
export { Leaf as NewLeaf } from "./tree"

// ── Misc ──
export function DefaultStyles() { return { border: new Style(), bullet: new Style(), enumerator: new Style() } }
export function EnableLegacyWindowsANSI(): void {}
