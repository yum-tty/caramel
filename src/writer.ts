export class Writer {
  private writer: NodeJS.WriteStream

  constructor(writer: NodeJS.WriteStream = process.stdout) {
    this.writer = writer
  }

  print(...args: any[]): void {
    this.writer.write(args.join(" "))
  }

  println(...args: any[]): void {
    this.writer.write(args.join(" ") + "\n")
  }

  printf(format: string, ...args: any[]): void {
    this.writer.write(formatPrintf(format, args))
  }

  fprint(writer: NodeJS.WriteStream, ...args: any[]): void {
    writer.write(args.join(" "))
  }

  fprintln(writer: NodeJS.WriteStream, ...args: any[]): void {
    writer.write(args.join(" ") + "\n")
  }

  fprintf(writer: NodeJS.WriteStream, format: string, ...args: any[]): void {
    writer.write(formatPrintf(format, args))
  }

  sprint(...args: any[]): string {
    return args.join(" ")
  }

  sprintln(...args: any[]): string {
    return args.join(" ") + "\n"
  }

  sprintf(format: string, ...args: any[]): string {
    return formatPrintf(format, args)
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
