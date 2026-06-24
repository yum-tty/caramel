// writer.ts | output functions (lipgloss port)

import { styleToString } from "./styled"

/**
 * Writer wraps a writer with color profile support.
 */
export class Writer {
  private writer: NodeJS.WriteStream

  constructor(writer: NodeJS.WriteStream = process.stdout) {
    this.writer = writer
  }

  /**
   * Print writes styled text.
   */
  print(...args: any[]): void {
    this.writer.write(args.join(" "))
  }

  /**
   * Println writes styled text with a newline.
   */
  println(...args: any[]): void {
    this.writer.write(args.join(" ") + "\n")
  }

  /**
   * Printf writes formatted styled text.
   */
  printf(format: string, ...args: any[]): void {
    this.writer.write(format.replace(/%s/g, () => String(args.shift())))
  }

  /**
   * Fprint writes to a specific writer.
   */
  fprint(writer: NodeJS.WriteStream, ...args: any[]): void {
    writer.write(args.join(" "))
  }

  /**
   * Fprintln writes to a specific writer with a newline.
   */
  fprintln(writer: NodeJS.WriteStream, ...args: any[]): void {
    writer.write(args.join(" ") + "\n")
  }

  /**
   * Fprintf writes formatted text to a specific writer.
   */
  fprintf(writer: NodeJS.WriteStream, format: string, ...args: any[]): void {
    writer.write(format.replace(/%s/g, () => String(args.shift())))
  }

  /**
   * Sprint returns a string.
   */
  sprint(...args: any[]): string {
    return args.join(" ")
  }

  /**
   * Sprintln returns a string with a newline.
   */
  sprintln(...args: any[]): string {
    return args.join(" ") + "\n"
  }

  /**
   * Sprintf returns a formatted string.
   */
  sprintf(format: string, ...args: any[]): string {
    return format.replace(/%s/g, () => String(args.shift()))
  }
}

/**
 * Default writer instance.
 */
export const Writer_ = new Writer()
