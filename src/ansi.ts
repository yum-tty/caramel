const wideCharRanges: [number, number][] = [
  [0x1100, 0x115F],
  [0x2329, 0x232A],
  [0x2E80, 0x303E],
  [0x3040, 0x33BF],
  [0x3400, 0x4DBF],
  [0x4E00, 0x9FFF],
  [0xA000, 0xA4CF],
  [0xAC00, 0xD7AF],
  [0xF900, 0xFAFF],
  [0xFE10, 0xFE19],
  [0xFE30, 0xFE6F],
  [0xFF00, 0xFF60],
  [0xFFE0, 0xFFE6],
  [0x1F000, 0x1FFFF],
  [0x20000, 0x2FFFD],
  [0x30000, 0x3FFFD],
]

/**
 * Check if a Unicode code point is a wide (CJK) character.
 * @inline - Small function called frequently, benefits from inlining
 * @param code - Unicode code point
 * @returns true if character is wide (2 columns)
 */
export function isWideChar(code: number): boolean {
  for (const [lo, hi] of wideCharRanges) {
    if (code >= lo && code <= hi) return true
  }
  return false
}

// East Asian Ambiguous: chars whose width may be 1 or 2 depending on terminal
const ambiguousChars = new Set([
  0x2631, 0x2632, 0x2634, // hamburger ☱☲☴
  0x2600, 0x2602, 0x2603, 0x2614, 0x2615, // misc symbols
  0x2630, // trigram
  0x2668, // hot springs
  0x2691, 0x2692, 0x2693, 0x2694, 0x2695, 0x2696, 0x2697, 0x2699, // tools
  0x26A0, 0x26A1, // warning, lightning
  0x26AA, 0x26AB, // circles
  0x26BD, 0x26BE, // sports
  0x26C4, 0x26C5, 0x26CE, 0x26CF, 0x26D1, 0x26D3, 0x26D4, // weather
  0x26E9, 0x26EA, // religious
  0x26F0, 0x26F1, 0x26F2, 0x26F3, 0x26F5, 0x26F7, 0x26F8, 0x26F9, 0x26FA, 0x26FD, 0x26FE, // misc
])

// Probe terminal: write ambiguous char + known-width chars, read cursor offset
let _probeResult: number | null = null

function probeTerminalWidth(): number {
  if (_probeResult !== null) return _probeResult
  const tp = process.env.TERM_PROGRAM || ""
  const wt = process.env.WT_SESSION || ""
  const ct = process.env.COLORTERM || ""
  if (tp === "vscode" || tp === "WezTerm" || tp === "iTerm.app" || !!wt || ct === "truecolor") {
    _probeResult = 2
  } else {
    _probeResult = 1
  }
  return _probeResult
}

function charWidth(code: number): number {
  if (isWideChar(code)) return 2
  if (ambiguousChars.has(code)) {
    return probeTerminalWidth() || 1
  }
  return 1
}

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })

const widthCache = new Map<string, number>()
const MAX_CACHE_SIZE = 1000

/**
 * Calculate display width of a string.
 * @param str - String to measure (may contain ANSI escapes)
 * @returns Display width in columns
 */
export function getStringWidth(str: string): number {
  const cached = widthCache.get(str)
  if (cached !== undefined) return cached

  const stripped = str.replace(/\x1b\[[0-9;]*m/g, "").replace(/\x1b\]([^\x07\x1b\\]*)(?:\x07|\x1b\\)/g, "")
  let width = 0
  for (const { segment } of segmenter.segment(stripped)) {
    width += charWidth(segment.codePointAt(0)!)
  }

  if (widthCache.size < MAX_CACHE_SIZE) {
    widthCache.set(str, width)
  }

  return width
}

export function clearWidthCache(): void {
  widthCache.clear()
}

/**
 * Get display width of a single character.
 * @inline - Hot path, should be inlined by JIT
 * @param char - Single character string
 * @returns Display width (0, 1, or 2)
 */
export function charDisplayWidth(char: string): number {
  if (!char) return 0
  return charWidth(char.codePointAt(0)!)
}

/**
 * Remove ANSI escape sequences from a string.
 * @param str - String with ANSI escapes
 * @returns String without ANSI escapes
 */
export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "").replace(/\x1b\]([^\x07\x1b\\]*)(?:\x07|\x1b\\)/g, "")
}
