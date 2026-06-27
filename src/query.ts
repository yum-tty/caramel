// query.ts | terminal queries (lipgloss port)

const ESC = "\x1b"

const QUERY_TIMEOUT_MS = 2000

function parseRgbHex(raw: string): string | null {
  const match = raw.match(
    /rgb:([0-9a-f]{2,4})\/([0-9a-f]{2,4})\/([0-9a-f]{2,4})/i
  )
  if (!match) return null
  const r = match[1].length > 2 ? match[1].slice(0, 2) : match[1].padEnd(2, "0")
  const g = match[2].length > 2 ? match[2].slice(0, 2) : match[2].padEnd(2, "0")
  const b = match[3].length > 2 ? match[3].slice(0, 2) : match[3].padEnd(2, "0")
  return `#${r}${g}${b}`
}

function queryTerminalBg(): string | null {
  if (process.platform === "win32") {
    return queryWindowsBg()
  }
  return queryUnixBg()
}

function queryUnixBg(): string | null {
  const query = `${ESC}]11;?${ESC}\\${ESC}[c`
  const script = [
    "old=$(stty -g 2>/dev/null)",
    "trap 'stty \"$old\" 2>/dev/null' EXIT",
    "stty raw -echo 2>/dev/null",
    `printf '${query.replace(/'/g, "'\\''")}' > /dev/tty`,
    "timeout 1 dd bs=256 count=1 < /dev/tty 2>/dev/null || true",
  ].join("; ")
  try {
    const result = Bun.spawnSync({
      cmd: ["bash", "-c", script],
      stdout: "pipe",
      stderr: "pipe",
    })
    if (result.exitCode !== 0 || !result.stdout) return null
    return parseRgbHex(result.stdout.toString())
  } catch {
    return null
  }
}

function queryWindowsBg(): string | null {
  const ps = [
    "Add-Type -TypeDefinition '",
    "using System;using System.Runtime.InteropServices;using System.IO;",
    "public class TQ{",
    "[DllImport(\"kernel32.dll\")]public static extern IntPtr GetStdHandle(int h);",
    "[DllImport(\"kernel32.dll\")]public static extern bool GetConsoleMode(IntPtr h,out uint m);",
    "[DllImport(\"kernel32.dll\")]public static extern bool SetConsoleMode(IntPtr h,uint m);",
    "}'",
    "$hIn=[TQ]::GetStdHandle(-10);$hOut=[TQ]::GetStdHandle(-11)",
    "[TQ]::GetConsoleMode($hIn,[ref]$m1)|Out-Null",
    "[TQ]::GetConsoleMode($hOut,[ref]$m2)|Out-Null",
    "[TQ]::SetConsoleMode($hIn,0)|Out-Null",
    "[TQ]::SetConsoleMode($hOut,0)|Out-Null",
    "$q=[char]27+']11;?'+[char]27+'\\\\'+[char]27+'[c'",
    "$sw=New-Object IO.StreamWriter([Console]::OpenStandardOutput())",
    "$sw.Write($q);$sw.Flush()",
    "$buf=New-Object byte[] 256",
    "$sr=New-Object IO.StreamReader([Console]::OpenStandardInput())",
    "$ct=$sr.Read($buf,0,256)",
    "[TQ]::SetConsoleMode($hIn,$m1)|Out-Null",
    "[TQ]::SetConsoleMode($hOut,$m2)|Out-Null",
    "[Text.Encoding]::UTF8.GetString($buf,0,$ct)",
  ].join(";")
  try {
    const result = Bun.spawnSync({
      cmd: ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps],
      stdout: "pipe",
      stderr: "pipe",
      timeout: QUERY_TIMEOUT_MS,
    })
    if (!result.stdout) return null
    return parseRgbHex(result.stdout.toString())
  } catch {
    return null
  }
}

export function BackgroundColor(): string | null {
  return queryTerminalBg()
}

export function HasDarkBackground(): boolean {
  const color = BackgroundColor()
  if (!color) return true
  const hex = color.replace("#", "")
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}
