// layer.ts | Layer and Compositor (lipgloss port)

import { Width, Height } from "./size"

export interface Rectangle {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function makeRect(x: number, y: number, w: number, h: number): Rectangle {
  return { minX: x, minY: y, maxX: x + w, maxY: y + h }
}

function rectUnion(a: Rectangle, b: Rectangle): Rectangle {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }
}

function rectOverlaps(a: Rectangle, b: Rectangle): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY
}

function rectContainsPoint(r: Rectangle, x: number, y: number): boolean {
  return x >= r.minX && x < r.maxX && y >= r.minY && y < r.maxY
}

/**
 * Layer represents a visual layer with content and positioning.
 */
export class Layer {
  private _id: string = ""
  private _content: string
  private _width: number = 0
  private _height: number = 0
  private _x: number = 0
  private _y: number = 0
  private _z: number = 0
  private _layers: Layer[] = []

  constructor(content: string = "", layers: Layer[] = []) {
    this._content = content
    this.addLayers(...layers)
  }

  getContent(): string { return this._content }
  width(): number { return this._width }
  height(): number { return this._height }
  getID(): string { return this._id }

  id(id: string): Layer { this._id = id; return this }
  x(x: number): Layer { this._x = x; return this }
  y(y: number): Layer { this._y = y; return this }
  z(z: number): Layer { this._z = z; return this }
  getX(): number { return this._x }
  getY(): number { return this._y }
  getZ(): number { return this._z }

  addLayers(...layers: Layer[]): Layer {
    for (let i = 0; i < layers.length; i++) {
      if (!layers[i]) throw new Error(`layer at index ${i} is nil`)
      this._layers.push(layers[i]!)
    }
    const area = this.boundsWithOffset(0, 0)
    this._width = area.maxX - area.minX
    this._height = area.maxY - area.minY
    return this
  }

  getLayer(id: string): Layer | null {
    if (id === "") return null
    if (this._id === id) return this
    for (const child of this._layers) {
      const found = child.getLayer(id)
      if (found) return found
    }
    return null
  }

  maxZ(): number {
    let maxZ = this._z
    for (const child of this._layers) {
      const childMaxZ = child.maxZ()
      if (childMaxZ > maxZ) maxZ = childMaxZ
    }
    return maxZ
  }

  private boundsWithOffset(parentX: number, parentY: number): Rectangle {
    const absX = this._x + parentX
    const absY = this._y + parentY
    const w = Width(this._content)
    const h = Height(this._content)
    let bounds = makeRect(absX, absY, w, h)
    for (const child of this._layers) {
      bounds = rectUnion(bounds, child.boundsWithOffset(absX, absY))
    }
    return bounds
  }

  draw(setCell: (x: number, y: number, char: string, style: string) => void): void {
    const lines = this._content.split("\n")
    for (let y = 0; y < lines.length; y++) {
      const line = lines[y]!
      for (let x = 0; x < line.length; x++) {
        const ch = line[x]!
        if (ch !== "\x1b") {
          setCell(this._x + x, this._y + y, ch, "")
        }
      }
    }
    for (const child of this._layers) {
      child.draw(setCell)
    }
  }
}

/**
 * LayerHit represents the result of a hit test.
 */
export class LayerHit {
  private _id: string = ""
  private _layer: Layer | null = null
  private _bounds: Rectangle = { minX: 0, minY: 0, maxX: 0, maxY: 0 }

  empty(): boolean { return this._layer === null }
  id(): string { return this._id }
  layer(): Layer | null { return this._layer }
  bounds(): Rectangle { return this._bounds }

  static from(id: string, layer: Layer | null, bounds: Rectangle): LayerHit {
    const h = new LayerHit()
    h._id = id
    h._layer = layer
    h._bounds = bounds
    return h
  }
}

interface CompositeLayer {
  layer: Layer
  absX: number
  absY: number
  bounds: Rectangle
}

/**
 * Compositor manages the composition of layers.
 */
export class Compositor {
  private root: Layer
  private _layers: CompositeLayer[] = []
  private index: Map<string, Layer> = new Map()
  private _bounds: Rectangle = { minX: 0, minY: 0, maxX: 0, maxY: 0 }

  constructor(...layers: Layer[]) {
    this.root = new Layer()
    this.root.addLayers(...layers)
    this.flatten()
  }

  addLayers(...layers: Layer[]): Compositor {
    this.root.addLayers(...layers)
    this.flatten()
    return this
  }

  private flatten(): void {
    this._layers = []
    this.index = new Map()
    this.flattenRecursive(this.root, 0, 0)
    this._layers.sort((a, b) => a.layer.getZ() - b.layer.getZ())
    if (this._layers.length > 0) {
      this._bounds = this._layers[0]!.bounds
      for (let i = 1; i < this._layers.length; i++) {
        this._bounds = rectUnion(this._bounds, this._layers[i]!.bounds)
      }
    }
  }

  private flattenRecursive(layer: Layer, parentX: number, parentY: number): void {
    const absX = layer.getX() + parentX
    const absY = layer.getY() + parentY
    const w = Width(layer.getContent())
    const h = Height(layer.getContent())
    const bounds = makeRect(absX, absY, w, h)
    this._layers.push({ layer, absX, absY, bounds })
    if (layer.getID() !== "") this.index.set(layer.getID(), layer)
  }

  bounds(): Rectangle { return this._bounds }

  draw(setCell: (x: number, y: number, char: string, style: string) => void): void {
    for (const cl of this._layers) {
      cl.layer.draw(setCell)
    }
  }

  hit(x: number, y: number): LayerHit {
    for (let i = this._layers.length - 1; i >= 0; i--) {
      const cl = this._layers[i]!
      if (cl.layer.getID() !== "" && rectContainsPoint(cl.bounds, x, y)) {
        return LayerHit.from(cl.layer.getID(), cl.layer, cl.bounds)
      }
    }
    return LayerHit.from("", null, { minX: 0, minY: 0, maxX: 0, maxY: 0 })
  }

  getLayer(id: string): Layer | null {
    if (id === "") return null
    return this.index.get(id) ?? null
  }

  refresh(): void { this.flatten() }

  render(): string {
    const w = this._bounds.maxX - this._bounds.minX
    const h = this._bounds.maxY - this._bounds.minY
    const grid: string[][] = []
    for (let y = 0; y < h; y++) {
      grid.push(new Array(w).fill(" "))
    }
    for (const cl of this._layers) {
      const content = cl.layer.getContent()
      const lines = content.split("\n")
      for (let y = 0; y < lines.length; y++) {
        const line = lines[y]!
        for (let x = 0; x < line.length; x++) {
          const gx = cl.absX - this._bounds.minX + x
          const gy = cl.absY - this._bounds.minY + y
          if (gy >= 0 && gy < h && gx >= 0 && gx < w) {
            grid[gy]![gx] = line[x]!
          }
        }
      }
    }
    return grid.map(row => row.join("")).join("\n")
  }
}
