import { useEffect, useRef, type PointerEvent } from 'react'
import { movedRect, resizedRect, type Size } from './domain/geometry'
import { MIN_NOTE_SIZE, type Note } from './domain/notes'

interface NoteCardProps {
  note: Note
  getBoardSize: () => Size | null
  isOverTrash: (clientX: number, clientY: number) => boolean
  onTrashHover: (over: boolean) => void
  onMove: (id: string, x: number, y: number) => void
  onDrop: (id: string, x: number, y: number, clientX: number, clientY: number) => void
  onChangeText: (id: string, text: string) => void
  onResize: (id: string, width: number, height: number) => void
  onBringToFront: (id: string) => void
  startEditing: boolean
}

export function NoteCard({
  note,
  getBoardSize,
  isOverTrash,
  onTrashHover,
  onMove,
  onDrop,
  onChangeText,
  onResize,
  onBringToFront,
  startEditing,
}: NoteCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const dragRef = useRef<{
    pointerId: number
    originX: number
    originY: number
    startClientX: number
    startClientY: number
  } | null>(null)
  const resizeRef = useRef<{
    pointerId: number
    originWidth: number
    originHeight: number
    startClientX: number
    startClientY: number
  } | null>(null)

  useEffect(() => {
    // Notes restored from storage are not focused. Only the one just created.
    if (startEditing) textRef.current?.focus()
  }, [startEditing])

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

  function raise() {
    onBringToFront(note.id)
  }

  function paintSize(width: number, height: number) {
    const element = ref.current
    if (!element) return
    element.style.width = `${width}px`
    element.style.height = `${height}px`
  }

  function nextSize(clientX: number, clientY: number) {
    const resize = resizeRef.current
    const bounds = getBoardSize()
    if (!resize || !bounds) return null
    return resizedRect(
      { x: note.x, y: note.y, width: resize.originWidth, height: resize.originHeight },
      { x: clientX - resize.startClientX, y: clientY - resize.startClientY },
      bounds,
      MIN_NOTE_SIZE,
    )
  }

  function onResizeDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.stopPropagation()
    raise()
    resizeRef.current = {
      pointerId: event.pointerId,
      originWidth: note.width,
      originHeight: note.height,
      startClientX: event.clientX,
      startClientY: event.clientY,
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // The pointer is no longer active.
    }
  }

  function onResizeMove(event: PointerEvent<HTMLDivElement>) {
    const resize = resizeRef.current
    if (!resize || resize.pointerId !== event.pointerId) return
    const next = nextSize(event.clientX, event.clientY)
    if (!next) return
    // Same as a move: the size stays on this element until the pointer is released.
    paintSize(next.width, next.height)
  }

  function endResize(event: PointerEvent<HTMLDivElement>, commit: boolean) {
    const resize = resizeRef.current
    if (!resize || resize.pointerId !== event.pointerId) return
    const next = nextSize(event.clientX, event.clientY)
    resizeRef.current = null
    if (!commit || !next) {
      paintSize(resize.originWidth, resize.originHeight)
      return
    }
    if (next.width === resize.originWidth && next.height === resize.originHeight) return
    onResize(note.id, next.width, next.height)
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    // The board also listens for a drag. Stopping here keeps a note drag
    // from being treated as drawing a new note.
    event.stopPropagation()
    raise()
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
        zIndex: note.zIndex,
      }}
    >
      <div
        className="note-header"
        aria-label="Drag note"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => endDrag(event, true)}
        onPointerCancel={(event) => endDrag(event, false)}
      >
        <svg className="note-grip" viewBox="0 0 16 10" aria-hidden="true">
          <circle cx="2" cy="2" r="1.25" />
          <circle cx="8" cy="2" r="1.25" />
          <circle cx="14" cy="2" r="1.25" />
          <circle cx="2" cy="8" r="1.25" />
          <circle cx="8" cy="8" r="1.25" />
          <circle cx="14" cy="8" r="1.25" />
        </svg>
      </div>
      <textarea
        ref={textRef}
        className="note-text"
        value={note.text}
        aria-label="Note text"
        onPointerDown={raise}
        onChange={(event) => onChangeText(note.id, event.target.value)}
      />
      <div
        className="note-resize"
        aria-label="Resize note"
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={(event) => endResize(event, true)}
        onPointerCancel={(event) => endResize(event, false)}
      >
        <svg className="note-resize-icon" viewBox="0 0 12 12" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            d="M10 4L4 10M10 8L8 10"
          />
        </svg>
      </div>
    </div>
  )
}
