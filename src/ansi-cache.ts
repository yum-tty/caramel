// ansi-cache.ts | ANSI string caching for JSC optimization

const MAX_CACHE_SIZE = 2048

// Cache for stripped strings (ANSI removed)
const stripCache = new Map<string, string>()

// Cache for width calculations
const widthCache = new Map<string, number>()

// Common ANSI sequences to intern
const ANSI_RESET = "\x1b[0m"
const ANSI_BOLD = "\x1b[1m"
const ANSI_DIM = "\x1b[2m"
const ANSI_ITALIC = "\x1b[3m"
const ANSI_UNDERLINE = "\x1b[4m"
const ANSI_BLINK = "\x1b[5m"
const ANSI_REVERSE = "\x1b[7m"
const ANSI_STRIKETHROUGH = "\x1b[9m"

// Style string to ANSI mapping cache
const styleToAnsiCache = new Map<string, string>()

export function cachedStripAnsi(str: string): string {
  const cached = stripCache.get(str)
  if (cached !== undefined) return cached

  const result = str.replace(/\x1b\[[0-9;]*m/g, "").replace(/\x1b\]([^\x07\x1b\\]*)(?:\x07|\x1b\\)/g, "")

  if (stripCache.size < MAX_CACHE_SIZE) {
    stripCache.set(str, result)
  }

  return result
}

export function cachedGetWidth(str: string): number {
  const cached = widthCache.get(str)
  if (cached !== undefined) return cached

  return -1 // Signal to use full calculation
}

export function cacheWidth(str: string, width: number): void {
  if (widthCache.size < MAX_CACHE_SIZE) {
    widthCache.set(str, width)
  }
}

export function internAnsi(seq: string): string {
  // Return interned version for common sequences
  if (seq === "\x1b[0m") return ANSI_RESET
  if (seq === "\x1b[1m") return ANSI_BOLD
  if (seq === "\x1b[2m") return ANSI_DIM
  if (seq === "\x1b[3m") return ANSI_ITALIC
  if (seq === "\x1b[4m") return ANSI_UNDERLINE
  if (seq === "\x1b[5m") return ANSI_BLINK
  if (seq === "\x1b[7m") return ANSI_REVERSE
  if (seq === "\x1b[9m") return ANSI_STRIKETHROUGH
  return seq
}

export function cacheStyleAnsi(key: string, ansi: string): string {
  if (styleToAnsiCache.size < MAX_CACHE_SIZE) {
    styleToAnsiCache.set(key, ansi)
  }
  return ansi
}

export function getCachedStyleAnsi(key: string): string | undefined {
  return styleToAnsiCache.get(key)
}

export function clearAnsiCache(): void {
  stripCache.clear()
  widthCache.clear()
  styleToAnsiCache.clear()
}
