import { Blend2D, hexToRgb } from "./src/blending"

console.log("=== 2D Gradient Smoothness Verification ===\n")

function bandingAlongGradient(grid: string[][], angleDeg: number): number {
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const height = grid.length
  const width = grid[0]!.length
  const centerX = (width - 1) / 2
  const centerY = (height - 1) / 2
  const diag = Math.sqrt(width * width + height * height)

  let same = 0, total = 0
  for (let y = 0; y < height; y++) {
    for (let x = 1; x < width; x++) {
      const dx0 = (x - 1) - centerX
      const dx1 = x - centerX
      const dy = y - centerY
      const pos0 = (dx0 * cos - dy * sin + diag / 2) / diag
      const pos1 = (dx1 * cos - dy * sin + diag / 2) / diag
      if (Math.abs(pos1 - pos0) < 1e-9) continue
      total++
      if (grid[y]![x] === grid[y]![x - 1]) same++
    }
  }
  for (let y = 1; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX
      const dy0 = (y - 1) - centerY
      const dy1 = y - centerY
      const pos0 = (dx * cos - dy0 * sin + diag / 2) / diag
      const pos1 = (dx * cos - dy1 * sin + diag / 2) / diag
      if (Math.abs(pos1 - pos0) < 1e-9) continue
      total++
      if (grid[y]![x] === grid[y - 1]![x]) same++
    }
  }
  return total > 0 ? same / total : 0
}

function uniqueColors(grid: string[][]): number {
  return new Set(grid.flat()).size
}

const tests: [string, number, number, number, ...string[]][] = [
  ["80x24 angle=0", 80, 24, 0, "#ff0000", "#0000ff"],
  ["80x24 angle=45", 80, 24, 45, "#ff0000", "#0000ff"],
  ["60x60 angle=45", 60, 60, 45, "#ff0000", "#0000ff"],
  ["120x40 angle=90", 120, 40, 90, "#00ff00", "#ff00ff"],
  ["50x50 angle=135", 50, 50, 135, "#ffff00", "#0000ff"],
  ["80x24 angle=-45", 80, 24, -45, "#ff0000", "#0000ff"],
]

let allPass = true
for (const [name, w, h, angle, ...colors] of tests) {
  const grid = Blend2D(w, h, angle, ...colors)
  const banding = bandingAlongGradient(grid, angle)
  const unique = uniqueColors(grid)
  const total = w * h
  const pass = banding < 0.05
  if (!pass) allPass = false
  console.log(
    `${pass ? "PASS" : "FAIL"} ${name}: ${unique} unique / ${total} pixels, ` +
    `gradient-direction banding=${(banding * 100).toFixed(1)}%`
  )
}

console.log(allPass ? "\nAll tests passed!" : "\nSome tests failed!")
