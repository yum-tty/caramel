// color.ts | color types and conversion (lipgloss port)

/**
 * Color represents a terminal color.
 */
export type Color =
  | string // hex: "#FF00FF" or ANSI name: "red"
  | number // ANSI 256 color code
  | { r: number; g: number; b: number } // RGB
  | { ansi: number } // ANSI 16 color
  | { ansi256: number } // ANSI 256 color
  | null // no color

/**
 * NoColor represents no color (transparent).
 */
export const NoColor: null = null

/**
 * Adapters for terminal color profiles.
 */
export interface CompleteColor {
  TrueColor: string
  ANSI256: string
  ANSI: string
}

export interface AdaptiveColor {
  Light: string | CompleteColor
  Dark: string | CompleteColor
}

/**
 * Convert a Color to ANSI escape code.
 */
export function colorToAnsi(color: Color, prefix: "38" | "48"): string {
  if (color === null || color === undefined) return ""

  // Adaptive color
  if (typeof color === "object" && "Light" in color) {
    // Default to dark theme
    color = (color as AdaptiveColor).Dark
  }

  // Complete color
  if (typeof color === "object" && "TrueColor" in color) {
    const c = color as CompleteColor
    // Default to TrueColor
    color = c.TrueColor
  }

  if (typeof color === "string") {
    // Hex color
    if (color.startsWith("#")) {
      const hex = color.slice(1)
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return `${prefix};2;${r};${g};${b}`
    }

    // Named colors
    const namedColors: Record<string, string> = {
      black: "0",
      red: "1",
      green: "2",
      yellow: "3",
      blue: "4",
      magenta: "5",
      cyan: "6",
      white: "7",
      brightBlack: "8",
      brightRed: "9",
      brightGreen: "10",
      brightYellow: "11",
      brightBlue: "12",
      brightMagenta: "13",
      brightCyan: "14",
      brightWhite: "15",
    }

    if (color in namedColors) {
      return `${prefix};5;${namedColors[color]}`
    }

    // Try as ANSI 256
    const num = parseInt(color)
    if (!isNaN(num)) {
      return `${prefix};5;${num}`
    }

    return ""
  }

  if (typeof color === "number") {
    return `${prefix};5;${color}`
  }

  if ("r" in color) {
    return `${prefix};2;${color.r};${color.g};${color.b}`
  }

  if ("ansi" in color) {
    return `${prefix};${color.ansi}`
  }

  if ("ansi256" in color) {
    return `${prefix};5;${color.ansi256}`
  }

  return ""
}

// ANSI escape codes
export const reset = "\x1b[0m"
export const bold = "\x1b[1m"
export const dim = "\x1b[2m"
export const italic = "\x1b[3m"
export const underline = "\x1b[4m"
export const blink = "\x1b[5m"
export const reverse = "\x1b[7m"
export const strikethrough = "\x1b[9m"

/**
 * FG returns the ANSI escape code for foreground color.
 */
export function fg(color: Color): string {
  return `\x1b[${colorToAnsi(color, "38")}m`
}

/**
 * BG returns the ANSI escape code for background color.
 */
export function bg(color: Color): string {
  return `\x1b[${colorToAnsi(color, "48")}m`
}
