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

  if (typeof c === "object" && c !== null && "Light" in c) {
    const adaptive = c as any
    const term = typeof process !== 'undefined' ? (process.env?.TERM_PROGRAM || process.env?.COLORTERM || process.env?.TERM || '') : ''
    const isDark = term.includes('dark') || (typeof process !== 'undefined' && process.env?.THEME === 'dark')
    c = isDark ? adaptive.Dark as Color : adaptive.Light as Color
  }

  if (typeof c === "object" && c !== null && "TrueColor" in c) {
    c = (c as any).TrueColor as Color
  }

  if (typeof c === "string") {
    if (c.startsWith("#")) {
      const hex = c.slice(1)
      if (hex.length === 3) {
        const r = parseInt(hex[0]! + hex[0]!, 16)
        const g = parseInt(hex[1]! + hex[1]!, 16)
        const b = parseInt(hex[2]! + hex[2]!, 16)
        return `${prefix};2;${r};${g};${b}`
      }
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16)
        const g = parseInt(hex.slice(2, 4), 16)
        const b = parseInt(hex.slice(4, 6), 16)
        return `${prefix};2;${r};${g};${b}`
      }
      const num = parseInt(hex, 16)
      if (!isNaN(num)) return `${prefix};5;${num}`
      return ""
    }
    const namedColors: Record<string, number> = {
      black: 0, red: 1, green: 2, yellow: 3,
      blue: 4, magenta: 5, cyan: 6, white: 7,
      brightBlack: 8, brightRed: 9, brightGreen: 10,
      brightYellow: 11, brightBlue: 12, brightMagenta: 13,
      brightCyan: 14, brightWhite: 15,
    }
    if (c in namedColors) {
      const v = namedColors[c]!
      if (prefix === "58") return `${prefix};5;${v}`
      if (prefix === "38") return v < 8 ? `${30 + v}` : `${82 + v}`
      return v < 8 ? `${40 + v}` : `${92 + v}`
    }
    const num = parseInt(c)
    if (!isNaN(num)) {
      const i = num < 0 ? -num : num
      if (i < 16) {
        if (prefix === "58") return `${prefix};5;${i}`
        if (prefix === "38") return i < 8 ? `${30 + i}` : `${82 + i}`
        return i < 8 ? `${40 + i}` : `${92 + i}`
      }
      return `${prefix};5;${i}`
    }
    return ""
  }

  if (typeof c === "number") {
    const i = c < 0 ? -c : c
    if (i < 16) {
      if (prefix === "58") return `${prefix};5;${i}`
      if (prefix === "38") return i < 8 ? `${30 + i}` : `${82 + i}`
      return i < 8 ? `${40 + i}` : `${92 + i}`
    }
    return `${prefix};5;${c}`
  }
  if (c !== null && typeof c === "object" && "r" in c) return `${prefix};2;${c.r};${c.g};${c.b}`
  if (c !== null && typeof c === "object" && "ansi" in c) {
    const v = (c as {ansi: number}).ansi
    if (prefix === "58") return `${prefix};5;${v}`
    if (prefix === "38") return v < 8 ? `${30 + v}` : `${82 + v}`
    return v < 8 ? `${40 + v}` : `${92 + v}`
  }
  if (c !== null && typeof c === "object" && "ansi256" in c) return `${prefix};5;${(c as {ansi256: number}).ansi256}`
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
