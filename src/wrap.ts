import { getStringWidth, isWideChar } from "./ansi"

const RESET = "\x1b[0m"

interface AnsiToken {
  text: string
  isEscape: boolean
}

function tokenizeAnsi(s: string): AnsiToken[] {
  const tokens: AnsiToken[] = []
  let i = 0
  while (i < s.length) {
    if (s[i] === "\x1b") {
      let j = i + 1
      if (j < s.length && s[j] === "[") {
        j++
        while (j < s.length && s[j] !== "m") j++
        if (j < s.length) j++
        tokens.push({ text: s.slice(i, j), isEscape: true })
        i = j
      } else if (j < s.length && s[j] === "]") {
        j++
        while (j < s.length && s[j] !== "\x07" && !(s[j] === "\\" && s[j - 1] === "\x1b")) j++
        if (j < s.length) j++
        tokens.push({ text: s.slice(i, j), isEscape: true })
        i = j
      } else {
        tokens.push({ text: s[i], isEscape: false })
        i++
      }
    } else {
      let j = i
      while (j < s.length && s[j] !== "\x1b") j++
      if (j > i) tokens.push({ text: s.slice(i, j), isEscape: false })
      i = j
    }
  }
  return tokens
}

function ansiWrap(s: string, width: number, breakpoints: string): string {
  if (width <= 0) return s
  const bpSet = new Set(breakpoints)

  const inputLines = s.split("\n")
  const outputLines: string[] = []

  for (const inputLine of inputLines) {
    if (getStringWidth(inputLine) <= width) {
      outputLines.push(inputLine)
      continue
    }

    const tokens = tokenizeAnsi(inputLine)
    let currentLine = ""
    let currentWidth = 0

    for (const token of tokens) {
      if (token.isEscape) {
        currentLine += token.text
        continue
      }

      for (const ch of token.text) {
        if (ch === "\n") {
          outputLines.push(currentLine)
          currentLine = ""
          currentWidth = 0
          continue
        }

        if (ch === " " || bpSet.has(ch)) {
          const spaceWidth = 1
          if (currentWidth + spaceWidth > width && currentLine.length > 0) {
            outputLines.push(currentLine)
            currentLine = ""
            currentWidth = 0
          } else {
            currentLine += ch
            currentWidth += spaceWidth
          }
          continue
        }

        const charWidth = isWideChar(ch.codePointAt(0) || 0) ? 2 : 1
        if (currentWidth + charWidth > width && currentLine.length > 0) {
          outputLines.push(currentLine)
          currentLine = ""
          currentWidth = 0
        }
        currentLine += ch
        currentWidth += charWidth
      }
    }

    if (currentLine.length > 0) {
      outputLines.push(currentLine)
    }
  }

  return outputLines.join("\n")
}

export class WrapWriter {
  private w: string = ""
  private style: string = ""
  private linkUrl: string = ""
  private linkParams: string = ""
  private closed: boolean = false

  write(s: string): void {
    if (this.closed) return

    for (let i = 0; i < s.length; i++) {
      const ch = s[i]!

      if (ch === "\x1b") {
        let j = i + 1
        if (j < s.length && s[j] === "[") {
          j++
          while (j < s.length && s[j] !== "m") j++
          if (j < s.length) j++
          const seq = s.slice(i, j)
          if (/^\x1b\[[0-9;]*m$/.test(seq)) {
            if (seq === RESET) {
              this.style = ""
            } else {
              this.style += seq
            }
          }
          i = j - 1
          this.w += seq
          continue
        } else if (j < s.length && s[j] === "]") {
          j++
          while (j < s.length && s[j] !== "\x07" && !(s[j] === "\\" && s[j - 1] === "\x1b")) j++
          if (j < s.length) j++
          const seq = s.slice(i, j)
          const oscMatch = seq.match(/^\x1b\]8;([^;]*);([^\x07\x1b\\]*)/)
          if (oscMatch) {
            if (oscMatch[2] === "") {
              this.linkUrl = ""
              this.linkParams = ""
            } else {
              this.linkParams = oscMatch[1]
              this.linkUrl = oscMatch[2]
            }
          }
          i = j - 1
          this.w += seq
          continue
        }
        this.w += ch
        continue
      }

      if (ch === "\n") {
        if (this.style !== "") {
          this.w += RESET
        }
        if (this.linkUrl !== "") {
          this.w += "\x1b]8;;\x07"
        }
        this.w += "\n"
        if (this.linkUrl !== "") {
          this.w += `\x1b]8;${this.linkParams};${this.linkUrl}\x07`
        }
        if (this.style !== "") {
          this.w += this.style
        }
        continue
      }

      this.w += ch
    }
  }

  flush(): string {
    if (this.closed) return ""
    const result = this.w
    this.w = ""
    return result
  }

  close(): string {
    let result = this.w
    if (this.style !== "") {
      result += RESET
    }
    if (this.linkUrl !== "") {
      result += "\x1b]8;;\x07"
    }
    this.w = ""
    this.style = ""
    this.linkUrl = ""
    this.linkParams = ""
    this.closed = true
    return result
  }

  getStyle(): string {
    return this.style
  }

  getLink(): { url: string; params: string } {
    return { url: this.linkUrl, params: this.linkParams }
  }
}

export function Wrap(str: string, width: number, breakpoints: string = ""): string {
  if (width <= 0) return str

  const wrapped = ansiWrap(str, width, breakpoints)
  const ww = new WrapWriter()
  ww.write(wrapped)
  return ww.close()
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
  for (let i = s.length - 1; i >= 0; i--) {
    if (s[i] === "\x1b") return true
    if (s[i] === "m") return false
  }
  return false
}
