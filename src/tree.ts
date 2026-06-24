// tree.ts | Tree data structure (lipgloss port)

import { Style, NewStyle } from "./style"
import { Width, Height } from "./size"

/**
 * Node defines a node in a tree.
 */
export interface Node {
  value(): string
  children(): Children
  hidden(): boolean
  setHidden(h: boolean): void
  setValue(v: any): void
  toString(): string
}

/**
 * Children is the interface that wraps the basic methods of a tree model.
 */
export interface Children {
  at(index: number): Node | null
  length(): number
}

/**
 * NodeChildren is the implementation of Children with tree Nodes.
 */
export class NodeChildren implements Children {
  private data: Node[]

  constructor(data: Node[] = []) {
    this.data = data
  }

  at(i: number): Node | null {
    if (i >= 0 && i < this.data.length) return this.data[i]!
    return null
  }

  length(): number {
    return this.data.length
  }

  append(child: Node): NodeChildren {
    return new NodeChildren([...this.data, child])
  }

  remove(index: number): NodeChildren {
    if (index < 0 || index >= this.data.length) return this
    const newData = [...this.data]
    newData.splice(index, 1)
    return new NodeChildren(newData)
  }
}

/**
 * Leaf is a node without children.
 */
export class Leaf implements Node {
  private _value: string = ""
  private _hidden: boolean = false

  constructor(value: any = "", hidden: boolean = false) {
    this.setValue(value)
    this._hidden = hidden
  }

  value(): string { return this._value }
  children(): Children { return new NodeChildren() }
  hidden(): boolean { return this._hidden }
  setHidden(hidden: boolean): void { this._hidden = hidden }
  setValue(value: any): void {
    if (value === null || value === undefined) {
      this._value = ""
    } else if (typeof value === "string") {
      this._value = value
    } else if (typeof value === "object" && "toString" in value) {
      this._value = value.toString()
    } else {
      this._value = String(value)
    }
  }
  toString(): string { return this.value() }
}

export function NewStringData(...data: string[]): Children {
  const nodes: Node[] = data.map(d => new Leaf(d))
  return new NodeChildren(nodes)
}

/**
 * StyleFunc allows the tree to be styled per item.
 */
export type StyleFunc = (children: Children, index: number) => Style

/**
 * TreeEnumerator enumerates a tree.
 */
export type TreeEnumerator = (children: Children, index: number) => string

/**
 * TreeIndenter indents the children of a tree.
 */
export type TreeIndenter = (children: Children, index: number) => string

export function DefaultEnumerator(children: Children, index: number): string {
  if (children.length() - 1 === index) {
    return "\u2514\u2500\u2500"
  }
  return "\u251c\u2500\u2500"
}

export function RoundedEnumerator(children: Children, index: number): string {
  if (children.length() - 1 === index) {
    return "\u2570\u2500\u2500"
  }
  return "\u251c\u2500\u2500"
}

export function DefaultIndenter(children: Children, index: number): string {
  if (children.length() - 1 === index) {
    return "   "
  }
  return "\u2502  "
}

interface TreeStyle {
  enumeratorFunc: StyleFunc
  indenterFunc: StyleFunc
  itemFunc: StyleFunc
  root: Style
}

function newTreeStyle(): TreeStyle {
  return {
    enumeratorFunc: () => NewStyle().padding(0, 1, 0, 0),
    indenterFunc: () => NewStyle().padding(0, 1, 0, 0),
    itemFunc: () => NewStyle(),
    root: NewStyle(),
  }
}

interface TreeRenderer {
  style: TreeStyle
  enumerator: TreeEnumerator
  indenter: TreeIndenter
  width: number
  render(node: Node, root: boolean, prefix: string): string
}

function newRenderer(): TreeRenderer {
  const r: TreeRenderer = {
    style: newTreeStyle(),
    enumerator: DefaultEnumerator,
    indenter: DefaultIndenter,
    width: 0,
    render: (node: Node, root: boolean, prefix: string) => "",
  }
  r.render = (node: Node, root: boolean, prefix: string) => renderNode(r, node, root, prefix)
  return r
}

