export interface RGBColor {
  r: number
  g: number
  b: number
}

export function hexToRgb(hex: string): RGBColor {
  // Use Bun.color for native hex parsing
  const rgba = Bun.color(hex, "[rgba]")
  if (rgba) {
    return { r: rgba[0], g: rgba[1], b: rgba[2] }
  }
  // Fallback for edge cases
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

interface LabColor { L: number; a: number; b: number }

function srgbToLinear(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function linearToSrgb(c: number): number {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  return Math.round(Math.max(0, Math.min(255, v * 255)))
}

function rgbToXyz(rgb: RGBColor): [number, number, number] {
  const r = srgbToLinear(rgb.r)
  const g = srgbToLinear(rgb.g)
  const b = srgbToLinear(rgb.b)
  return [
    0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    0.2126729 * r + 0.7151522 * g + 0.0721750 * b,
    0.0193339 * r + 0.1191920 * g + 0.9503041 * b,
  ]
}

function xyzToRgb(x: number, y: number, z: number): RGBColor {
  return {
    r: linearToSrgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z),
    g: linearToSrgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
    b: linearToSrgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
  }
}

const D65 = [0.95047, 1.0, 1.08883]

function xyzToLab(x: number, y: number, z: number): LabColor {
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116
  const fx = f(x / D65[0])
  const fy = f(y / D65[1])
  const fz = f(z / D65[2])
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

function labToXyz(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116
  const fx = a / 500 + fy
  const fz = fy - b / 200
  const finv = (t: number) => {
    const t3 = t * t * t
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787
  }
  return [D65[0] * finv(fx), D65[1] * finv(fy), D65[2] * finv(fz)]
}

function rgbToLab(rgb: RGBColor): LabColor {
  const [x, y, z] = rgbToXyz(rgb)
  return xyzToLab(x, y, z)
}

function labToRgb(lab: LabColor): RGBColor {
  const [x, y, z] = labToXyz(lab.L, lab.a, lab.b)
  return xyzToRgb(x, y, z)
}

function blendLab(a: RGBColor, b: RGBColor, t: number): RGBColor {
  const labA = rgbToLab(a)
  const labB = rgbToLab(b)
  return labToRgb({
    L: lerp(labA.L, labB.L, t),
    a: lerp(labA.a, labB.a, t),
    b: lerp(labA.b, labB.b, t),
  })
}

export function Blend1D(steps: number, ...colors: string[]): string[] {
  if (colors.length === 0) return []
  if (colors.length === 1) return Array(steps).fill(colors[0])
  if (steps <= 0) return []

  const rgbColors = colors.map(hexToRgb)

  if (steps <= rgbColors.length) {
    return rgbColors.slice(0, steps).map(rgbToHex)
  }

  const result: string[] = []
  const numSegments = rgbColors.length - 1
  const defaultSize = Math.floor(steps / numSegments)
  let remainingSteps = steps % numSegments

  let resultIndex = 0
  for (let i = 0; i < numSegments; i++) {
    const from = rgbColors[i]!
    const to = rgbColors[i + 1]!
    let segmentSize = defaultSize
    if (i < remainingSteps) segmentSize++

    const divisor = segmentSize - 1
    for (let j = 0; j < segmentSize; j++) {
      const t = divisor > 0 ? j / divisor : 0
      result.push(rgbToHex(blendLab(from, to, t)))
      resultIndex++
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
  const rgbColors = colors.map(hexToRgb)
  if (width < 1) width = 1
  if (height < 1) height = 1

  angle = ((angle % 360) + 360) % 360

  if (rgbColors.length === 0) return []
  if (rgbColors.length === 1) {
    const hex = rgbToHex(rgbColors[0]!)
    return Array.from({ length: height }, () => Array(width).fill(hex) as string[])
  }

  const maxDim = Math.max(width, height)
  const diagonalGradient = Blend1D(maxDim, ...colors)

  const result: string[][] = []
  const rad = (angle * Math.PI) / 180
  const cosAngle = Math.cos(rad)
  const sinAngle = Math.sin(rad)

  const centerX = (width - 1) / 2
  const centerY = (height - 1) / 2
  const diagonalLength = Math.sqrt(width * width + height * height)
  const gradientLen = diagonalGradient.length - 1

  for (let y = 0; y < height; y++) {
    const row: string[] = []
    const dy = y - centerY
    for (let x = 0; x < width; x++) {
      const dx = x - centerX
      const rotX = dx * cosAngle - dy * sinAngle
      const gradientPos = Math.max(0, Math.min(1, (rotX + diagonalLength / 2) / diagonalLength))
      const exactIndex = gradientPos * gradientLen
      const lo = Math.min(Math.floor(exactIndex), gradientLen)
      const hi = Math.min(lo + 1, gradientLen)
      if (lo === hi) {
        row.push(diagonalGradient[lo]!)
      } else {
        const frac = exactIndex - lo
        const rgbLo = hexToRgb(diagonalGradient[lo]!)
        const rgbHi = hexToRgb(diagonalGradient[hi]!)
        row.push(rgbToHex({
          r: lerp(rgbLo.r, rgbHi.r, frac),
          g: lerp(rgbLo.g, rgbHi.g, frac),
          b: lerp(rgbLo.b, rgbHi.b, frac),
        }))
      }
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
  const factor = 1 - Math.max(0, Math.min(1, percent))
  return rgbToHex({
    r: Math.round(rgb.r * factor),
    g: Math.round(rgb.g * factor),
    b: Math.round(rgb.b * factor),
  })
}

export function Lighten(color: string, percent: number): string {
  const rgb = hexToRgb(color)
  const add = 255 * Math.max(0, Math.min(1, percent))
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
