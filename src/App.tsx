import { useEffect, useReducer, useRef, useState } from 'react'
import { Board } from './Board.tsx'
import { createNote, nextZIndex, noteCountLabel, notesReducer } from './domain/notes'
import { createRestNoteRepository } from './persistence/noteRepository.ts'
import { Toast, type ToastKind } from './Toast.tsx'

const SAVE_DELAY_MS = 300
const SUCCESS_TOAST_MS = 2500
const WARNING_TOAST_MS = 5000

interface ToastState {
  kind: ToastKind
  message: string
}

export default function App() {
  const [notes, dispatch] = useReducer(notesReducer, [])
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [toast, setToast] = useState<ToastState | null>(null)
  const repository = useRef(createRestNoteRepository())
  const toastTimer = useRef<number | null>(null)

  function clearToastTimer() {
    if (toastTimer.current === null) return
    window.clearTimeout(toastTimer.current)
    toastTimer.current = null
  }

  function showToast(kind: ToastKind, message: string) {
    clearToastTimer()
    setToast({ kind, message })
    // A success or warning can leave on its own. An error stays until it is dismissed
    // or a later save works.
    if (kind === 'error') return
    const delay = kind === 'success' ? SUCCESS_TOAST_MS : WARNING_TOAST_MS
    toastTimer.current = window.setTimeout(() => {
      setToast(null)
      toastTimer.current = null
    }, delay)
  }

  useEffect(() => {
    return () => clearToastTimer()
  }, [])

  useEffect(() => {
    let cancelled = false
    repository.current
      .load()
      .then((result) => {
        if (cancelled) return
        dispatch({ type: 'replace', notes: result.notes })
        setPhase('ready')
        if (result.ignored) {
          showToast('warning', 'Saved notes could not be read, so the board is empty.')
          return
        }
        showToast('success', 'Notes loaded')
      })
      .catch(() => {
        if (!cancelled) {
          setPhase('failed')
          showToast('error', 'Could not load notes')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (phase !== 'ready') return
    // Wait a moment so typing does not write to storage on every key.
    const timer = window.setTimeout(() => {
      repository.current
        .save(notes)
        .then(() => {
          setToast((current) => (current?.kind === 'error' ? null : current))
        })
        .catch(() => showToast('error', 'Could not save notes'))
    }, SAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [notes, phase])

  return (
    <div className="app">
      <header className="toolbar">
        <h1 className="title">Sticky notes</h1>
        <p className="count" aria-live="polite">
          {phase === 'loading' ? 'Loading' : noteCountLabel(notes.length)}
        </p>
        <button
          type="button"
          className={creating ? 'tool tool-active' : 'tool'}
          aria-pressed={creating}
          disabled={phase !== 'ready'}
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
        onSetColor={(id, color) => dispatch({ type: 'setColor', id, color })}
      />
      {toast ? (
        <Toast
          kind={toast.kind}
          message={toast.message}
          onDismiss={
            toast.kind === 'success'
              ? undefined
              : () => {
                  clearToastTimer()
                  setToast(null)
                }
          }
        />
      ) : null}
    </div>
  )
}