function ensureParent(nodes: Children, item: Tree): { node: Tree; removeIndex: number } {
  if (item.value() !== "" || nodes.length() === 0) {
    return { node: item, removeIndex: -1 }
  }
  const j = nodes.length() - 1
  const parent = nodes.at(j)
  if (parent instanceof Tree) {
    for (let i = 0; i < item.childNodes.length(); i++) {
      parent.child(item.childNodes.at(i)!)
    }
    return { node: parent, removeIndex: j }
  }
  if (parent instanceof Leaf) {
    item._value = parent.value()
    return { node: item, removeIndex: j }
  }
  return { node: item, removeIndex: -1 }
}

/**
 * Tree implements a Node.
 */
export class Tree implements Node {
  _value: string = ""
  _hidden: boolean = false
  private _offset: [number, number] = [0, 0]
  childNodes: NodeChildren = new NodeChildren()
  _r: TreeRenderer | null = null

  hidden(): boolean { return this._hidden }

  hide(hide: boolean): Tree {
    this._hidden = hide
    return this
  }

  setHidden(hidden: boolean): void { this.hide(hidden) }

  offset(start: number, end: number): Tree {
    if (start > end) {
      const tmp = start
      start = end
      end = tmp
    }
    if (start < 0) start = 0
    if (end < 0 || end > this.childNodes.length()) {
      end = this.childNodes.length()
    }
    this._offset = [start, end]
    return this
  }

  value(): string { return this._value }

  setValue(value: any): void {
    this.root(value)
  }

  root(rootValue: any): Tree {
    if (rootValue instanceof Tree) {
      this._value = rootValue.value()
      this.child(rootValue.children())
    } else if (rootValue === null || rootValue === undefined) {
      this._value = ""
    } else if (typeof rootValue === "string") {
      this._value = rootValue
    } else {
      this._value = String(rootValue)
    }
    return this
  }

  toString(): string {
    return this.ensureRenderer().render(this, true, "")
  }

  child(...children: any[]): Tree {
    for (const child of children) {
      if (child instanceof Tree) {
        const result = ensureParent(this.childNodes, child)
        if (result.removeIndex >= 0) {
          this.childNodes = this.childNodes.remove(result.removeIndex)
        }
        this.childNodes = this.childNodes.append(result.node)
      } else if (child instanceof NodeChildren) {
        for (let i = 0; i < child.length(); i++) {
          const node = child.at(i)
          if (node) this.childNodes = this.childNodes.append(node)
        }
      } else if (child instanceof Leaf || (child && typeof child === "object" && "value" in child && "children" in child)) {
        this.childNodes = this.childNodes.append(child as Node)
      } else if (Array.isArray(child)) {
        this.child(...child)
      } else if (child === null || child === undefined) {
        continue
      } else if (typeof child === "string") {
        this.childNodes = this.childNodes.append(new Leaf(child))
      } else {
        this.childNodes = this.childNodes.append(new Leaf(String(child)))
      }
    }
    return this
  }

  ensureRenderer(): TreeRenderer {
    if (!this._r) this._r = newRenderer()
    return this._r
  }

  enumeratorStyle(style: Style): Tree {
    this.ensureRenderer().style.enumeratorFunc = () => style
    return this
  }

  enumeratorStyleFunc(fn: StyleFunc): Tree {
    this.ensureRenderer().style.enumeratorFunc = fn
    return this
  }

  indenterStyle(style: Style): Tree {
    this.ensureRenderer().style.indenterFunc = () => style
    return this
  }

  indenterStyleFunc(fn: StyleFunc): Tree {
    this.ensureRenderer().style.indenterFunc = fn
    return this
  }

  rootStyle(style: Style): Tree {
    this.ensureRenderer().style.root = style
    return this
  }

  itemStyle(style: Style): Tree {
    this.ensureRenderer().style.itemFunc = () => style
    return this
  }

  itemStyleFunc(fn: StyleFunc): Tree {
    this.ensureRenderer().style.itemFunc = fn
    return this
  }

  enumerator(enumFn: TreeEnumerator): Tree {
    this.ensureRenderer().enumerator = enumFn
    return this
  }

  indenter(indenterFn: TreeIndenter): Tree {
    this.ensureRenderer().indenter = indenterFn
    return this
  }

  width(w: number): Tree {
    this.ensureRenderer().width = w
    return this
  }

  children(): Children {
    const data: Node[] = []
    for (let i = this._offset[0]; i < this.childNodes.length() - this._offset[1]; i++) {
      const node = this.childNodes.at(i)
      if (node) data.push(node)
    }
    return new NodeChildren(data)
  }
}

