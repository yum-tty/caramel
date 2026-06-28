// index.ts | Caramel - lipgloss port for Bun

// ── Core exports ──
export { Style, NewStyle, NBSP, NoTabConversion } from "./style"
export type { TextAlign as StylePosition, UnderlineStyle as UnderlineStyleType } from "./style"
export const UnderlineNone = "none" as const
export const UnderlineSingle = "single" as const
export const UnderlineDouble = "double" as const
export const UnderlineCurly = "curly" as const
export const UnderlineDotted = "dotted" as const
export const UnderlineDashed = "dashed" as const
export { getStringWidth, isWideChar, stripAnsi } from "./ansi"
export { type Color, NoColor, Color as ColorFactory, LightDark, Complete, fg, bg, ulColor, reset, bold, dim, italic, underline, blink, reverse, strikethrough, colorToAnsi } from "./color"
export type { CompleteColor, AdaptiveColor, LightDarkFunc, CompleteFunc, ColorProfile } from "./color"
export { borders, getTopSize, getRightSize, getBottomSize, getLeftSize, type BorderStyle, type BorderType } from "./border"
export { Top, Bottom, Center, Left, Right, positionValue } from "./position"
export type { Position } from "./position"
export { JoinHorizontal, JoinVertical } from "./join"
export { Wrap, Truncate, Ellipsize } from "./wrap"
export { Whitespace, WithWhitespaceStyle, WithWhitespaceChars, Place, PlaceHorizontal, PlaceVertical } from "./whitespace"
export type { WhitespaceOption } from "./whitespace"
export { Table, CreateTable, HeaderRow, StringData as TableStringData, NewStringData as TableNewStringData, DataToMatrix as TableDataToMatrix, Filter as TableFilter, NewFilter as NewTableFilter } from "./table"
export type { TableStyleFunc, DataInterface } from "./table"
export { Canvas, ScreenBuffer } from "./canvas"
export type { Cell, Drawable, Screen } from "./canvas"
export { Layer, LayerHit, Compositor } from "./layer"
export type { Rectangle } from "./layer"
export { List, New, Alphabet, Arabic, Roman, Bullet, Asterisk, Dash } from "./list"
export type { Items, Enumerator, ListIndenter } from "./list"
export { Tree, Leaf, Root, NewStringData, DefaultEnumerator, RoundedEnumerator, DefaultIndenter, NodeChildren, Filter as TreeFilter, NewFilter as NewTreeFilter } from "./tree"
export type { Node, Children, StyleFunc, TreeEnumerator, TreeIndenter } from "./tree"
export { Blend1D, Blend2D, Alpha, Complementary, Darken, Lighten, isDarkColor } from "./blending"
export { StyleRanges, NewRange, type Range } from "./ranges"
export { StyleRunes } from "./runes"
export { Writer, Writer_ } from "./writer"
export { BackgroundColor, HasDarkBackground } from "./query"
export { Width as SizeWidth, Height as SizeHeight, Size } from "./size"

// ── Lipgloss-compatible re-exports ──
export {
  Black, Red, Green, Yellow, Blue, Magenta, Cyan, White,
  BrightBlack, BrightRed, BrightGreen, BrightYellow,
  BrightBlue, BrightMagenta, BrightCyan, BrightWhite,
  NormalBorder, RoundedBorder, DoubleBorder, ThickBorder,
  HiddenBorder, BlockBorder, InnerHalfBlockBorder, OuterHalfBlockBorder,
  MarkdownBorder, ASCIIBorder,
  Bold, Italic, Underline, Strikethrough, Reverse, Blink, Faint, Dim,
  Foreground, Background, UnderlineColor, UnderlineStyle,
  Width, Height, MaxWidth, MaxHeight, Padding, Margin, Align,
  Border, Inline, Transform, Hyperlink, TabWidth,
  UnsetBold, UnsetItalic, UnsetUnderline, UnsetStrikethrough,
  UnsetReverse, UnsetBlink, UnsetFaint,
  UnsetForeground, UnsetBackground, UnsetUnderlineColor,
  UnsetWidth, UnsetHeight, UnsetMaxWidth, UnsetMaxHeight,
  UnsetPadding, UnsetMargins, UnsetAlign, UnsetBorderStyle,
  UnsetInline, UnsetTransform, UnsetHyperlink, UnsetTabWidth, UnsetString, UnsetColorWhitespace,
  Print, Printf, Println, Sprint, Sprintf, Sprintln,
  Fprint, Fprintf, Fprintln,
  GetWidth, GetHeight, GetMaxWidth, GetMaxHeight,
  GetForeground, GetBackground, GetBold, GetItalic,
  GetUnderline, GetStrikethrough, GetReverse, GetBlink, GetFaint,
  GetInline, GetPadding, GetPaddingTop, GetPaddingRight,
  GetPaddingBottom, GetPaddingLeft, GetPaddingChar,
  GetMargin, GetMarginTop, GetMarginRight, GetMarginBottom,
  GetMarginLeft, GetMarginChar, GetMarginBackground,
  GetBorderStyle, GetBorderTop, GetBorderRight, GetBorderBottom, GetBorderLeft,
  GetBorderTopForeground, GetBorderRightForeground, GetBorderBottomForeground, GetBorderLeftForeground,
  GetBorderTopBackground, GetBorderRightBackground, GetBorderBottomBackground, GetBorderLeftBackground,
  GetBorderForegroundBlend, GetBorderForegroundBlendOffset,
  GetBorderTopSize, GetBorderRightSize, GetBorderBottomSize, GetBorderLeftSize,
  GetHorizontalBorderSize, GetVerticalBorderSize,
  GetHorizontalPadding, GetVerticalPadding,
  GetHorizontalMargins, GetVerticalMargins,
  GetHorizontalFrameSize, GetVerticalFrameSize,
  GetAlign, GetAlignHorizontal, GetAlignVertical,
  GetTransform, GetHyperlink, GetTabWidth,
  GetUnderlineStyle, GetUnderlineColor, GetUnderlineSpaces, GetStrikethroughSpaces,
  GetFrameSize, GetBorder, GetColorWhitespace,
  DefaultStyles, NewWrapWriter, EnableLegacyWindowsANSI,
  NewCanvas, NewCompositor, NewLayer, NewLeaf,
  Render,
} from "./compat"

export type { RGBColor, ANSIColor, WrapWriter, Data, FilterFunc } from "./compat"
