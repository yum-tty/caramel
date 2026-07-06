import { describe, test, expect } from "bun:test"
import {
  // Core
  Style, NewStyle, NBSP, NoTabConversion,
  // ANSI
  getStringWidth, charDisplayWidth, isWideChar, stripAnsi,
  // Colors
  NoColor, fg, bg, colorToAnsi, ColorFactory,
  // Position
  Top, Bottom, Center, Left, Right, positionValue,
  // Join
  JoinHorizontal, JoinVertical,
  // Wrap
  Wrap, Truncate, Ellipsize,
  // Whitespace / Place
  Place, PlaceHorizontal, PlaceVertical, Whitespace, type WhitespaceConfig,
  // Table
  Table, CreateTable, HeaderRow,
  // Canvas / ScreenBuffer
  Canvas, ScreenBuffer,
  // Layer / Compositor
  Layer, Compositor, LayerHit,
  // Tree
  Tree, Leaf, Root, NewStringData as TreeNewStringData, DefaultEnumerator, RoundedEnumerator, DefaultIndenter, NodeChildren,
  // List
  List, New, Bullet, Asterisk, Dash, Alphabet, Arabic, Roman,
  // Blending
  Blend1D, Blend2D, Alpha, Complementary, Darken, Lighten, isDarkColor,
  // Ranges / Runes
  StyleRanges, NewRange, StyleRunes,
  // Borders
  borders, BorderType, NormalBorder, RoundedBorder, DoubleBorder, ThickBorder, HiddenBorder, BlockBorder, MarkdownBorder, ASCIIBorder,
  // Size
  SizeWidth, SizeHeight, Size,
  // Query (Profile only - terminal queries require interactive terminal)
  Profile,
} from "./index"

// Helper: strip ANSI codes for plain-text comparisons
function plain(s: string): string {
  return stripAnsi(s)
}

// ═══════════════════════════════════════════════════════════════
// 1. Style basics
// ═══════════════════════════════════════════════════════════════

