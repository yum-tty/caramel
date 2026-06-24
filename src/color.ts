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

export function colorToAnsi(color: Color, prefix: "38" | "48"): string {
  if (color === null || color === undefined) return ""

  if (typeof color === "object" && "Light" in color) {
    color = (color as AdaptiveColor).Dark
  }

  if (typeof color === "object" && "TrueColor" in color) {
    color = (color as CompleteColor).TrueColor
  }

  if (typeof color === "string") {
    if (color.startsWith("#")) {
      const hex = color.slice(1)
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return `${prefix};2;${r};${g};${b}`
    }
    const namedColors: Record<string, string> = {
      black: "0", red: "1", green: "2", yellow: "3",
      blue: "4", magenta: "5", cyan: "6", white: "7",
      brightBlack: "8", brightRed: "9", brightGreen: "10",
      brightYellow: "11", brightBlue: "12", brightMagenta: "13",
      brightCyan: "14", brightWhite: "15",
    }
    if (color in namedColors) return `${prefix};5;${namedColors[color]}`
    const num = parseInt(color)
    if (!isNaN(num)) return `${prefix};5;${num}`
    return ""
  }

  if (typeof color === "number") return `${prefix};5;${color}`
  if ("r" in color) return `${prefix};2;${color.r};${color.g};${color.b}`
  if ("ansi" in color) return `${prefix};${color.ansi}`
  if ("ansi256" in color) return `${prefix};5;${color.ansi256}`
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
