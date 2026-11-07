import { useReducer, useState } from 'react'
import { Board } from './Board.tsx'
import { createNote, noteCountLabel, notesReducer } from './domain/notes'

export default function App() {
  const [notes, dispatch] = useReducer(notesReducer, [])
  const [creating, setCreating] = useState(false)

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
      <Board
        notes={notes}
        creating={creating}
        onCreate={(rect) => {
          dispatch({ type: 'add', note: createNote(rect) })
          // One press of the button creates one note. The next note needs the button again.
          setCreating(false)
        }}
        onMove={(id, x, y) => dispatch({ type: 'move', id, x, y })}
        onRemove={(id) => dispatch({ type: 'remove', id })}
      />
    </div>
  )
}
