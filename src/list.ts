// list.ts | List data structure (lipgloss port)

import { Style, NewStyle } from "./style"
import { Tree, type Children, NodeChildren } from "./tree"
import type { StyleFunc, TreeEnumerator, TreeIndenter } from "./tree"

/**
 * Items represents list items (alias for Children).
 */
export type Items = Children

/**
 * Enumerator enumerates a list.
 */
export type Enumerator = (items: Items, index: number) => string

/**
 * Indenter indents children of a list.
 */
export type ListIndenter = (items: Items, index: number) => string

// Predefined enumerators

const ABC_LEN = 26

export function Alphabet(_items: Items, i: number): string {
  if (i < 0) return "?"
  if (i >= ABC_LEN * ABC_LEN + ABC_LEN) {
    return `${String.fromCharCode(65 + Math.floor(i / ABC_LEN / ABC_LEN) - 1)}${String.fromCharCode(65 + Math.floor(i / ABC_LEN) % ABC_LEN - 1)}${String.fromCharCode(65 + (i % ABC_LEN))}.`
  }
  if (i >= ABC_LEN) {
    return `${String.fromCharCode(65 + Math.floor(i / ABC_LEN) - 1)}${String.fromCharCode(65 + (i % ABC_LEN))}.`
  }
  return `${String.fromCharCode(65 + (i % ABC_LEN))}.`
}

export function Arabic(_items: Items, i: number): string {
  return `${i + 1}.`
}

export function Roman(_items: Items, i: number): string {
  const roman = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
  const arabic = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
  let result = ""
  let n = i
  for (let v = 0; v < arabic.length; v++) {
    while (n >= arabic[v]!) {
      n -= arabic[v]!
      result += roman[v]
    }
  }
  result += "."
  return result
}

export function Bullet(_items: Items, _i: number): string {
  return "\u2022"
}

export function Asterisk(_items: Items, _i: number): string {
  return "*"
}

export function Dash(_items: Items, _i: number): string {
  return "-"
}

/**
 * List represents a list of items that can be displayed.
 */
export class List {
  private tree: Tree

  constructor(items: any[] = []) {
    this.tree = new Tree()
    this.items(...items)
    this.enumerator(Bullet)
    this.indenter((_items: Items, _i: number) => " ")
  }

  hidden(): boolean {
    return this.tree.hidden()
  }

  hide(hide: boolean): List {
    this.tree.hide(hide)
    return this
  }

  offset(start: number, end: number): List {
    this.tree.offset(start, end)
    return this
  }

  value(): string {
    return this.tree.value()
  }

  toString(): string {
    return this.tree.toString()
  }

  enumeratorStyle(style: Style): List {
    this.tree.enumeratorStyle(style)
    return this
  }

  enumeratorStyleFunc(f: StyleFunc): List {
    this.tree.enumeratorStyleFunc(f)
    return this
  }

  indenterStyle(style: Style): List {
    this.tree.indenterStyle(style)
    return this
  }

  indenterStyleFunc(f: StyleFunc): List {
    this.tree.indenterStyleFunc(f)
    return this
  }

  indenter(indenterFn: ListIndenter): List {
    this.tree.indenter((children: Children, index: number) => indenterFn(children, index))
    return this
  }

  itemStyle(style: Style): List {
    this.tree.itemStyle(style)
    return this
  }

  itemStyleFunc(f: StyleFunc): List {
    this.tree.itemStyleFunc(f)
    return this
  }

  item(item: any): List {
    if (item instanceof List) {
      this.tree.child(item.tree)
    } else {
      this.tree.child(item)
    }
    return this
  }

  items(...items: any[]): List {
    for (const item of items) {
      this.item(item)
    }
    return this
  }

  /**
   * Get all item values (Go-compatible getter).
   */
  getItems(): string[] {
    const result: string[] = []
    const traverse = (children: Children) => {
      for (let i = 0; i < children.length(); i++) {
        const child = children.at(i)
        if (child) {
          result.push(child.value())
          traverse(child.children())
        }
      }
    }
    traverse(this.tree.childNodes)
    return result
  }

  enumerator(enumeratorFn: Enumerator): List {
    this.tree.enumerator((children: Children, i: number) => enumeratorFn(children, i))
    return this
  }
}

/**
 * New creates a new list with the given items.
 */
export function New(...items: any[]): List {
  return new List(items)
}
