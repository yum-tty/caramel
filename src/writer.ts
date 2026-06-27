export type ColorProfile = "none" | "ascii" | "ansi" | "ansi256" | "truecolor"

function detectProfile(writer?: NodeJS.WriteStream): ColorProfile {
  if (typeof process === "undefined") return "truecolor"

  if (!writer?.isTTY) return "none"

  if (process.env.NO_COLOR !== undefined) return "ascii"
  if (process.env.CLI_COLOR === "0") return "ascii"
  if (process.env.CLI_COLOR_FORCE !== undefined) return "truecolor"

  const term = process.env.TERM || ""
  const colorterm = process.env.COLORTERM || ""
  const termProgram = process.env.TERM_PROGRAM || ""

  if (colorterm === "truecolor" || colorterm === "24bit") return "truecolor"

  if (termProgram === "iTerm.app" || termProgram === "WezTerm" || termProgram === "ghostty") {
    return "truecolor"
  }

  if (term.includes("256color")) return "ansi256"
  if (term.includes("color") || term.includes("ansi")) return "ansi"

  return "ansi"
}

function downsampleColor(r: number, g: number, b: number, profile: ColorProfile): string {
  switch (profile) {
    case "truecolor":
      return `38;2;${r};${g};${b}`
    case "ansi256": {
      const idx = rgbToAnsi256(r, g, b)
      return `38;5;${idx}`
    }
    case "ansi": {
      const idx = rgbToAnsi16(r, g, b)
      return String(30 + idx)
    }
    case "ascii":
    case "none":
    default:
      return ""
  }
}

function downsampleBgColor(r: number, g: number, b: number, profile: ColorProfile): string {
  switch (profile) {
    case "truecolor":
      return `48;2;${r};${g};${b}`
    case "ansi256": {
      const idx = rgbToAnsi256(r, g, b)
      return `48;5;${idx}`
    }
    case "ansi": {
      const idx = rgbToAnsi16(r, g, b)
      return String(40 + idx)
    }
    case "ascii":
    case "none":
    default:
      return ""
  }
}

function downsampleUlColor(r: number, g: number, b: number, profile: ColorProfile): string {
  switch (profile) {
    case "truecolor":
      return `58;2;${r};${g};${b}`
    case "ansi256": {
      const idx = rgbToAnsi256(r, g, b)
      return `58;5;${idx}`
    }
    case "ansi": {
      const idx = rgbToAnsi16(r, g, b)
      return String(90 + idx)
    }
    case "ascii":
    case "none":
    default:
      return ""
  }
}

function rgbToAnsi256(r: number, g: number, b: number): number {
  if (r === g && g === b) {
    if (r < 8) return 16
    if (r > 248) return 231
    return Math.round(((r - 8) / 248) * 24) + 232
  }
  return 16 +
    36 * Math.round(r / 255 * 5) +
    6 * Math.round(g / 255 * 5) +
    Math.round(b / 255 * 5)
}

function rgbToAnsi16(r: number, g: number, b: number): number {
  const avg = (r + g + b) / 3
  const ri = r > avg ? 1 : 0
  const gi = g > avg ? 1 : 0
  const bi = b > avg ? 1 : 0
  const bright = (r + g + b) / 3 > 127 ? 1 : 0
  return (bright << 3) | (bi << 2) | (gi << 1) | ri
}

const SGR_RESET = "\x1b[0m"

