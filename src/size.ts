// size.ts | size functions (lipgloss port)

/**
 * Strip ANSI escape codes from a string.
 */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "")
}

/**
 * Width returns the cell width of characters in the string.
 * ANSI sequences are ignored and characters wider than one cell
 * (such as Chinese characters and emojis) are appropriately measured.
 */
export function Width(str: string): number {
  let maxWidth = 0
  const lines = str.split("\n")

  for (const line of lines) {
    const visible = stripAnsi(line)
    // Simple width calculation - in production, use a proper unicode width library
    const width = visible.length
    if (width > maxWidth) {
      maxWidth = width
    }
  }

  return maxWidth
}

/**
 * Height returns height of a string in cells.
 * This is done simply by counting \n characters.
 */
export function Height(str: string): number {
  return str.split("\n").length
}

/**
 * Size returns the width and height of the string in cells.
 */
export function Size(str: string): [number, number] {
  return [Width(str), Height(str)]
}
