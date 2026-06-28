// position.ts | Position type (lipgloss port)

/**
 * Position represents a position along a horizontal or vertical axis.
 * 0 = start (left/top), 1 = end (right/bottom), 0.5 = center.
 */
export type Position = number

// Position constants
export const Top: Position = 0.0
export const Bottom: Position = 1.0
export const Center: Position = 0.5
export const Left: Position = 0.0
export const Right: Position = 1.0

/**
 * Clamp a position value between 0 and 1.
 */
export function positionValue(p: Position): number {
  return Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0
}

