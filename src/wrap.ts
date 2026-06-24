import { getStringWidth, stripAnsi } from "./ansi"

export function Wrap(str: string, width: number, breakpoints: string = ""): string {
  if (width <= 0) return str

  const lines = str.split("\n")
  const result: string[] = []

  for (const line of lines) {
    if (getStringWidth(line) <= width) {
      result.push(line)
      continue
    }

    const words = line.split(" ")
    let currentLine = ""
    let currentWidth = 0

    for (const word of words) {
      const wordWidth = getStringWidth(word)
      const spaceWidth = currentLine ? 1 : 0

      if (currentWidth + spaceWidth + wordWidth > width && currentLine) {
        result.push(currentLine)
        currentLine = word
        currentWidth = wordWidth
      } else {
        currentLine = currentLine ? currentLine + " " + word : word
        currentWidth += spaceWidth + wordWidth
      }
    }

    if (currentLine) {
      result.push(currentLine)
    }
  }

  return result.join("\n")
}

export function Truncate(str: string, maxWidth: number, tail: string = "\u2026"): string {
  const lines = str.split("\n")
  const result: string[] = []

  for (const line of lines) {
    if (getStringWidth(line) <= maxWidth) {
      result.push(line)
      continue
    }

    let truncated = ""
    let currentWidth = 0
    const tailWidth = getStringWidth(tail)

    for (const char of line) {
      if (char === "\x1b") {
        truncated += char
        continue
      }

      if (char === "m" && truncated.endsWith("\x1b[")) {
        truncated += char
        continue
      }

      if (inAnsiEscape(truncated)) {
        truncated += char
        continue
      }

      if (currentWidth + tailWidth >= maxWidth) {
        truncated += tail
        break
      }

      truncated += char
      currentWidth++
    }

    result.push(truncated)
  }

  return result.join("\n")
}

export function Ellipsize(str: string, maxWidth: number): string {
  return Truncate(str, maxWidth, "\u2026")
}

function inAnsiEscape(s: string): boolean {
  let count = 0
  for (let i = s.length - 1; i >= 0; i--) {
    if (s[i] === "\x1b") return true
    if (s[i] === "m") count++
    if (count > 0) return true
  }
  return false
}