function downsampleSgr(seq: string, profile: ColorProfile): string {
  if (profile === "truecolor") return seq

  const params = seq.slice(2, -1).split(";")
  const out: string[] = []

  for (const p of params) {
    const n = parseInt(p, 10)
    if (isNaN(n)) { out.push(p); continue }

    if (n === 0) { out.length = 0; out.push("0"); continue }
    if (n === 39 || n === 49 || n === 59) { out.push(String(n)); continue }

    if (n >= 30 && n <= 37) {
      if (profile === "ascii" || profile === "none") continue
      out.push(String(n))
      continue
    }
    if (n >= 40 && n <= 47) {
      if (profile === "ascii" || profile === "none") continue
      out.push(String(n))
      continue
    }
    if (n >= 90 && n <= 97) {
      if (profile === "ascii" || profile === "none") continue
      out.push(String(n))
      continue
    }
    if (n >= 100 && n <= 107) {
      if (profile === "ascii" || profile === "none") continue
      out.push(String(n))
      continue
    }

    if (n === 38 || n === 48 || n === 58) {
      const idx = params.indexOf(p)
      const next1 = params[idx + 1]
      const next2 = params[idx + 2]
      const next3 = params[idx + 3]
      const next4 = params[idx + 4]
      const sub = parseInt(next1, 10)

      if (sub === 2 && next2 !== undefined && next3 !== undefined && next4 !== undefined) {
        const r = parseInt(next2, 10)
        const g = parseInt(next3, 10)
        const b = parseInt(next4, 10)
        if (n === 38) out.push(downsampleColor(r, g, b, profile))
        else if (n === 48) out.push(downsampleBgColor(r, g, b, profile))
        else out.push(downsampleUlColor(r, g, b, profile))
      } else if (sub === 5 && next2 !== undefined) {
        if (profile === "ansi") {
          const val = parseInt(next2, 10)
          if (n === 38) out.push(String(30 + (val % 8)))
          else if (n === 48) out.push(String(40 + (val % 8)))
          else out.push(String(90 + (val % 8)))
        } else {
          out.push(String(n), "5", next2)
        }
      } else {
        out.push(String(n))
      }
    } else {
      out.push(p)
    }
  }

  return out.length === 0 ? "" : `\x1b[${out.join(";")}m`
}

function downsampleText(text: string, profile: ColorProfile): string {
  if (profile === "truecolor") return text

  return text.replace(/\x1b\[([0-9;]*)m/g, (match, params: string) => {
    const result = downsampleSgr(`\x1b[${params}m`, profile)
    return result
  })
}

export class Writer {
  private writer: NodeJS.WriteStream
  readonly profile: ColorProfile

  constructor(writer: NodeJS.WriteStream = process.stdout) {
    this.writer = writer
    this.profile = detectProfile(writer)
  }

  print(...args: any[]): void {
    const text = args.join(" ")
    this.writer.write(downsampleText(text, this.profile))
  }

  println(...args: any[]): void {
    const text = args.join(" ") + "\n"
    this.writer.write(downsampleText(text, this.profile))
  }

  printf(format: string, ...args: any[]): void {
    const text = formatPrintf(format, args)
    this.writer.write(downsampleText(text, this.profile))
  }

  fprint(writer: NodeJS.WriteStream, ...args: any[]): void {
    const text = args.join(" ")
    writer.write(downsampleText(text, this.profile))
  }

  fprintln(writer: NodeJS.WriteStream, ...args: any[]): void {
    const text = args.join(" ") + "\n"
    writer.write(downsampleText(text, this.profile))
  }

  fprintf(writer: NodeJS.WriteStream, format: string, ...args: any[]): void {
    const text = formatPrintf(format, args)
    writer.write(downsampleText(text, this.profile))
  }

  sprint(...args: any[]): string {
    const text = args.join(" ")
    return downsampleText(text, this.profile)
  }

  sprintln(...args: any[]): string {
    const text = args.join(" ") + "\n"
    return downsampleText(text, this.profile)
  }

  sprintf(format: string, ...args: any[]): string {
    const text = formatPrintf(format, args)
    return downsampleText(text, this.profile)
  }
}

function formatPrintf(format: string, args: any[]): string {
  let argIndex = 0
  return format.replace(/%([dsfweEgGt%])/g, (match, spec) => {
    if (spec === "%") return "%"
    if (argIndex >= args.length) return match
    const arg = args[argIndex++]
    switch (spec) {
      case "s": return String(arg)
      case "d": return String(parseInt(arg, 10))
      case "f": return String(parseFloat(arg))
      default: return String(arg)
    }
  })
}

export const Writer_ = new Writer()
