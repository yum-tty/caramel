// ansi.ts | ANSI utility functions (shared by canvas, size, etc.)

/**
 * Strip ANSI escape codes from a string.
 */
export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "")
}
