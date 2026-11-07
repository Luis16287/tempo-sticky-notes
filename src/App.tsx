import { useEffect, useReducer, useRef, useState } from 'react'
import { Board } from './Board.tsx'
import { createNote, nextZIndex, noteCountLabel, notesReducer } from './domain/notes'
import { createLocalStorageNoteRepository } from './persistence/noteRepository.ts'

const SAVE_DELAY_MS = 300

export default function App() {
  const [notes, dispatch] = useReducer(notesReducer, [])
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [statusText, setStatusText] = useState('Loading')
  const repository = useRef(createLocalStorageNoteRepository())

  useEffect(() => {
    let cancelled = false
    repository.current
      .load()
      .then((loaded) => {
        if (cancelled) return
        dispatch({ type: 'replace', notes: loaded })
        setReady(true)
        setStatusText('')
      })
      .catch(() => {
        if (!cancelled) setStatusText('Could not load notes')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    // Wait a moment so typing does not write to storage on every key.
    const timer = window.setTimeout(() => {
      repository.current
        .save(notes)
        .then(() => setStatusText(''))
        .catch(() => setStatusText('Could not save notes'))
    }, SAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [notes, ready])

  return (
    <div className="app">
      <header className="toolbar">
        <h1 className="title">Sticky notes</h1>
        <p className="count" aria-live="polite">
          {statusText || noteCountLabel(notes.length)}
        </p>
        <button
          type="button"
          className={creating ? 'tool tool-active' : 'tool'}
          aria-pressed={creating}
          disabled={!ready}
          onClick={() => setCreating((value) => !value)}
        >
          New note
        </button>
      </header>
      <Board
        notes={notes}
        creating={creating}
        editingId={editingId}
        onCreate={(rect) => {
          const note = createNote(rect, crypto.randomUUID(), nextZIndex(notes))
          dispatch({ type: 'add', note })
          setEditingId(note.id)
          // One press of the button creates one note. The next note needs the button again.
          setCreating(false)
        }}
        onMove={(id, x, y) => dispatch({ type: 'move', id, x, y })}
        onRemove={(id) => dispatch({ type: 'remove', id })}
        onChangeText={(id, text) => dispatch({ type: 'changeText', id, text })}
        onResize={(id, width, height) => dispatch({ type: 'resize', id, width, height })}
        onBringToFront={(id) => dispatch({ type: 'bringToFront', id })}
      />
    </div>
  )
}
