// layer.ts | layer compositing (lipgloss port)

/**
 * LayerHit represents a hit test result.
 */
export interface LayerHit {
  id: string
  x: number
  y: number
  width: number
  height: number
}

/**
 * Layer represents a compositable layer.
 */
export class Layer {
  private content: string
  private id: string
  private x: number
  private y: number
  private z: number
  private layers: Layer[]

  constructor(content: string, layers: Layer[] = []) {
    this.content = content
    this.id = `layer_${Date.now()}_${Math.random().toString(36).slice(2)}`
    this.x = 0
    this.y = 0
    this.z = 0
    this.layers = layers
  }

  GetContent(): string { return this.content }
  Width(): number { return this.content.split("\n").reduce((max, l) => Math.max(max, l.length), 0) }
  Height(): number { return this.content.split("\n").length }
  GetID(): string { return this.id }
  ID(): string { return this.id }
  GetX(): number { return this.x }
  GetY(): number { return this.y }
  GetZ(): number { return this.z }
  X(x: number): void { this.x = x }
  Y(y: number): void { this.y = y }
  Z(z: number): void { this.z = z }

  AddLayers(layers: Layer[]): void { this.layers.push(...layers) }
  GetLayer(id: string): Layer | undefined { return this.layers.find((l) => l.id === id) }
  MaxZ(): number { return Math.max(0, ...this.layers.map((l) => l.z), this.z) }

  Draw(setCell: (x: number, y: number, char: string, style: string) => void): void {
    const lines = this.content.split("\n")
    for (let y = 0; y < lines.length; y++) {
      for (let x = 0; x < lines[y]!.length; x++) {
        setCell(this.x + x, this.y + y, lines[y]![x]!, "")
      }
    }
    for (const layer of this.layers) {
      layer.Draw(setCell)
    }
  }
}

/**
 * NewLayer creates a new layer.
 */
export function NewLayer(content: string, ...layers: Layer[]): Layer {
  return new Layer(content, layers)
}

/**
 * Compositor manages multiple layers.
 */
export class Compositor {
  private layers: Layer[]

  constructor(...layers: Layer[]) {
    this.layers = layers
  }

  AddLayers(layers: Layer[]): void { this.layers.push(...layers) }

  Bounds(): { x: number; y: number; width: number; height: number } {
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0
    for (const layer of this.layers) {
      minX = Math.min(minX, layer.GetX())
      minY = Math.min(minY, layer.GetY())
      maxX = Math.max(maxX, layer.GetX() + layer.Width())
      maxY = Math.max(maxY, layer.GetY() + layer.Height())
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }

  Draw(setCell: (x: number, y: number, char: string, style: string) => void): void {
    const sorted = [...this.layers].sort((a, b) => a.z - b.z)
    for (const layer of sorted) {
      layer.Draw(setCell)
    }
  }

  Hit(x: number, y: number): LayerHit | null {
    const sorted = [...this.layers].sort((a, b) => b.z - a.z)
    for (const layer of sorted) {
      if (x >= layer.GetX() && x < layer.GetX() + layer.Width() &&
          y >= layer.GetY() && y < layer.GetY() + layer.Height()) {
        return { id: layer.GetID(), x: layer.GetX(), y: layer.GetY(), width: layer.Width(), height: layer.Height() }
      }
    }
    return null
  }

  GetLayer(id: string): Layer | undefined { return this.layers.find((l) => l.GetID() === id) }

  Render(): string {
    const bounds = this.Bounds()
    const lines: string[] = []
    for (let y = 0; y < bounds.height; y++) {
      let line = ""
      for (let x = 0; x < bounds.width; x++) {
        let char = " "
        for (const layer of [...this.layers].sort((a, b) => a.z - b.z)) {
          const lx = x - layer.GetX()
          const ly = y - layer.GetY()
          if (lx >= 0 && ly >= 0) {
            const content = layer.GetContent()
            const contentLines = content.split("\n")
            if (ly < contentLines.length && lx < (contentLines[ly] || "").length) {
              char = contentLines[ly]![lx]!
            }
          }
        }
        line += char
      }
      lines.push(line)
    }
    return lines.join("\n")
  }
}

/**
 * NewCompositor creates a new compositor.
 */
export function NewCompositor(...layers: Layer[]): Compositor {
  return new Compositor(...layers)
}
