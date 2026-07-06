# Caramel

<p>
    <a href="https://github.com/charmbracelet/lipgloss"><img src="https://img.shields.io/badge/original-lipgloss-blue" alt="Original Lip Gloss"></a>
    <a href="https://github.com/yum-tty/caramel"><img src="https://img.shields.io/badge/port-caramel-green" alt="Caramel Port"></a>
    <a href="https://bun.sh"><img src="https://img.shields.io/badge/runtime-bun-black" alt="Bun Runtime"></a>
</p>

Style definitions for nice terminal layouts. A TypeScript port of [Lip Gloss](https://github.com/charmbracelet/lipgloss) for Bun.

Caramel provides an expressive, declarative approach to terminal styling. Users familiar with CSS will feel at home with Caramel's fluent API.

## Installation

```bash
bun add github:yum-tty/caramel
```

Or install from a specific package:

```bash
bun add caramel
```

## Quick Start

```typescript
import { NewStyle } from "caramel"

const style = NewStyle()
  .bold(true)
  .foreground("#7f00ff")
  .background("#121212")
  .padding(1, 2)
  .border("rounded")
  .width(40)

console.log(style.Render("Hello, World!"))
```

## Features

### Text Formatting

```typescript
import { NewStyle } from "caramel"

const style = NewStyle()
  .bold(true)
  .italic(true)
  .underline(true)
  .strikethrough(true)
  .faint(true)
  .blink(true)
  .reverse(true)

console.log(style.Render("Formatted text"))
```

### Colors

```typescript
import { NewStyle } from "caramel"

// Hex colors
const hex = NewStyle().foreground("#FF00FF").background("#00FF00")

// RGB colors
const rgb = NewStyle().foreground({ r: 255, g: 0, b: 255 })

// ANSI 256 colors
const ansi256 = NewStyle().foreground({ ansi256: 196 })

// Adaptive colors (light/dark themes)
const adaptive = NewStyle().foreground({
  Light: "#000000",
  Dark: "#FFFFFF",
})

console.log(hex.Render("Hex colored"))
console.log(rgb.Render("RGB colored"))
console.log(ansi256.Render("ANSI 256 colored"))
console.log(adaptive.Render("Adaptive colored"))
```

### Padding and Margins

```typescript
import { NewStyle } from "caramel"

// Padding on all sides
const padded = NewStyle().padding(2)

// Padding on specific sides
const customPadding = NewStyle()
  .paddingTop(1)
  .paddingRight(2)
  .paddingBottom(1)
  .paddingLeft(2)

// Margins
const withMargins = NewStyle().margin(1, 2)

console.log(padded.Render("Padded text"))
console.log(withMargins.Render("Text with margins"))
```

### Borders

```typescript
import { NewStyle } from "caramel"

const bordered = NewStyle()
  .border("rounded")
  .borderForeground("#7f00ff")
  .padding(1)

console.log(bordered.Render("Bordered text"))
```

Available border styles: `normal`, `rounded`, `thick`, `double`, `dot`, `dashed`

### Width and Height

```typescript
import { NewStyle } from "caramel"

const sized = NewStyle()
  .width(40)
  .height(10)
  .align("center")

console.log(sized.Render("Centered in a 40x10 box"))
```

### Alignment

```typescript
import { NewStyle } from "caramel"

const left = NewStyle().width(40).align("left")
const center = NewStyle().width(40).align("center")
const right = NewStyle().width(40).align("right")

console.log(left.Render("Left aligned"))
console.log(center.Render("Centered"))
console.log(right.Render("Right aligned"))
```

### Word Wrapping

```typescript
import { NewStyle } from "caramel"

const wrapped = NewStyle().width(20)
console.log(wrapped.Render("This is a long text that will be wrapped at 20 characters"))
```

## Layout Helpers

### JoinHorizontal

```typescript
import { JoinHorizontal } from "caramel"

const block1 = "Line 1\nLine 2\nLine 3"
const block2 = "A\nB\nC"

// Join at top (0), center (0.5), or bottom (1)
console.log(JoinHorizontal(0, block1, block2))
```

### JoinVertical

```typescript
import { JoinVertical } from "caramel"

const block1 = "Hello"
const block2 = "World"

console.log(JoinVertical(0.5, block1, block2))
```

## Getters and Unsetters

```typescript
import { NewStyle } from "caramel"

const style = NewStyle()
  .bold(true)
  .foreground("#FF0000")
  .width(40)

// Getters
console.log(style.getBold())      // true
console.log(style.getForeground()) // "#FF0000"
console.log(style.getWidth())      // 40

// Unsetters
const unbold = style.unsetBold()
console.log(unbold.getBold())      // false
```

## API Reference

### Style Methods

| Method | Description |
|--------|-------------|
| `bold(v)` | Set bold formatting |
| `italic(v)` | Set italic formatting |
| `underline(v)` | Set underline formatting |
| `strikethrough(v)` | Set strikethrough formatting |
| `faint(v)` | Set dim/faint formatting |
| `reverse(v)` | Set reverse (invert) formatting |
| `blink(v)` | Set blink formatting |
| `foreground(c)` | Set foreground color |
| `background(c)` | Set background color |
| `width(i)` | Set width |
| `height(i)` | Set height |
| `padding(...args)` | Set padding |
| `margin(...args)` | Set margin |
| `border(t)` | Set border style |
| `align(a)` | Set alignment |
| `inline(v)` | Set inline mode |
| `maxWidth(i)` | Set max width |
| `maxHeight(i)` | Set max height |
| `transform(fn)` | Set transform function |
| `render(...strs)` | Apply style to text |

### Static Methods

| Method | Description |
|--------|-------------|
| `Style.width(str)` | Get visible width of styled text |
| `Style.height(str)` | Get visible height of styled text |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

## License

[MIT](./LICENSE)

---

Based on [Lip Gloss](https://github.com/charmbracelet/lipgloss) by [Charm](https://charm.sh).
