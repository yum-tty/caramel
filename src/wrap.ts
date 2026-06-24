// wrap.ts | word wrapping (lipgloss port)

/**
 * Strip ANSI escape codes from a string.
 */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "")
}

/**
 * Get visible width of a string (without ANSI codes).
 */
function visibleWidth(str: string): number {
  return stripAnsi(str).length
}

/**
 * Wrap wraps the given string to the given width, preserving ANSI styles.
 */
export function Wrap(str: string, width: number, breakpoints: string = ""): string {
  if (width <= 0) return str

  const lines = str.split("\n")
  const result: string[] = []

  for (const line of lines) {
    if (visibleWidth(line) <= width) {
      result.push(line)
      continue
    }

    // Word wrap
    const words = line.split(" ")
    let currentLine = ""
    let currentWidth = 0

    for (const word of words) {
      const wordWidth = visibleWidth(word)
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

/**
 * Truncate truncates a string to a given width, appending ellipsis if needed.
 */
export function Truncate(str: string, maxWidth: number, tail: string = "…"): string {
  const lines = str.split("\n")
  const result: string[] = []

  for (const line of lines) {
    if (visibleWidth(line) <= maxWidth) {
      result.push(line)
      continue
    }

    let truncated = ""
    let currentWidth = 0
    const tailWidth = visibleWidth(tail)

    for (const char of line) {
      if (char === "\x1b") {
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

/**
 * Ellipsize truncates a string with ellipsis.
 */
export function Ellipsize(str: string, maxWidth: number): string {
  return Truncate(str, maxWidth, "…")
}
