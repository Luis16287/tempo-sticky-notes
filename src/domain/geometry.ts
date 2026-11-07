export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// The border counts as inside. Releasing the pointer on the edge of the trash
// should still delete the note.
export function containsPoint(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

export function clampPoint(point: Point, bounds: Size): Point {
  return {
    x: clamp(point.x, 0, bounds.width),
    y: clamp(point.y, 0, bounds.height),
  }
}

export function rectFromPoints(start: Point, end: Point): Rect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }
}

export function distance(start: Point, end: Point): number {
  return Math.hypot(end.x - start.x, end.y - start.y)
}

// The note keeps its size while it moves. If the drag would leave the board,
// the note stops at the edge instead of hanging outside.
export function movedRect(rect: Rect, delta: Point, bounds: Size): Rect {
  return clampRect(
    {
      x: rect.x + delta.x,
      y: rect.y + delta.y,
      width: rect.width,
      height: rect.height,
    },
    bounds,
  )
}

// Pull the rect back inside the board. The size is only reduced when the rect
// is larger than the board, so a note does not shrink just because it was
// drawn near the edge.
export function clampRect(rect: Rect, bounds: Size): Rect {
  const width = clamp(rect.width, 0, bounds.width)
  const height = clamp(rect.height, 0, bounds.height)
  return {
    width,
    height,
    x: clamp(rect.x, 0, Math.max(0, bounds.width - width)),
    y: clamp(rect.y, 0, Math.max(0, bounds.height - height)),
  }
}

// A drag that is too small grows to the minimum size in the direction of the
// pointer. If the pointer moved left, the extra width is added on the left.
function withMinSize(rect: Rect, min: Size, anchor: Point): Rect {
  let { x, y, width, height } = rect
  if (width < min.width) {
    width = min.width
    if (anchor.x > x) x = anchor.x - width
  }
  if (height < min.height) {
    height = min.height
    if (anchor.y > y) y = anchor.y - height
  }
  return { x, y, width, height }
}

// A very short movement is a click and uses the default size. Treating it as a
// drag would create a minimum-sized note instead, which is hard to do on purpose.
export function noteRectFromGesture(
  start: Point,
  end: Point,
  bounds: Size,
  minSize: Size,
  defaultSize: Size,
  clickSlop = 4,
): Rect {
  const clampedStart = clampPoint(start, bounds)
  const clampedEnd = clampPoint(end, bounds)
  if (distance(clampedStart, clampedEnd) < clickSlop) {
    return clampRect(
      {
        x: clampedStart.x,
        y: clampedStart.y,
        width: defaultSize.width,
        height: defaultSize.height,
      },
      bounds,
    )
  }

  return clampRect(
    withMinSize(rectFromPoints(clampedStart, clampedEnd), minSize, clampedStart),
    bounds,
  )
}

// The outline follows the pointer as it is. The minimum size is applied only
// when the button is released, so the outline does not jump while drawing.
export function previewRect(start: Point, end: Point, bounds: Size): Rect {
  return clampRect(
    rectFromPoints(clampPoint(start, bounds), clampPoint(end, bounds)),
    bounds,
  )
}
