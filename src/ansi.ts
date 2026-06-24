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
  [0x20000, 0x2FFFD],
  [0x30000, 0x3FFFD],
]

function isWideChar(code: number): boolean {
  for (const [lo, hi] of wideCharRanges) {
    if (code >= lo && code <= hi) return true
  }
  return false
}

export function getStringWidth(str: string): number {
  let width = 0
  let inEscape = false
  for (const char of str) {
    if (char === "\x1b") { inEscape = true; continue }
    if (inEscape) { if (char === "m") inEscape = false; continue }
    const code = char.codePointAt(0)!
    width += isWideChar(code) ? 2 : 1
  }
  return width
}

export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "")
}
