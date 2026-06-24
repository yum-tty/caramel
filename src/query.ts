// query.ts | terminal queries (lipgloss port)

/**
 * BackgroundColor queries the terminal for its background color.
 * Returns the color as a hex string, or null if not available.
 */
export async function BackgroundColor(): Promise<string | null> {
  // Request background color via OSC 11
  process.stdout.write(`${ESC}[11;`)

  // Wait for response
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(null)
    }, 100)

    process.stdin.once("data", (data: string) => {
      clearTimeout(timeout)
      // Parse response: \x1b]11;rgb:RR/GG/BB\x1b\\
      const match = data.match(/rgb:([0-9a-f]{2})\/([0-9a-f]{2})\/([0-9a-f]{2})/)
      if (match) {
        resolve(`#${match[1]}${match[2]}${match[3]}`)
      } else {
        resolve(null)
      }
    })
  })
}

/**
 * HasDarkBackground checks if the terminal has a dark background.
 */
export async function HasDarkBackground(): Promise<boolean> {
  const color = await BackgroundColor()
  if (!color) return true // Assume dark if unknown

  // Convert hex to luminance
  const hex = color.replace("#", "")
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance < 0.5
}

const ESC = "\x1b"
