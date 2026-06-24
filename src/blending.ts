// blending.ts | color blending (lipgloss port)

/**
 * RGBColor represents an RGB color.
 */
export interface RGBColor {
  r: number
  g: number
  b: number
}

/**
 * Hex to RGB conversion.
 */
export function hexToRgb(hex: string): RGBColor {
  const h = hex.replace("#", "")
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

/**
 * RGB to hex conversion.
 */
export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0")
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

/**
 * Lerp between two values.
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Lerp between two colors.
 */
function lerpColor(a: RGBColor, b: RGBColor, t: number): RGBColor {
  return {
    r: lerp(a.r, b.r, t),
    g: lerp(a.g, b.g, t),
    b: lerp(a.b, b.b, t),
  }
}

/**
 * Blend1D creates a 1D color gradient.
 * @param steps - Number of steps in the gradient
 * @param colors - Colors to blend between
 * @returns Array of hex color strings
 */
export function Blend1D(steps: number, ...colors: string[]): string[] {
  if (colors.length === 0) return []
  if (colors.length === 1) return Array(steps).fill(colors[0])
  if (steps <= 0) return []

  const rgbColors = colors.map(hexToRgb)
  const result: string[] = []

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const segment = t * (rgbColors.length - 1)
    const idx = Math.floor(segment)
    const localT = segment - idx

    if (idx >= rgbColors.length - 1) {
      result.push(rgbToHex(rgbColors[rgbColors.length - 1]!))
    } else {
      result.push(rgbToHex(lerpColor(rgbColors[idx]!, rgbColors[idx + 1]!, localT)))
    }
  }

  return result
}

/**
 * Blend2D creates a 2D color gradient.
 * @param width - Width of the gradient
 * @param height - Height of the gradient
 * @param angle - Angle in degrees (0=right, 90=down)
 * @param colors - Colors to blend between
 * @returns 2D array of hex color strings
 */
export function Blend2D(
  width: number,
  height: number,
  angle: number,
  ...colors: string[]
): string[][] {
  const result: string[][] = []
  const rad = (angle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  for (let y = 0; y < height; y++) {
    const row: string[] = []
    for (let x = 0; x < width; x++) {
      const nx = x / (width - 1 || 1)
      const ny = y / (height - 1 || 1)
      const t = (nx * cos + ny * sin + 1) / 2

      const rgbColors = colors.map(hexToRgb)
      const segment = Math.max(0, Math.min(1, t)) * (rgbColors.length - 1)
      const idx = Math.min(Math.floor(segment), rgbColors.length - 2)
      const localT = segment - idx

      row.push(rgbToHex(lerpColor(rgbColors[idx]!, rgbColors[idx + 1]!, localT)))
    }
    result.push(row)
  }

  return result
}

/**
 * Alpha blends a color with an alpha value.
 */
export function Alpha(color: string, alpha: number): string {
  const rgb = hexToRgb(color)
  const a = Math.max(0, Math.min(1, alpha))
  return rgbToHex({
    r: Math.round(rgb.r * a),
    g: Math.round(rgb.g * a),
    b: Math.round(rgb.b * a),
  })
}

/**
 * Complementary returns the complementary color.
 */
export function Complementary(color: string): string {
  const rgb = hexToRgb(color)
  return rgbToHex({
    r: 255 - rgb.r,
    g: 255 - rgb.g,
    b: 255 - rgb.b,
  })
}

/**
 * Darken darkens a color by a percentage.
 */
export function Darken(color: string, percent: number): string {
  const rgb = hexToRgb(color)
  const factor = 1 - Math.max(0, Math.min(1, percent / 100))
  return rgbToHex({
    r: Math.round(rgb.r * factor),
    g: Math.round(rgb.g * factor),
    b: Math.round(rgb.b * factor),
  })
}

/**
 * Lighten lightens a color by a percentage.
 */
export function Lighten(color: string, percent: number): string {
  const rgb = hexToRgb(color)
  const factor = Math.max(0, Math.min(1, percent / 100))
  return rgbToHex({
    r: Math.round(rgb.r + (255 - rgb.r) * factor),
    g: Math.round(rgb.g + (255 - rgb.g) * factor),
    b: Math.round(rgb.b + (255 - rgb.b) * factor),
  })
}

/**
 * IsDarkColor checks if a color is dark.
 */
export function isDarkColor(color: string): boolean {
  const rgb = hexToRgb(color)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance < 0.5
}
