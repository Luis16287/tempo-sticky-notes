import { useReducer, useRef, useState, type PointerEvent } from 'react'
import { noteRectFromGesture, previewRect, type Point, type Rect } from './domain/geometry'
import {
  CLICK_SLOP,
  DEFAULT_NOTE_SIZE,
  MIN_NOTE_SIZE,
  createNote,
  noteCountLabel,
  notesReducer,
  type Note,
} from './domain/notes'

export default function App() {
  const [notes, dispatch] = useReducer(notesReducer, [])
  const [creating, setCreating] = useState(false)
  const boardRef = useRef<HTMLElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const gestureRef = useRef<{ pointerId: number; start: Point } | null>(null)

  function boardBounds(): { width: number; height: number } | null {
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
    const bounds = boardBounds()
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
    const bounds = boardBounds()
    if (!end || !bounds) return
    paintPreview(previewRect(gesture.start, end, bounds))
  }

  function finishGesture(event: PointerEvent<HTMLElement>, commit: boolean) {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    const end = toBoardPoint(event)
    const bounds = boardBounds()
    gestureRef.current = null
    hidePreview()
    if (!commit || !end || !bounds) return
    const rect = noteRectFromGesture(
      gesture.start,
      end,
      bounds,
      MIN_NOTE_SIZE,
      DEFAULT_NOTE_SIZE,
      CLICK_SLOP,
    )
    dispatch({ type: 'add', note: createNote(rect) })
    // One press of the button creates one note. The next note needs the button again.
    setCreating(false)
  }

  return (
    <div className="app">
      <header className="toolbar">
        <h1 className="title">Sticky notes</h1>
        <p className="count" aria-live="polite">
          {noteCountLabel(notes.length)}
        </p>
        <button
          type="button"
          className={creating ? 'tool tool-active' : 'tool'}
          aria-pressed={creating}
          onClick={() => setCreating((value) => !value)}
        >
          New note
        </button>
      </header>
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
          <NoteView key={note.id} note={note} />
        ))}
        <div ref={previewRef} className="note note-preview" hidden />
      </main>
    </div>
  )
}

function NoteView({ note }: { note: Note }) {
  return (
    <div
      className="note"
      style={{
        transform: `translate(${note.x}px, ${note.y}px)`,
        width: note.width,
        height: note.height,
      }}
    />
  )
}
