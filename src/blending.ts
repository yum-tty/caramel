export interface RGBColor {
  r: number
  g: number
  b: number
}

export function hexToRgb(hex: string): RGBColor {
  const h = hex.replace("#", "")
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0")
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpColor(a: RGBColor, b: RGBColor, t: number): RGBColor {
  return {
    r: lerp(a.r, b.r, t),
    g: lerp(a.g, b.g, t),
    b: lerp(a.b, b.b, t),
  }
}

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

export function Alpha(color: string, alpha: number): string {
  const rgb = hexToRgb(color)
  const a = Math.max(0, Math.min(1, alpha))
  return rgbToHex({
    r: Math.round(rgb.r * a),
    g: Math.round(rgb.g * a),
    b: Math.round(rgb.b * a),
  })
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return [h * 360, s, v]
}

function hsvToRgb(h: number, s: number, v: number): RGBColor {
  h = ((h % 360) + 360) % 360
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r1 = 0, g1 = 0, b1 = 0

  if (h < 60) { r1 = c; g1 = x; b1 = 0 }
  else if (h < 120) { r1 = x; g1 = c; b1 = 0 }
  else if (h < 180) { r1 = 0; g1 = c; b1 = x }
  else if (h < 240) { r1 = 0; g1 = x; b1 = c }
  else if (h < 300) { r1 = x; g1 = 0; b1 = c }
  else { r1 = c; g1 = 0; b1 = x }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  }
}

export function Complementary(color: string): string {
  const rgb = hexToRgb(color)
  let [h, s, v] = rgbToHsv(rgb.r, rgb.g, rgb.b)
  h += 180
  if (h >= 360) h -= 360
  else if (h < 0) h += 360
  return rgbToHex(hsvToRgb(h, s, v))
}

export function Darken(color: string, percent: number): string {
  const rgb = hexToRgb(color)
  const factor = 1 - Math.max(0, Math.min(1, percent / 100))
  return rgbToHex({
    r: Math.round(rgb.r * factor),
    g: Math.round(rgb.g * factor),
    b: Math.round(rgb.b * factor),
  })
}

export function Lighten(color: string, percent: number): string {
  const rgb = hexToRgb(color)
  const add = 255 * Math.max(0, Math.min(1, percent / 100))
  return rgbToHex({
    r: Math.round(Math.min(255, rgb.r + add)),
    g: Math.round(Math.min(255, rgb.g + add)),
    b: Math.round(Math.min(255, rgb.b + add)),
  })
}

export function isDarkColor(color: string): boolean {
  const rgb = hexToRgb(color)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance < 0.5
}
