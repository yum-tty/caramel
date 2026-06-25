// color.ts | color types and conversion (lipgloss port)

export type Color =
  | string
  | number
  | { r: number; g: number; b: number }
  | { ansi: number }
  | { ansi256: number }
  | null

export const NoColor: null = null

export interface CompleteColor {
  TrueColor: string
  ANSI256: string
  ANSI: string
}

export interface AdaptiveColor {
  Light: string | CompleteColor
  Dark: string | CompleteColor
}

export type ColorProfile = "ansi" | "ansi256" | "truecolor" | "none"

export function Color(s: string): Color {
  if (s.startsWith("#")) {
    return s
  }
  const num = parseInt(s, 10)
  if (isNaN(num)) return NoColor
  const i = num < 0 ? -num : num
  if (i < 16) return { ansi: i }
  if (i < 256) return { ansi256: i }
  const r = (i >> 16) & 0xff
  const g = (i >> 8) & 0xff
  const b = i & 0xff
  return { r, g, b }
}

export type LightDarkFunc = (light: Color, dark: Color) => Color

export function LightDark(isDark: boolean): LightDarkFunc {
  return (light: Color, dark: Color) => isDark ? dark : light
}

export type CompleteFunc = (ansi: Color, ansi256: Color, truecolor: Color) => Color

export function Complete(profile: ColorProfile): CompleteFunc {
  return (ansi: Color, ansi256: Color, truecolor: Color) => {
    switch (profile) {
      case "ansi": return ansi
      case "ansi256": return ansi256
      case "truecolor": return truecolor
      default: return NoColor
    }
  }
}

export function colorToAnsi(color: Color, prefix: "38" | "48" | "58"): string {
  if (color === null || color === undefined) return ""

  let c: Color = color as Color

  // Resolve adaptive/TrueColor wrappers
  if (typeof c === "object" && c !== null && "Light" in c) {
    const adaptive = c as any
    const term = typeof process !== 'undefined' ? (process.env?.TERM_PROGRAM || process.env?.COLORTERM || process.env?.TERM || '') : ''
    const isDark = term.includes('dark') || (typeof process !== 'undefined' && process.env?.THEME === 'dark')
    c = isDark ? adaptive.Dark as Color : adaptive.Light as Color
  }
  if (typeof c === "object" && c !== null && "TrueColor" in c) {
    c = (c as any).TrueColor as Color
  }

  // Bun.color handles: hex strings, CSS names, rgb/hsl strings, RGB objects, RGB arrays, numbers (as RGB)
  if (typeof c === "string" || (typeof c === "object" && c !== null && ("r" in c || Array.isArray(c)))) {
    const rgba = Bun.color(c as any, "[rgba]")
    if (rgba) {
      return `${prefix};2;${rgba[0]};${rgba[1]};${rgba[2]}`
    }
  }

  // Bun.color handles numbers as RGB values
  if (typeof c === "number") {
    const rgba = Bun.color(c, "[rgba]")
    if (rgba) {
      return `${prefix};2;${rgba[0]};${rgba[1]};${rgba[2]}`
    }
    // Fallback for small numbers (ANSI 4-bit/256 indices)
    const i = c < 0 ? -c : c
    if (i < 16) {
      if (prefix === "58") return `${prefix};5;${i}`
      if (prefix === "38") return i < 8 ? `${30 + i}` : `${82 + i}`
      return i < 8 ? `${40 + i}` : `${92 + i}`
    }
    return `${prefix};5;${c}`
  }

  // Bun.color can't handle {ansi:N} or {ansi256:N} — manual handling
  if (typeof c === "object" && c !== null && "ansi" in c) {
    const v = (c as {ansi: number}).ansi
    if (prefix === "58") return `${prefix};5;${v}`
    if (prefix === "38") return v < 8 ? `${30 + v}` : `${82 + v}`
    return v < 8 ? `${40 + v}` : `${92 + v}`
  }
  if (typeof c === "object" && c !== null && "ansi256" in c) {
    return `${prefix};5;${(c as {ansi256: number}).ansi256}`
  }

  return ""
}

export const reset = "\x1b[0m"
export const bold = "\x1b[1m"
export const dim = "\x1b[2m"
export const italic = "\x1b[3m"
export const underline = "\x1b[4m"
export const blink = "\x1b[5m"
export const reverse = "\x1b[7m"
export const strikethrough = "\x1b[9m"

export function fg(color: Color): string {
  return `\x1b[${colorToAnsi(color, "38")}m`
}

export function bg(color: Color): string {
  return `\x1b[${colorToAnsi(color, "48")}m`
}

export function ulColor(color: Color): string {
  if (color === null || color === undefined) return ""
  return `\x1b[${colorToAnsi(color, "58")}m`
}