export function Root(root: any): Tree {
  const t = new Tree()
  return t.root(root)
}

function stripAnsiLocal(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "")
}

function repeatStr(s: string, n: number): string {
  return s.repeat(n)
}

function renderNode(r: TreeRenderer, node: Node, root: boolean, prefix: string): string {
  if (node.hidden()) return ""

  let maxLen = 0
  const children = node.children()
  const enumerator = r.enumerator
  const indenter = r.indenter
  const strs: string[] = []

  if (root && node.value() !== "") {
    let line = r.style.root.render(node.value())
    const pad = r.width - Width(line)
    if (pad > 0) {
      line = node.value() + r.style.root.render(repeatStr(" ", pad))
    }
    strs.push(r.style.root.render(line))
  }

  let effectiveChildren = new NodeChildren()
  for (let i = 0; i < children.length(); i++) {
    effectiveChildren = effectiveChildren.append(children.at(i)!)
  }

  for (let i = 0; i < effectiveChildren.length(); i++) {
    if (i < effectiveChildren.length() - 1) {
      const nextChild = effectiveChildren.at(i + 1)
      if (nextChild && nextChild.hidden()) {
        effectiveChildren = effectiveChildren.remove(i + 1)
        break
      }
    }
  }

  for (let i = 0; i < effectiveChildren.length(); i++) {
    let prefixStr = enumerator(effectiveChildren, i)
    prefixStr = r.style.enumeratorFunc(effectiveChildren, i).render(prefixStr)
    maxLen = Math.max(Width(prefixStr), maxLen)
  }

  for (let i = 0; i < effectiveChildren.length(); i++) {
    const child = effectiveChildren.at(i)!
    if (child.hidden()) continue

    const indentStyle = r.style.indenterFunc(effectiveChildren, i)
    const enumStyle = r.style.enumeratorFunc(effectiveChildren, i)
    const itemStyle = r.style.itemFunc(effectiveChildren, i)

    const indent = indentStyle.render(indenter(effectiveChildren, i))
    let nodePrefix = enumStyle.render(enumerator(effectiveChildren, i))

    const l = maxLen - Width(nodePrefix)
    if (l > 0) {
      nodePrefix = repeatStr(" ", l) + nodePrefix
    }

    let item = itemStyle.render(child.value())
    let multiLinePrefix = ""

    while (Height(item) > Height(nodePrefix)) {
      nodePrefix = joinVerticalLocal(nodePrefix, indent)
    }
    while (Height(nodePrefix) > Height(multiLinePrefix)) {
      multiLinePrefix = joinVerticalLocal(multiLinePrefix, prefix)
    }

    let line = joinHorizontalLocal(multiLinePrefix, nodePrefix, item)

    const pad = r.width - Width(line)
    if (pad > 0) {
      line = line + itemStyle.render(repeatStr(" ", pad))
    }
    strs.push(line)

    if (children.length() > 0) {
      let renderer = r
      if (child instanceof Tree && child._r) {
        renderer = child._r
      }
      const s = renderNode(renderer, child, false, prefix + indent)
      if (s !== "") strs.push(s)
    }
  }

  return strs.join("\n")
}

function joinVerticalLocal(...strs: string[]): string {
  const lines = strs.map(s => s.split("\n"))
  const maxWidth = Math.max(...lines.map(l => Math.max(...l.map(ll => stripAnsiLocal(ll).length))))
  const result: string[] = []
  for (const block of lines) {
    for (const line of block) {
      const vis = stripAnsiLocal(line).length
      const pad = " ".repeat(maxWidth - vis)
      result.push(line + pad)
    }
  }
  return result.join("\n")
}

function joinHorizontalLocal(...strs: string[]): string {
  const blocks = strs.map(s => s.split("\n"))
  const maxLines = Math.max(...blocks.map(b => b.length))
  const colWidths = blocks.map(b =>
    Math.max(...b.map(l => stripAnsiLocal(l).length))
  )
  const result: string[] = []
  for (let i = 0; i < maxLines; i++) {
    let line = ""
    for (let j = 0; j < blocks.length; j++) {
      const col = blocks[j]!
      const l = col[i] ?? ""
      const vis = stripAnsiLocal(l).length
      const pad = " ".repeat(colWidths[j]! - vis)
      line += l + pad
    }
    result.push(line)
  }
  return result.join("\n")
}
