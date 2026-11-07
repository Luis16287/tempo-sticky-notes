import { useRef, type PointerEvent } from 'react'
import { movedRect, type Size } from './domain/geometry'
import type { Note } from './domain/notes'

interface NoteCardProps {
  note: Note
  getBoardSize: () => Size | null
  isOverTrash: (clientX: number, clientY: number) => boolean
  onTrashHover: (over: boolean) => void
  onMove: (id: string, x: number, y: number) => void
  onDrop: (id: string, x: number, y: number, clientX: number, clientY: number) => void
}

export function NoteCard({
  note,
  getBoardSize,
  isOverTrash,
  onTrashHover,
  onMove,
  onDrop,
}: NoteCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    pointerId: number
    originX: number
    originY: number
    startClientX: number
    startClientY: number
  } | null>(null)

  function paint(x: number, y: number) {
    const element = ref.current
    if (!element) return
    element.style.transform = `translate(${x}px, ${y}px)`
  }

  function nextPosition(clientX: number, clientY: number) {
    const drag = dragRef.current
    const bounds = getBoardSize()
    if (!drag || !bounds) return null
    return movedRect(
      { x: drag.originX, y: drag.originY, width: note.width, height: note.height },
      { x: clientX - drag.startClientX, y: clientY - drag.startClientY },
      bounds,
    )
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    // The board also listens for a drag. Stopping here keeps a note drag
    // from being treated as drawing a new note.
    event.stopPropagation()
    dragRef.current = {
      pointerId: event.pointerId,
      originX: note.x,
      originY: note.y,
      startClientX: event.clientX,
      startClientY: event.clientY,
    }
    // Capture keeps receiving moves if the pointer leaves the note.
    // It throws when the pointer is already gone. pointerup still ends the drag.
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // The pointer is no longer active.
    }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const next = nextPosition(event.clientX, event.clientY)
    if (!next) return
    // Follow the pointer on this element. Saving the position in React state
    // on every move would draw the other notes again.
    paint(next.x, next.y)
    onTrashHover(isOverTrash(event.clientX, event.clientY))
  }

  function endDrag(event: PointerEvent<HTMLDivElement>, commit: boolean) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const next = nextPosition(event.clientX, event.clientY)
    dragRef.current = null
    onTrashHover(false)
    if (!commit) {
      paint(drag.originX, drag.originY)
      return
    }
    // The pointer decides, not the edge of the note. Releasing outside the
    // trash keeps the note even if the note itself crossed the zone.
    if (isOverTrash(event.clientX, event.clientY)) {
      onDrop(note.id, next?.x ?? drag.originX, next?.y ?? drag.originY, event.clientX, event.clientY)
      return
    }
    if (!next || (next.x === drag.originX && next.y === drag.originY)) return
    onMove(note.id, next.x, next.y)
  }

  return (
    <div
      ref={ref}
      className="note"
      style={{
        transform: `translate(${note.x}px, ${note.y}px)`,
        width: note.width,
        height: note.height,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => endDrag(event, true)}
      onPointerCancel={(event) => endDrag(event, false)}
    />
  )
}
