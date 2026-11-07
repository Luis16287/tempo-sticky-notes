import { describe, expect, it } from 'vitest'
import {
  containsPoint,
  movedRect,
  noteRectFromGesture,
  rectFromPoints,
  resizedRect,
} from './geometry'

const bounds = { width: 800, height: 600 }
const minSize = { width: 140, height: 100 }
const defaultSize = { width: 200, height: 160 }

describe('rectFromPoints', () => {
  it('normalizes a drag that moves up and left', () => {
    expect(rectFromPoints({ x: 300, y: 240 }, { x: 120, y: 80 })).toEqual({
      x: 120,
      y: 80,
      width: 180,
      height: 160,
    })
  })
})

describe('noteRectFromGesture', () => {
  it('places the default note on a click', () => {
    expect(
      noteRectFromGesture({ x: 40, y: 50 }, { x: 42, y: 51 }, bounds, minSize, defaultSize),
    ).toEqual({ x: 40, y: 50, width: 200, height: 160 })
  })

  it('keeps a click near the corner inside the board', () => {
    expect(
      noteRectFromGesture({ x: 790, y: 580 }, { x: 790, y: 580 }, bounds, minSize, defaultSize),
    ).toEqual({ x: 600, y: 440, width: 200, height: 160 })
  })

  it('keeps a drag that is already large enough', () => {
    expect(
      noteRectFromGesture({ x: 50, y: 40 }, { x: 260, y: 200 }, bounds, minSize, defaultSize),
    ).toEqual({ x: 50, y: 40, width: 210, height: 160 })
  })

  it('grows a short drag toward the pointer until it reaches the minimum', () => {
    expect(
      noteRectFromGesture({ x: 400, y: 300 }, { x: 360, y: 280 }, bounds, minSize, defaultSize),
    ).toEqual({ x: 260, y: 200, width: 140, height: 100 })
  })

  it('pulls a minimum-sized note back inside the board', () => {
    expect(
      noteRectFromGesture({ x: 10, y: 8 }, { x: 0, y: 0 }, bounds, minSize, defaultSize),
    ).toEqual({ x: 0, y: 0, width: 140, height: 100 })
  })
})

describe('movedRect', () => {
  it('moves the note without changing its size', () => {
    expect(
      movedRect({ x: 10, y: 20, width: 200, height: 160 }, { x: 30, y: 40 }, bounds),
    ).toEqual({ x: 40, y: 60, width: 200, height: 160 })
  })

  it('stops the note at the board edge', () => {
    expect(
      movedRect({ x: 600, y: 40, width: 200, height: 160 }, { x: 500, y: -80 }, bounds),
    ).toEqual({ x: 600, y: 0, width: 200, height: 160 })
  })
})

describe('resizedRect', () => {
  const rect = { x: 40, y: 50, width: 200, height: 160 }

  it('grows from the bottom-right corner', () => {
    expect(resizedRect(rect, { x: 30, y: 20 }, bounds, minSize)).toEqual({
      x: 40,
      y: 50,
      width: 230,
      height: 180,
    })
  })

  it('does not shrink past the minimum size', () => {
    expect(resizedRect(rect, { x: -100, y: -90 }, bounds, minSize)).toEqual({
      x: 40,
      y: 50,
      width: 140,
      height: 100,
    })
  })

  it('stops at the board edge', () => {
    expect(
      resizedRect({ x: 600, y: 440, width: 160, height: 140 }, { x: 80, y: 80 }, bounds, minSize),
    ).toEqual({ x: 600, y: 440, width: 200, height: 160 })
  })
})

describe('containsPoint', () => {
  const zone = { x: 10, y: 20, width: 80, height: 40 }

  it('includes the border of the zone', () => {
    expect(containsPoint(zone, { x: 90, y: 60 })).toBe(true)
  })

  it('rejects a point just outside the zone', () => {
    expect(containsPoint(zone, { x: 91, y: 40 })).toBe(false)
  })
})
