import { getStringWidth } from "./ansi"

export function Width(str: string): number {
  let maxWidth = 0
  const lines = str.split("\n")
  for (const line of lines) {
    const w = getStringWidth(line)
    if (w > maxWidth) maxWidth = w
  }
  return maxWidth
}

export function Height(str: string): number {
  return str.split("\n").length
}

export function Size(str: string): [number, number] {
  return [Width(str), Height(str)]
}
