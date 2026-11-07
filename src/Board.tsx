import { useRef, type PointerEvent } from 'react'
import {
  containsPoint,
  noteRectFromGesture,
  previewRect,
  type Point,
  type Rect,
  type Size,
} from './domain/geometry'
import {
  CLICK_SLOP,
  DEFAULT_NOTE_SIZE,
  MIN_NOTE_SIZE,
  type Note,
} from './domain/notes'
import { NoteCard } from './Note.tsx'

interface BoardProps {
  notes: readonly Note[]
  creating: boolean
  editingId: string | null
  onCreate: (rect: Rect) => void
  onMove: (id: string, x: number, y: number) => void
  onRemove: (id: string) => void
  onChangeText: (id: string, text: string) => void
}

export function Board({
  notes,
  creating,
  editingId,
  onCreate,
  onMove,
  onRemove,
  onChangeText,
}: BoardProps) {
  const boardRef = useRef<HTMLElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const trashRef = useRef<HTMLDivElement>(null)
  const gestureRef = useRef<{ pointerId: number; start: Point } | null>(null)

  // The highlight is a class on the trash element. React state here would
  // draw the notes again and reset the note that is being dragged.
  function setTrashOver(over: boolean) {
    trashRef.current?.classList.toggle('trash-over', over)
  }

  function isOverTrash(clientX: number, clientY: number): boolean {
    const trash = trashRef.current
    if (!trash) return false
    const bounds = trash.getBoundingClientRect()
    return containsPoint(
      { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height },
      { x: clientX, y: clientY },
    )
  }

  function dropNote(id: string, x: number, y: number, clientX: number, clientY: number) {
    setTrashOver(false)
    if (isOverTrash(clientX, clientY)) {
      onRemove(id)
      return
    }
    onMove(id, x, y)
  }

  function boardSize(): Size | null {
    const board = boardRef.current
    if (!board) return null
    return { width: board.clientWidth, height: board.clientHeight }
  }

  // clientX is relative to the viewport. Notes are positioned inside the board,
  // below the toolbar, so the origin has to be the board itself.
  function toBoardPoint(event: PointerEvent): Point | null {
    const board = boardRef.current
    if (!board) return null
    const bounds = board.getBoundingClientRect()
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
  }

  // The outline is written on the element. Storing it in React state on every
  // move would re-render the board while the pointer is moving.
  function paintPreview(rect: Rect) {
    const preview = previewRef.current
    if (!preview) return
    preview.hidden = false
    preview.style.transform = `translate(${rect.x}px, ${rect.y}px)`
    preview.style.width = `${rect.width}px`
    preview.style.height = `${rect.height}px`
  }

  function hidePreview() {
    const preview = previewRef.current
    if (!preview) return
    preview.hidden = true
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (!creating || event.button !== 0) return
    const start = toBoardPoint(event)
    const bounds = boardSize()
    if (!start || !bounds) return
    gestureRef.current = { pointerId: event.pointerId, start }
    // Capture keeps receiving moves if the pointer leaves the board.
    // It throws when the pointer is already gone. pointerup still ends the gesture.
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // The pointer is no longer active.
    }
    paintPreview(previewRect(start, start, bounds))
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    const end = toBoardPoint(event)
    const bounds = boardSize()
    if (!end || !bounds) return
    paintPreview(previewRect(gesture.start, end, bounds))
  }

  function finishGesture(event: PointerEvent<HTMLElement>, commit: boolean) {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    const end = toBoardPoint(event)
    const bounds = boardSize()
    gestureRef.current = null
    hidePreview()
    if (!commit || !end || !bounds) return
    onCreate(
      noteRectFromGesture(
        gesture.start,
        end,
        bounds,
        MIN_NOTE_SIZE,
        DEFAULT_NOTE_SIZE,
        CLICK_SLOP,
      ),
    )
  }

  return (
    <main
      ref={boardRef}
      className={creating ? 'board board-creating' : 'board'}
      aria-label="Board"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => finishGesture(event, true)}
      onPointerCancel={(event) => finishGesture(event, false)}
    >
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          getBoardSize={boardSize}
          isOverTrash={isOverTrash}
          onTrashHover={setTrashOver}
          onMove={onMove}
          onDrop={dropNote}
          onChangeText={onChangeText}
          startEditing={note.id === editingId}
        />
      ))}
      <div ref={trashRef} className="trash" role="img" aria-label="Trash">
        <svg className="trash-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13M10 11v6M14 11v6"
          />
        </svg>
      </div>
      <div ref={previewRef} className="note note-preview" hidden />
    </main>
  )
}
