// border.ts | border styles

import { getStringWidth } from "./ansi"

export interface BorderStyle {
  top: string
  bottom: string
  left: string
  right: string
  topLeft: string
  topRight: string
  bottomLeft: string
  bottomRight: string
  middleLeft?: string
  middleRight?: string
  middle?: string
  middleTop?: string
  middleBottom?: string
}

export function getTopSize(b: BorderStyle): number {
  return Math.max(stripWidth(b.topLeft), stripWidth(b.top), stripWidth(b.topRight))
}

export function getRightSize(b: BorderStyle): number {
  return Math.max(stripWidth(b.topRight), stripWidth(b.right), stripWidth(b.bottomRight))
}

export function getBottomSize(b: BorderStyle): number {
  return Math.max(stripWidth(b.bottomLeft), stripWidth(b.bottom), stripWidth(b.bottomRight))
}

export function getLeftSize(b: BorderStyle): number {
  return Math.max(stripWidth(b.topLeft), stripWidth(b.left), stripWidth(b.bottomLeft))
}

function stripWidth(s: string): number {
  return s.length > 0 ? Math.max(1, getStringWidth(s)) : 0
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

  block: {
    top: "\u2588",
    bottom: "\u2588",
    left: "\u2588",
    right: "\u2588",
    topLeft: "\u2588",
    topRight: "\u2588",
    bottomLeft: "\u2588",
    bottomRight: "\u2588",
    middleLeft: "\u2588",
    middleRight: "\u2588",
    middle: "\u2588",
    middleTop: "\u2588",
    middleBottom: "\u2588",
  } as BorderStyle,

  outerHalfBlock: {
    top: "\u2580",
    bottom: "\u2584",
    left: "\u258c",
    right: "\u2590",
    topLeft: "\u259b",
    topRight: "\u259c",
    bottomLeft: "\u2599",
    bottomRight: "\u259f",
  } as BorderStyle,

  innerHalfBlock: {
    top: "\u2584",
    bottom: "\u2580",
    left: "\u2590",
    right: "\u258c",
    topLeft: "\u2597",
    topRight: "\u2596",
    bottomLeft: "\u259d",
    bottomRight: "\u2598",
  } as BorderStyle,

  hidden: {
    top: " ",
    bottom: " ",
    left: " ",
    right: " ",
    topLeft: " ",
    topRight: " ",
    bottomLeft: " ",
    bottomRight: " ",
  } as BorderStyle,

  markdown: {
    top: "",
    bottom: "",
    left: ">",
    right: "",
    topLeft: "",
    topRight: "",
    bottomLeft: "",
    bottomRight: "",
  } as BorderStyle,

  ascii: {
    top: "-",
    bottom: "-",
    left: "|",
    right: "|",
    topLeft: "+",
    topRight: "+",
    bottomLeft: "+",
    bottomRight: "+",
  } as BorderStyle,
} as const

export type BorderType = keyof typeof borders
