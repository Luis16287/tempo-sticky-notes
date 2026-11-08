export interface SkeletonNote {
  x: number
  y: number
  width: number
  height: number
}

// Percent of the board. A new random rectangle on every draw would overlap
// the trash and jump if React draws the board again. One of these layouts
// stays put for the whole load. None of them covers the bottom-right corner.
const SKELETON_LAYOUTS: readonly (readonly SkeletonNote[])[] = [
  [
    { x: 3, y: 4, width: 20, height: 78 },
    { x: 26, y: 4, width: 48, height: 26 },
    { x: 26, y: 36, width: 30, height: 40 },
  ],
  [
    { x: 2, y: 4, width: 16, height: 72 },
    { x: 20, y: 4, width: 22, height: 28 },
    { x: 44, y: 4, width: 40, height: 24 },
    { x: 20, y: 36, width: 24, height: 24 },
    { x: 20, y: 64, width: 42, height: 26 },
  ],
  [
    { x: 2, y: 3, width: 15, height: 58 },
    { x: 19, y: 3, width: 18, height: 22 },
    { x: 39, y: 3, width: 42, height: 20 },
    { x: 19, y: 28, width: 22, height: 26 },
    { x: 43, y: 28, width: 20, height: 24 },
    { x: 19, y: 58, width: 38, height: 30 },
  ],
]

// Math.random is a decimal below 1. The layout index has to be 0, 1, or 2.
function randomLayoutIndex(): number {
  return Math.floor(Math.random() * SKELETON_LAYOUTS.length)
}

export function pickSkeletonLayout(index = randomLayoutIndex()): readonly SkeletonNote[] {
  return SKELETON_LAYOUTS[index] ?? SKELETON_LAYOUTS[0]
}
