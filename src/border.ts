// border.ts | border styles

export interface BorderStyle {
  top: string
  bottom: string
  left: string
  right: string
  topLeft: string
  topRight: string
  bottomLeft: string
  bottomRight: string
}

export const borders = {
  none: null,

  normal: {
    top: "─",
    bottom: "─",
    left: "│",
    right: "│",
    topLeft: "┌",
    topRight: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
  } as BorderStyle,

  rounded: {
    top: "─",
    bottom: "─",
    left: "│",
    right: "│",
    topLeft: "╭",
    topRight: "╮",
    bottomLeft: "╰",
    bottomRight: "╯",
  } as BorderStyle,

  thick: {
    top: "━",
    bottom: "━",
    left: "┃",
    right: "┃",
    topLeft: "┏",
    topRight: "┓",
    bottomLeft: "┗",
    bottomRight: "┛",
  } as BorderStyle,

  double: {
    top: "═",
    bottom: "═",
    left: "║",
    right: "║",
    topLeft: "╔",
    topRight: "╗",
    bottomLeft: "╚",
    bottomRight: "╝",
  } as BorderStyle,

  dot: {
    top: "┄",
    bottom: "┄",
    left: "┊",
    right: "┊",
    topLeft: "┌",
    topRight: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
  } as BorderStyle,

  dashed: {
    top: "╌",
    bottom: "╌",
    left: "╎",
    right: "╎",
    topLeft: "┌",
    topRight: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
  } as BorderStyle,
} as const

export type BorderType = keyof typeof borders