describe("Style basics", () => {
  test("NewStyle creates a fresh style", () => {
    const s = NewStyle()
    expect(s).toBeInstanceOf(Style)
    expect(s.render("hello")).toBe("hello")
  })

  test("style.render() with no styles returns plain text", () => {
    const s = NewStyle()
    expect(s.render("hello")).toBe("hello")
    expect(s.render("")).toBe("")
  })

  test("style.bold(true) applies bold ANSI", () => {
    const s = NewStyle().bold(true)
    expect(s.render("hi")).toContain("\x1b[1m")
    expect(s.getBold()).toBe(true)
  })

  test("style.bold(false) removes bold", () => {
    const s = NewStyle().bold(true).bold(false)
    expect(s.render("hi")).not.toContain("\x1b[1m")
    expect(s.getBold()).toBe(false)
  })

  test("style.italic()", () => {
    const s = NewStyle().italic(true)
    expect(s.render("hi")).toContain("\x1b[3m")
    expect(s.getItalic()).toBe(true)
  })

  test("style.underline()", () => {
    const s = NewStyle().underline(true)
    expect(s.render("hi")).toContain("\x1b[4m")
    expect(s.getUnderline()).toBe(true)
  })

  test("style.underlineStyle('curly')", () => {
    const s = NewStyle().underlineStyle("curly")
    expect(s.render("hi")).toContain("\x1b[4:3m")
    expect(s.getUnderlineStyle()).toBe("curly")
  })

  test("style.strikethrough()", () => {
    const s = NewStyle().strikethrough(true)
    expect(s.render("hi")).toContain("\x1b[9m")
    expect(s.getStrikethrough()).toBe(true)
  })

  test("style.reverse()", () => {
    const s = NewStyle().reverse(true)
    expect(s.render("hi")).toContain("\x1b[7m")
    expect(s.getReverse()).toBe(true)
  })

  test("style.blink()", () => {
    const s = NewStyle().blink(true)
    expect(s.render("hi")).toContain("\x1b[5m")
    expect(s.getBlink()).toBe(true)
  })

  test("style.faint/dim()", () => {
    const s = NewStyle().dim(true)
    expect(s.render("hi")).toContain("\x1b[2m")
    expect(s.getFaint()).toBe(true)
  })

  test("style.foreground() sets fg color", () => {
    const s = NewStyle().foreground("#ff0000")
    expect(s.getForeground()).toBe("#ff0000")
    expect(s.render("hi")).toContain("\x1b[")
  })

  test("style.background() sets bg color", () => {
    const s = NewStyle().background("#00ff00")
    expect(s.getBackground()).toBe("#00ff00")
    expect(s.render("hi")).toContain("\x1b[")
  })

  test("style.transform() transforms text", () => {
    const s = NewStyle().transform((s) => s.toUpperCase())
    expect(s.render("hello")).toBe("HELLO")
  })

  test("style.hyperlink() wraps text in OSC 8", () => {
    const s = NewStyle().hyperlink("https://example.com")
    const out = s.render("click")
    expect(out).toContain("\x1b]8;;https://example.com\x07")
    expect(out).toContain("click")
  })

  test("style.setString() and render with stored value", () => {
    const s = NewStyle().setString("stored")
    expect(s.value()).toBe("stored")
    expect(s.render()).toBe("stored")
    expect(s.render("extra")).toBe("stored extra")
  })

  test("style.inline() strips newlines", () => {
    const s = NewStyle().inline(true)
    // inline renders without styling, just concatenates lines
    const out = plain(s.render("a\nb\nc"))
    expect(out).toBe("abc")
  })

  test("style.tabWidth() controls tab expansion", () => {
    const s1 = NewStyle().tabWidth(2)
    expect(s1.render("a\tb")).toBe("a  b")
    const s2 = NewStyle().tabWidth(0)
    expect(s2.render("a\tb")).toBe("ab")
  })

  test("Style immutable - chaining does not mutate original", () => {
    const s1 = NewStyle()
    const s2 = s1.bold(true)
    expect(s1.getBold()).toBe(false)
    expect(s2.getBold()).toBe(true)
  })

  test("style.inherit() fills unset fields from parent", () => {
    const parent = NewStyle().bold(true).foreground("#ff0000").width(42)
    const child = NewStyle().italic(true)
    const inherited = child.inherit(parent)
    expect(inherited.getBold()).toBe(true)
    expect(inherited.getItalic()).toBe(true)
    expect(inherited.getForeground()).toBe("#ff0000")
    expect(inherited.getWidth()).toBe(42)
  })

  test("style.inherit() does not override already-set fields", () => {
    const parent = NewStyle().foreground("#ff0000")
    const child = NewStyle().foreground("#00ff00")
    const inherited = child.inherit(parent)
    expect(inherited.getForeground()).toBe("#00ff00")
  })

  test("style.width() and style.height() set dimensions", () => {
    const s = NewStyle().width(20).height(5)
    expect(s.getWidth()).toBe(20)
    expect(s.getHeight()).toBe(5)
  })

  test("style.maxWidth() and style.maxHeight()", () => {
    const s = NewStyle().maxWidth(30).maxHeight(10)
    expect(s.getMaxWidth()).toBe(30)
    expect(s.getMaxHeight()).toBe(10)
  })

  test("Style.width() static method returns string width", () => {
    expect(Style.width("hello")).toBe(5)
    expect(Style.width("")).toBe(0)
  })

  test("Style.height() static method returns line count", () => {
    expect(Style.height("a\nb\nc")).toBe(3)
    expect(Style.height("single")).toBe(1)
  })

  test("unsetters work correctly", () => {
    const s = NewStyle().bold(true).italic(true).foreground("#ff0000")
      .unsetBold().unsetItalic().unsetForeground()
    expect(s.getBold()).toBe(false)
    expect(s.getItalic()).toBe(false)
    expect(s.getForeground()).toBe(null)
  })

  test("colorWhitespace() controls whitespace styling", () => {
    const s = NewStyle().background("#ff0000").colorWhitespace(true)
    expect(s.getColorWhitespace()).toBe(true)
    const s2 = s.colorWhitespace(false)
    expect(s2.getColorWhitespace()).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════
// 2. Padding
// ═══════════════════════════════════════════════════════════════

describe("Padding", () => {
  test("padding(1) applies uniform padding", () => {
    const s = NewStyle().padding(1)
    const out = s.render("hi")
    const lines = out.split("\n")
    expect(lines.length).toBe(3) // 1 top + content + 1 bottom
    // Content line should be padded left and right
    expect(plain(lines[1]!)).toBe(" hi ")
  })

  test("padding(1, 2) applies vertical=1, horizontal=2", () => {
    const s = NewStyle().padding(1, 2)
    expect(s.getPaddingTop()).toBe(1)
    expect(s.getPaddingBottom()).toBe(1)
    expect(s.getPaddingLeft()).toBe(2)
    expect(s.getPaddingRight()).toBe(2)
  })

  test("padding(1, 2, 3) applies top=1, sides=2, bottom=3", () => {
    const s = NewStyle().padding(1, 2, 3)
    expect(s.getPaddingTop()).toBe(1)
    expect(s.getPaddingRight()).toBe(2)
    expect(s.getPaddingLeft()).toBe(2)
    expect(s.getPaddingBottom()).toBe(3)
  })

  test("padding(1, 2, 3, 4) applies each side", () => {
    const s = NewStyle().padding(1, 2, 3, 4)
    expect(s.getPadding()).toEqual([1, 2, 3, 4])
  })

  test("individual padding sides", () => {
    const s = NewStyle().paddingTop(5).paddingRight(6).paddingBottom(7).paddingLeft(8)
    expect(s.getPaddingTop()).toBe(5)
    expect(s.getPaddingRight()).toBe(6)
    expect(s.getPaddingBottom()).toBe(7)
    expect(s.getPaddingLeft()).toBe(8)
  })

  test("getHorizontalPadding and getVerticalPadding", () => {
    const s = NewStyle().padding(2, 3)
    expect(s.getHorizontalPadding()).toBe(6)
    expect(s.getVerticalPadding()).toBe(4)
  })

  test("paddingChar() sets the padding character", () => {
    const s = NewStyle().padding(1).paddingChar(".")
    expect(s.getPaddingChar()).toBe(".")
  })

  test("unsetPadding() resets all padding", () => {
    const s = NewStyle().padding(5).unsetPadding()
    expect(s.getPaddingTop()).toBe(0)
    expect(s.getPaddingRight()).toBe(0)
    expect(s.getPaddingBottom()).toBe(0)
    expect(s.getPaddingLeft()).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 3. Margins
// ═══════════════════════════════════════════════════════════════

describe("Margins", () => {
  test("margin(1) applies uniform margin", () => {
    const s = NewStyle().margin(1)
    const out = s.render("hi")
    const lines = out.split("\n")
    expect(lines.length).toBe(3) // 1 top margin + content row + 1 bottom margin
    // Content row should have left and right margin chars
    expect(plain(lines[1]!)).toBe(" hi ")
  })

  test("margin(1, 2) vertical=1, horizontal=2", () => {
    const s = NewStyle().margin(1, 2)
    expect(s.getMarginTop()).toBe(1)
    expect(s.getMarginBottom()).toBe(1)
    expect(s.getMarginLeft()).toBe(2)
    expect(s.getMarginRight()).toBe(2)
  })

  test("margin(1, 2, 3, 4) each side", () => {
    const s = NewStyle().margin(1, 2, 3, 4)
    expect(s.getMargin()).toEqual([1, 2, 3, 4])
  })

  test("individual margin sides", () => {
    const s = NewStyle().marginTop(1).marginRight(2).marginBottom(3).marginLeft(4)
    expect(s.getMarginTop()).toBe(1)
    expect(s.getMarginRight()).toBe(2)
    expect(s.getMarginBottom()).toBe(3)
    expect(s.getMarginLeft()).toBe(4)
  })

  test("getHorizontalMargins and getVerticalMargins", () => {
    const s = NewStyle().margin(3, 5)
    expect(s.getHorizontalMargins()).toBe(10)
    expect(s.getVerticalMargins()).toBe(6)
  })

  test("marginChar() sets the margin character", () => {
    const s = NewStyle().margin(1).marginChar("#")
    expect(s.getMarginChar()).toBe("#")
  })

  test("unsetMargins() resets all margins", () => {
    const s = NewStyle().margin(5).unsetMargins()
    expect(s.getMarginTop()).toBe(0)
    expect(s.getMarginRight()).toBe(0)
    expect(s.getMarginBottom()).toBe(0)
    expect(s.getMarginLeft()).toBe(0)
  })

  test("marginBackground() sets margin background", () => {
    const s = NewStyle().marginBackground("#ff0000")
    expect(s.getMarginBackground()).toBe("#ff0000")
  })
})

// ═══════════════════════════════════════════════════════════════
// 4. Borders
// ═══════════════════════════════════════════════════════════════

describe("Borders", () => {
  test("NormalBorder has correct characters", () => {
    const b = NormalBorder()!
    expect(b.topLeft).toBe("┌")
    expect(b.topRight).toBe("┐")
    expect(b.bottomLeft).toBe("└")
    expect(b.bottomRight).toBe("┘")
    expect(b.top).toBe("─")
    expect(b.left).toBe("│")
  })

  test("RoundedBorder has rounded corners", () => {
    const b = RoundedBorder()!
    expect(b.topLeft).toBe("╭")
    expect(b.topRight).toBe("╮")
    expect(b.bottomLeft).toBe("╰")
    expect(b.bottomRight).toBe("╯")
  })

  test("ThickBorder uses thick lines", () => {
    const b = ThickBorder()!
    expect(b.top).toBe("━")
    expect(b.left).toBe("┃")
    expect(b.topLeft).toBe("┏")
  })

  test("DoubleBorder uses double lines", () => {
    const b = DoubleBorder()!
    expect(b.top).toBe("═")
    expect(b.left).toBe("║")
    expect(b.topLeft).toBe("╔")
  })

  test("HiddenBorder uses spaces", () => {
    const b = HiddenBorder()!
    expect(b.top).toBe(" ")
    expect(b.left).toBe(" ")
  })

  test("BlockBorder uses full blocks", () => {
    const b = BlockBorder()!
    expect(b.top).toBe("\u2588")
  })

  test("MarkdownBorder uses markdown chars", () => {
    const b = MarkdownBorder()!
    expect(b.top).toBe("-")
    expect(b.left).toBe("|")
  })

  test("ASCIIBorder uses ascii chars", () => {
    const b = ASCIIBorder()!
    expect(b.top).toBe("-")
    expect(b.topLeft).toBe("+")
  })

  test("style.border('rounded') renders with rounded border", () => {
    const s = NewStyle().border(BorderType.Rounded)
    const out = s.render("hi")
    expect(out).toContain("╭")
    expect(out).toContain("╮")
    expect(out).toContain("╰")
    expect(out).toContain("╯")
    expect(out).toContain("─")
    expect(out).toContain("│")
  })

  test("style.border('normal') renders with normal border", () => {
    const s = NewStyle().border(BorderType.Normal)
    const out = s.render("hi")
    expect(out).toContain("┌")
    expect(out).toContain("┐")
    expect(out).toContain("└")
    expect(out).toContain("┘")
  })

  test("style.border() with sides", () => {
    const s = NewStyle().border(BorderType.Normal, true, false, true, false)
    expect(s.getBorderTop()).toBe(true)
    expect(s.getBorderRight()).toBe(false)
    expect(s.getBorderBottom()).toBe(true)
    expect(s.getBorderLeft()).toBe(false)
  })

  test("borderStyle setter", () => {
    const s = NewStyle().borderStyle(RoundedBorder()!)
    expect(s.getBorderStyle()).toBe(RoundedBorder()!)
  })

  test("borderForeground and borderColor", () => {
    const s = NewStyle().border(BorderType.Normal).borderColor("#ff0000")
    expect(s.getBorderTopForeground()).toBe("#ff0000")
    expect(s.getBorderRightForeground()).toBe("#ff0000")
    expect(s.getBorderBottomForeground()).toBe("#ff0000")
    expect(s.getBorderLeftForeground()).toBe("#ff0000")
  })

  test("unsetBorderStyle removes border", () => {
    const s = NewStyle().border(BorderType.Normal).unsetBorderStyle()
    expect(s.getBorderStyle()).toBe(null)
  })

  test("border sizes", () => {
    const s = NewStyle().border(BorderType.Normal)
    expect(s.getBorderTopSize()).toBe(1)
    expect(s.getBorderRightSize()).toBe(1)
    expect(s.getBorderBottomSize()).toBe(1)
    expect(s.getBorderLeftSize()).toBe(1)
    expect(s.getHorizontalBorderSize()).toBe(2)
    expect(s.getVerticalBorderSize()).toBe(2)
  })
})

// ═══════════════════════════════════════════════════════════════
// 5. Alignment
// ═══════════════════════════════════════════════════════════════

describe("Alignment", () => {
  test("align('left') left-aligns text in width", () => {
    const s = NewStyle().width(10).align("left")
    const out = plain(s.render("hi"))
    // Should have "hi" followed by spaces
    expect(out).toMatch(/^hi\s+$/)
    expect(getStringWidth(out)).toBe(10)
  })

  test("align('center') centers text in width", () => {
    const s = NewStyle().width(10).align("center")
    const out = plain(s.render("hi"))
    expect(getStringWidth(out)).toBe(10)
    // "hi" should be roughly centered
    const hiIdx = out.indexOf("hi")
    expect(hiIdx).toBeGreaterThanOrEqual(3)
    expect(hiIdx).toBeLessThanOrEqual(5)
  })

  test("align('right') right-aligns text in width", () => {
    const s = NewStyle().width(10).align("right")
    const out = plain(s.render("hi"))
    // Should have spaces then "hi"
    expect(out).toMatch(/^\s+hi$/)
    expect(getStringWidth(out)).toBe(10)
  })

  test("alignHorizontal and alignVertical", () => {
    const s = NewStyle().alignHorizontal("center").alignVertical("right")
    expect(s.getAlignHorizontal()).toBe("center")
    expect(s.getAlignVertical()).toBe("right")
  })

  test("unsetAlign resets to left", () => {
    const s = NewStyle().align("center").unsetAlign()
    expect(s.getAlignHorizontal()).toBe("left")
    expect(s.getAlignVertical()).toBe("left")
  })
})

// ═══════════════════════════════════════════════════════════════
// 6. Colors
// ═══════════════════════════════════════════════════════════════

describe("Colors", () => {
  test("fg() with hex color returns ANSI escape", () => {
    const result = fg("#ff0000")
    expect(result).toContain("\x1b[")
    expect(result).toContain("38;2;255;0;0")
  })

  test("bg() with hex color returns ANSI escape", () => {
    const result = bg("#00ff00")
    expect(result).toContain("\x1b[")
    expect(result).toContain("48;2;0;255;0")
  })

  test("fg() with null returns empty", () => {
    expect(fg(null)).toBe("")
  })

  test("bg() with null returns empty", () => {
    expect(bg(null)).toBe("")
  })

  test("colorToAnsi with hex string", () => {
    const result = colorToAnsi("#0000ff", "38")
    expect(result).toBe("38;2;0;0;255")
  })

  test("colorToAnsi with {ansi: n}", () => {
    const result = colorToAnsi({ ansi: 1 }, "38")
    expect(result).toBe("31")
  })

  test("colorToAnsi with {ansi256: n}", () => {
    const result = colorToAnsi({ ansi256: 200 }, "38")
    expect(result).toBe("38;5;200")
  })

  test("colorToAnsi with number (RGB)", () => {
    const result = colorToAnsi(0xff0000, "38")
    expect(result).toContain("38;2;255;0;0")
  })

  test("NoColor is null", () => {
    expect(NoColor).toBe(null)
  })
})

// ═══════════════════════════════════════════════════════════════
// 7. getStringWidth
// ═══════════════════════════════════════════════════════════════

describe("getStringWidth", () => {
  test("ASCII string width", () => {
    expect(getStringWidth("hello")).toBe(5)
    expect(getStringWidth("")).toBe(0)
    expect(getStringWidth("a")).toBe(1)
  })

  test("CJK characters are width 2", () => {
    expect(getStringWidth("你好")).toBe(4)
    expect(getStringWidth("你")).toBe(2)
  })

  test("mixed ASCII and CJK", () => {
    expect(getStringWidth("hi你好")).toBe(6) // 2 + 4
  })

  test("ANSI codes are stripped from width", () => {
    expect(getStringWidth("\x1b[1mhello\x1b[0m")).toBe(5)
  })
})

// ═══════════════════════════════════════════════════════════════
// 8. charDisplayWidth
// ═══════════════════════════════════════════════════════════════

describe("charDisplayWidth", () => {
  test("ASCII char is width 1", () => {
    expect(charDisplayWidth("a")).toBe(1)
  })

  test("CJK char is width 2", () => {
    expect(charDisplayWidth("你")).toBe(2)
  })

  test("empty string returns 0", () => {
    expect(charDisplayWidth("")).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 9. isWideChar
// ═══════════════════════════════════════════════════════════════

describe("isWideChar", () => {
  test("CJK chars are wide", () => {
    expect(isWideChar("你".codePointAt(0)!)).toBe(true)
    expect(isWideChar("日".codePointAt(0)!)).toBe(true)
  })

  test("ASCII chars are not wide", () => {
    expect(isWideChar("a".codePointAt(0)!)).toBe(false)
    expect(isWideChar("0".codePointAt(0)!)).toBe(false)
  })

  test("Korean Hangul is wide", () => {
    expect(isWideChar(0xAC00)).toBe(true)
  })

  test("emoji range (U+1F000) is wide", () => {
    expect(isWideChar(0x1F000)).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════
// 10. stripAnsi
// ═══════════════════════════════════════════════════════════════

describe("stripAnsi", () => {
  test("removes SGR sequences", () => {
    expect(stripAnsi("\x1b[1mhello\x1b[0m")).toBe("hello")
  })

  test("removes multiple SGR sequences", () => {
    expect(stripAnsi("\x1b[1;31mred bold\x1b[0m")).toBe("red bold")
  })

  test("removes OSC sequences", () => {
    expect(stripAnsi("\x1b]8;;url\x07text\x1b]8;;\x07")).toBe("text")
  })

  test("plain text unchanged", () => {
    expect(stripAnsi("hello world")).toBe("hello world")
  })
})

// ═══════════════════════════════════════════════════════════════
// 11. JoinHorizontal / JoinVertical
// ═══════════════════════════════════════════════════════════════

describe("JoinHorizontal", () => {
  test("joins two strings side by side", () => {
    const result = JoinHorizontal(Top, "aa", "bb")
    expect(result).toBe("aabb")
  })

  test("joins strings of different heights padded at top", () => {
    const result = JoinHorizontal(Top, "a\nb", "c")
    const lines = result.split("\n")
    expect(lines[0]).toBe("ac")
    expect(lines[1]).toBe("b ")
  })

  test("single string returns as-is", () => {
    expect(JoinHorizontal(Top, "hello")).toBe("hello")
  })

  test("empty returns empty", () => {
    expect(JoinHorizontal(Top)).toBe("")
  })
})

describe("JoinVertical", () => {
  test("joins strings vertically", () => {
    const result = JoinVertical(Left, "aa", "bb")
    expect(result).toBe("aa\nbb")
  })

  test("pads to max width", () => {
    const result = JoinVertical(Left, "a", "bb")
    const lines = result.split("\n")
    expect(lines[0]).toBe("a ")
    expect(lines[1]).toBe("bb")
  })

  test("right alignment pads left side", () => {
    const result = JoinVertical(Right, "a", "bb")
    const lines = result.split("\n")
    expect(lines[0]).toBe(" a")
    expect(lines[1]).toBe("bb")
  })

  test("single string returns as-is", () => {
    expect(JoinVertical(Left, "hello")).toBe("hello")
  })
})

// ═══════════════════════════════════════════════════════════════
// 12. Wrap / Truncate / Ellipsize
// ═══════════════════════════════════════════════════════════════

describe("Wrap", () => {
  test("wraps long text at width", () => {
    const result = Wrap("hello world foo bar", 10)
    const lines = result.split("\n")
    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) {
      expect(getStringWidth(line)).toBeLessThanOrEqual(10)
    }
  })

  test("short text not wrapped", () => {
    expect(Wrap("hi", 10)).toBe("hi")
  })

  test("width <= 0 returns original", () => {
    expect(Wrap("hello", 0)).toBe("hello")
    expect(Wrap("hello", -1)).toBe("hello")
  })
})

describe("Truncate", () => {
  test("truncates long text with ellipsis", () => {
    const result = Truncate("hello world", 8)
    expect(result).toContain("\u2026")
    expect(getStringWidth(result)).toBeLessThanOrEqual(8)
  })

  test("short text not truncated", () => {
    expect(Truncate("hi", 10)).toBe("hi")
  })

  test("custom tail", () => {
    const result = Truncate("hello world", 8, "...")
    expect(result).toContain("...")
  })
})

describe("Ellipsize", () => {
  test("truncates with default ellipsis", () => {
    const result = Ellipsize("hello world", 8)
    expect(result).toContain("\u2026")
  })
})

// ═══════════════════════════════════════════════════════════════
// 13. Place / PlaceHorizontal / PlaceVertical
// ═══════════════════════════════════════════════════════════════

describe("PlaceHorizontal", () => {
  test("places text left-aligned", () => {
    const result = PlaceHorizontal(10, Left, "hi")
    expect(plain(result)).toBe("hi        ")
  })

  test("places text right-aligned", () => {
    const result = PlaceHorizontal(10, Right, "hi")
    expect(plain(result)).toBe("        hi")
  })

  test("places text center-aligned", () => {
    const result = PlaceHorizontal(10, Center, "hi")
    expect(plain(result)).toBe("    hi    ")
  })
})

describe("PlaceVertical", () => {
  test("places text top-aligned", () => {
    const result = PlaceVertical(3, Top, "hi")
    const lines = result.split("\n")
    expect(lines[0]).toBe("hi")
    expect(lines.length).toBe(3)
  })

  test("places text bottom-aligned", () => {
    const result = PlaceVertical(3, Bottom, "hi")
    const lines = result.split("\n")
    expect(lines[2]).toBe("hi")
    expect(lines.length).toBe(3)
  })
})

describe("Place", () => {
  test("combines horizontal and vertical placement", () => {
    const result = Place(10, 3, Center, Center, "hi")
    const lines = result.split("\n")
    expect(lines.length).toBe(3)
    expect(lines[1]).toContain("hi")
  })
})

// ═══════════════════════════════════════════════════════════════
// 14. StyleRunes / StyleRanges
// ═══════════════════════════════════════════════════════════════

describe("StyleRunes", () => {
  test("styles specific rune indices with plain styles (no colors)", () => {
    const s = NewStyle().bold(true)
    const result = StyleRunes("abc", [0, 2], s)
    // Should contain bold ANSI code
    expect(result).toContain("\x1b[1m")
    // Should contain all original characters
    expect(plain(result)).toBe("abc")
  })

  test("with unmatched style", () => {
    const matched = NewStyle().bold(true)
    const unmatched = NewStyle().italic(true)
    const result = StyleRunes("abc", [1], matched, unmatched)
    expect(result).toContain("\x1b[1m") // bold for matched
    expect(result).toContain("\x1b[3m") // italic for unmatched
    expect(plain(result)).toBe("abc")
  })

  test("empty indices returns plain text", () => {
    const s = NewStyle().bold(true)
    const result = StyleRunes("abc", [], s)
    expect(plain(result)).toBe("abc")
  })
})

describe("StyleRanges", () => {
  test("styles a range of text with plain styles (no colors)", () => {
    const s = NewStyle().bold(true)
    const range = NewRange(1, 3, s)
    const result = StyleRanges("hello", range)
    expect(result).toContain("\x1b[1m") // bold ANSI present
    expect(plain(result)).toBe("hello")
  })

  test("no ranges returns plain text", () => {
    expect(StyleRanges("hello")).toBe("hello")
  })

  test("multiple ranges with plain styles", () => {
    const bold = NewStyle().bold(true)
    const italic = NewStyle().italic(true)
    const result = StyleRanges("hello", NewRange(0, 2, bold), NewRange(3, 5, italic))
    expect(result).toContain("\x1b[1m") // bold
    expect(result).toContain("\x1b[3m") // italic
    expect(plain(result)).toBe("hello")
  })
})

// ═══════════════════════════════════════════════════════════════
// 15. Blend1D / Blend2D
// ═══════════════════════════════════════════════════════════════

describe("Blend1D", () => {
  test("returns gradient between two colors", () => {
    const result = Blend1D(5, "#ff0000", "#0000ff")
    expect(result.length).toBe(5)
    expect(result[0]).toBe("#ff0000")
    expect(result[4]).toBe("#0000ff")
  })

  test("single color repeated", () => {
    const result = Blend1D(3, "#ff0000")
    expect(result).toEqual(["#ff0000", "#ff0000", "#ff0000"])
  })

  test("empty colors returns empty", () => {
    expect(Blend1D(5)).toEqual([])
  })

  test("steps <= 0 returns empty", () => {
    expect(Blend1D(0, "#ff0000")).toEqual([])
  })

  test("three colors creates multi-segment gradient", () => {
    const result = Blend1D(6, "#ff0000", "#00ff00", "#0000ff")
    expect(result.length).toBe(6)
    expect(result[0]).toBe("#ff0000")
    expect(result[5]).toBe("#0000ff")
  })
})

describe("Blend2D", () => {
  test("returns 2D grid of colors", () => {
    const result = Blend2D(3, 3, 0, "#ff0000", "#0000ff")
    expect(result.length).toBe(3)
    expect(result[0]!.length).toBe(3)
  })

  test("single color fills grid", () => {
    const result = Blend2D(2, 2, 0, "#ff0000")
    expect(result).toEqual([
      ["#ff0000", "#ff0000"],
      ["#ff0000", "#ff0000"],
    ])
  })

  test("width/height < 1 are clamped", () => {
    const result = Blend2D(0, 0, 0, "#ff0000")
    expect(result.length).toBe(1)
    expect(result[0]!.length).toBe(1)
  })
})

describe("Blending utilities", () => {
  test("Darken reduces brightness", () => {
    const dark = Darken("#ffffff", 0.5)
    expect(dark).not.toBe("#ffffff")
  })

  test("Lighten increases brightness", () => {
    const light = Lighten("#000000", 0.5)
    expect(light).not.toBe("#000000")
  })

  test("Complementary returns opposite hue", () => {
    const comp = Complementary("#ff0000")
    expect(comp).not.toBe("#ff0000")
  })

  test("isDarkColor detects dark colors", () => {
    expect(isDarkColor("#000000")).toBe(true)
    expect(isDarkColor("#ffffff")).toBe(false)
  })

  test("Alpha wraps color with alpha", () => {
    const result = Alpha("#ff0000", 0.5)
    expect(result).toBeDefined()
  })
})

// ═══════════════════════════════════════════════════════════════
// 16. Canvas / ScreenBuffer
// ═══════════════════════════════════════════════════════════════

describe("Canvas", () => {
  test("creates canvas with dimensions", () => {
    const c = new Canvas(10, 5)
    expect(c.width()).toBe(10)
    expect(c.height()).toBe(5)
  })

  test("setCell and cellAt", () => {
    const c = new Canvas(3, 3)
    c.setCell(1, 1, { char: "X", width: 1, style: "" })
    const cell = c.cellAt(1, 1)
    expect(cell).not.toBeNull()
    expect(cell!.char).toBe("X")
  })

  test("cellAt returns null for out of bounds", () => {
    const c = new Canvas(3, 3)
    expect(c.cellAt(-1, 0)).toBeNull()
    expect(c.cellAt(3, 0)).toBeNull()
    expect(c.cellAt(0, 3)).toBeNull()
  })

  test("clear resets all cells", () => {
    const c = new Canvas(2, 2)
    c.setCell(0, 0, { char: "X", width: 1, style: "" })
    c.clear()
    expect(c.cellAt(0, 0)).toBeNull()
  })

  test("resize preserves existing cells", () => {
    const c = new Canvas(2, 2)
    c.setCell(0, 0, { char: "A", width: 1, style: "" })
    c.resize(4, 4)
    expect(c.cellAt(0, 0)!.char).toBe("A")
    expect(c.width()).toBe(4)
    expect(c.height()).toBe(4)
  })

  test("render produces text output", () => {
    const c = new Canvas(3, 2)
    c.setCell(0, 0, { char: "H", width: 1, style: "" })
    c.setCell(1, 0, { char: "i", width: 1, style: "" })
    const out = c.render()
    expect(out).toContain("Hi")
  })

  test("bounds returns correct rectangle", () => {
    const c = new Canvas(5, 3)
    const b = c.bounds()
    expect(b.minX).toBe(0)
    expect(b.minY).toBe(0)
    expect(b.maxX).toBe(5)
    expect(b.maxY).toBe(3)
  })

  test("compose draws a drawable", () => {
    const c = new Canvas(5, 5)
    const canvas2 = new Canvas(2, 2)
    canvas2.setCell(0, 0, { char: "A", width: 1, style: "" })
    canvas2.setCell(1, 0, { char: "B", width: 1, style: "" })
    c.compose(canvas2)
    expect(c.cellAt(0, 0)!.char).toBe("A")
    expect(c.cellAt(1, 0)!.char).toBe("B")
  })
})

describe("ScreenBuffer", () => {
  test("basic operations", () => {
    const s = new ScreenBuffer(4, 3)
    expect(s.width()).toBe(4)
    expect(s.height()).toBe(3)

    s.setCell(2, 1, { char: "Z", width: 1, style: "" })
    expect(s.cellAt(2, 1)!.char).toBe("Z")

    s.clear()
    expect(s.cellAt(2, 1)).toBeNull()
  })

  test("render with styled cells", () => {
    const s = new ScreenBuffer(2, 1)
    s.setCell(0, 0, { char: "A", width: 1, style: "\x1b[1m" })
    s.setCell(1, 0, { char: "B", width: 1, style: "" })
    const out = s.render()
    expect(out).toContain("A")
    expect(out).toContain("B")
  })
})

// ═══════════════════════════════════════════════════════════════
// 17. Layer / Compositor
// ═══════════════════════════════════════════════════════════════

describe("Layer", () => {
  test("creates layer with content", () => {
    const l = new Layer("hello")
    expect(l.getContent()).toBe("hello")
  })

  test("position setters and getters", () => {
    const l = new Layer().x(5).y(10).z(2)
    expect(l.getX()).toBe(5)
    expect(l.getY()).toBe(10)
    expect(l.getZ()).toBe(2)
  })

  test("id setter and getLayer", () => {
    const parent = new Layer()
    const child = new Layer("content").id("child1")
    parent.addLayers(child)
    expect(parent.getLayer("child1")).toBe(child)
    expect(parent.getLayer("")).toBeNull()
  })

  test("maxZ returns highest z in tree", () => {
    const l = new Layer().z(3).addLayers(new Layer().z(5))
    expect(l.maxZ()).toBe(5)
  })
})

describe("Compositor", () => {
  test("creates compositor with layers", () => {
    const l1 = new Layer("hi").x(0).y(0)
    const l2 = new Layer("bye").x(5).y(0)
    const c = new Compositor(l1, l2)
    expect(c.bounds()).toBeDefined()
  })

  test("render outputs combined content", () => {
    const l1 = new Layer("AB").x(0).y(0)
    const c = new Compositor(l1)
    const out = c.render()
    expect(plain(out)).toContain("AB")
  })

  test("hit test finds layer by id", () => {
    const l = new Layer("X").x(0).y(0).id("target")
    const c = new Compositor(l)
    const hit = c.hit(0, 0)
    expect(hit.empty()).toBe(false)
    expect(hit.id()).toBe("target")
  })

  test("hit test returns empty for miss", () => {
    const l = new Layer("X").x(0).y(0).id("target")
    const c = new Compositor(l)
    const hit = c.hit(100, 100)
    expect(hit.empty()).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════
// 18. Table
// ═══════════════════════════════════════════════════════════════

describe("Table", () => {
  test("creates table with headers and rows", () => {
    const t = CreateTable()
      .Headers("Name", "Age")
      .Row("Alice", "30")
      .Row("Bob", "25")
    const out = plain(t.Render())
    expect(out).toContain("Name")
    expect(out).toContain("Alice")
    expect(out).toContain("Bob")
    expect(out).toContain("25")
  })

  test("table with no data returns empty", () => {
    const t = CreateTable()
    expect(t.Render()).toBe("")
  })

  test("table with only headers", () => {
    const t = CreateTable().Headers("A", "B")
    const out = plain(t.Render())
    expect(out).toContain("A")
    expect(out).toContain("B")
  })

  test("table border configuration", () => {
    const t = CreateTable()
      .Border(RoundedBorder()!)
      .Headers("H")
      .Row("D")
    const out = t.Render()
    expect(out).toContain("╭")
  })

  test("GetHeaders returns headers", () => {
    const t = CreateTable().Headers("X", "Y", "Z")
    expect(t.GetHeaders()).toEqual(["X", "Y", "Z"])
  })

  test("Width and Height setters", () => {
    const t = CreateTable().Width(80).Height(20)
    expect(t.GetHeight()).toBe(20)
  })
})

// ═══════════════════════════════════════════════════════════════
// 19. Tree / Leaf
// ═══════════════════════════════════════════════════════════════

describe("Leaf", () => {
  test("creates leaf with value", () => {
    const l = new Leaf("hello")
    expect(l.value()).toBe("hello")
    expect(l.children().length()).toBe(0)
    expect(l.hidden()).toBe(false)
  })

  test("setHidden toggles visibility", () => {
    const l = new Leaf("x")
    l.setHidden(true)
    expect(l.hidden()).toBe(true)
  })

  test("setValue updates value", () => {
    const l = new Leaf("old")
    l.setValue("new")
    expect(l.value()).toBe("new")
  })

  test("toString returns value", () => {
    const l = new Leaf("test")
    expect(l.toString()).toBe("test")
  })
})

describe("Tree", () => {
  test("creates tree with root and children", () => {
    const t = Root("Root")
      .child(new Leaf("Child1"))
      .child(new Leaf("Child2"))
    expect(t.value()).toBe("Root")
    expect(t.children().length()).toBe(2)
  })

  test("tree renders with enumerator", () => {
    const t = Root("Root")
      .child(new Leaf("A"))
      .child(new Leaf("B"))
    const out = plain(t.toString())
    expect(out).toContain("Root")
    expect(out).toContain("A")
    expect(out).toContain("B")
    expect(out).toContain("├──")
    expect(out).toContain("└──")
  })

  test("nested tree", () => {
    const inner = Root("")
      .child(new Leaf("Inner1"))
      .child(new Leaf("Inner2"))
    const t = Root("Top")
      .child(new Leaf("Child"))
      .child(inner)
    const out = plain(t.toString())
    expect(out).toContain("Top")
    expect(out).toContain("Child")
  })

  test("RoundedEnumerator", () => {
    const t = Root("Root")
      .enumerator(RoundedEnumerator)
      .child(new Leaf("A"))
      .child(new Leaf("B"))
    const out = plain(t.toString())
    expect(out).toContain("╰──")
  })

  test("hide hides node", () => {
    const t = Root("Root")
      .child(new Leaf("Visible"))
      .child(new Leaf("Hidden"))
    t.childNodes.at(1)?.setHidden(true)
    const out = plain(t.toString())
    expect(out).toContain("Visible")
  })

  test("NodeChildren append and length", () => {
    let nc = new NodeChildren()
    nc = nc.append(new Leaf("a"))
    nc = nc.append(new Leaf("b"))
    expect(nc.length()).toBe(2)
    expect(nc.at(0)!.value()).toBe("a")
  })

  test("NewStringData creates children from strings", () => {
    const c = TreeNewStringData("a", "b", "c")
    expect(c.length()).toBe(3)
    expect(c.at(0)!.value()).toBe("a")
  })

  test("DefaultEnumerator returns correct symbols", () => {
    const nc = new NodeChildren([new Leaf("a"), new Leaf("b")])
    expect(DefaultEnumerator(nc, 0)).toBe("├──")
    expect(DefaultEnumerator(nc, 1)).toBe("└──")
  })
})

// ═══════════════════════════════════════════════════════════════
// 20. List
// ═══════════════════════════════════════════════════════════════

describe("List", () => {
  test("creates list with items", () => {
    const l = New("a", "b", "c")
    const out = plain(l.toString())
    expect(out).toContain("a")
    expect(out).toContain("b")
    expect(out).toContain("c")
  })

  test("list with Bullet enumerator", () => {
    const l = New("x", "y").enumerator(Bullet)
    const out = plain(l.toString())
    expect(out).toContain("\u2022")
  })

  test("list with Asterisk enumerator", () => {
    const l = New("x").enumerator(Asterisk)
    const out = plain(l.toString())
    expect(out).toContain("*")
  })

  test("list with Dash enumerator", () => {
    const l = New("x").enumerator(Dash)
    const out = plain(l.toString())
    expect(out).toContain("-")
  })

  test("Arabic enumerator", () => {
    const items = { length: () => 3, at: (i: number) => new Leaf(`${i}`) }
    expect(Arabic(items, 0)).toBe("1.")
    expect(Arabic(items, 4)).toBe("5.")
  })

  test("Alphabet enumerator", () => {
    const items = { length: () => 3, at: (i: number) => new Leaf(`${i}`) }
    expect(Alphabet(items, 0)).toBe("A.")
    expect(Alphabet(items, 1)).toBe("B.")
    expect(Alphabet(items, 25)).toBe("Z.")
  })

  test("Roman enumerator - note: Roman(0) returns '.' (empty numeral + dot)", () => {
    const items = { length: () => 3, at: (i: number) => new Leaf(`${i}`) }
    // Roman numeral for 0 is empty string, so result is "."
    expect(Roman(items, 1)).toBe("I.")
    expect(Roman(items, 2)).toBe("II.")
    expect(Roman(items, 5)).toBe("V.")
  })

  test("list itemStyle", () => {
    const l = New("a", "b").itemStyle(NewStyle().bold(true))
    const out = l.toString()
    expect(out).toContain("\x1b[1m")
  })

  test("getItems returns values", () => {
    const l = New("x", "y", "z")
    expect(l.getItems()).toEqual(["x", "y", "z"])
  })
})

// ═══════════════════════════════════════════════════════════════
// 21. Size / Width / Height
// ═══════════════════════════════════════════════════════════════

describe("Size functions", () => {
  test("SizeWidth returns max line width", () => {
    expect(SizeWidth("hello")).toBe(5)
    expect(SizeWidth("hi\nhello")).toBe(5)
  })

  test("SizeHeight returns line count", () => {
    expect(SizeHeight("hello")).toBe(1)
    expect(SizeHeight("a\nb\nc")).toBe(3)
  })

  test("Size returns [width, height]", () => {
    const [w, h] = Size("hello\nworld")
    expect(w).toBe(5)
    expect(h).toBe(2)
  })
})

// ═══════════════════════════════════════════════════════════════
// 22. Position
// ═══════════════════════════════════════════════════════════════

describe("Position", () => {
  test("Top = 0, Bottom = 1, Center = 0.5", () => {
    expect(Top).toBe(0)
    expect(Bottom).toBe(1)
    expect(Center).toBe(0.5)
    expect(Left).toBe(0)
    expect(Right).toBe(1)
  })

  test("positionValue clamps to [0,1]", () => {
    expect(positionValue(0.5)).toBe(0.5)
    expect(positionValue(-1)).toBe(0)
    expect(positionValue(2)).toBe(1)
    expect(positionValue(Infinity)).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 23. Query (Profile only)
// ═══════════════════════════════════════════════════════════════

describe("Profile", () => {
  test("Profile returns a valid string", () => {
    const p = Profile()
    expect(["truecolor", "ansi256", "ansi", "none"]).toContain(p)
  })
})

// ═══════════════════════════════════════════════════════════════
// 24. Border style lookup by string
// ═══════════════════════════════════════════════════════════════

describe("Border style lookup", () => {
  test("borders object has all named styles", () => {
    expect(borders.normal).toBeDefined()
    expect(borders.rounded).toBeDefined()
    expect(borders.thick).toBeDefined()
    expect(borders.double).toBeDefined()
    expect(borders.hidden).toBeDefined()
    expect(borders.block).toBeDefined()
    expect(borders.markdown).toBeDefined()
    expect(borders.ascii).toBeDefined()
    expect(borders.dot).toBeDefined()
    expect(borders.dashed).toBeDefined()
    expect(borders.outerHalfBlock).toBeDefined()
    expect(borders.innerHalfBlock).toBeDefined()
  })
})

// ═══════════════════════════════════════════════════════════════
// 25. Whitespace
// ═══════════════════════════════════════════════════════════════

describe("Whitespace", () => {
  test("render fills width with chars", () => {
    const ws = new Whitespace()
    const out = ws.render(5)
    expect(getStringWidth(out)).toBe(5)
  })

  test("WhitespaceConfig changes character", () => {
    const ws = new Whitespace({ char: "." })
    const out = ws.render(3)
    expect(out).toContain("...")
  })
})

// ═══════════════════════════════════════════════════════════════
// 26. NBSP constant
// ═══════════════════════════════════════════════════════════════

describe("NBSP", () => {
  test("NBSP is non-breaking space", () => {
    expect(NBSP).toBe("\u00A0")
  })
})

// ═══════════════════════════════════════════════════════════════
// 27. Integration: combined styles
// ═══════════════════════════════════════════════════════════════

describe("Combined styles integration", () => {
  test("bold + color + padding", () => {
    const s = NewStyle().bold(true).foreground("#ff0000").padding(1)
    const out = s.render("text")
    expect(out).toContain("\x1b[1m")
    expect(out).toContain("38;2;255;0;0")
    const lines = out.split("\n")
    expect(lines.length).toBe(3)
  })

  test("width + align center + border", () => {
    const s = NewStyle().width(12).align("center").border(BorderType.Normal)
    const out = s.render("hello")
    expect(out).toContain("┌")
    expect(out).toContain("│")
    expect(out).toContain("┘")
  })

  test("maxWidth truncates output", () => {
    const s = NewStyle().maxWidth(5)
    const out = s.render("hello world")
    expect(getStringWidth(plain(out).split("\n")[0]!)).toBeLessThanOrEqual(5)
  })
})
