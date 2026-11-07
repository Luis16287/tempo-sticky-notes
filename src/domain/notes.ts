import type { Rect } from './geometry'

export interface Note {
  id: string
  x: number
  y: number
  width: number
  height: number
  text: string
  zIndex: number
}

export const MIN_NOTE_SIZE = { width: 140, height: 100 }
export const DEFAULT_NOTE_SIZE = { width: 200, height: 160 }
// Movement smaller than this, in pixels, is a click and not a drag.
export const CLICK_SLOP = 4

export type NotesAction =
  | { type: 'add'; note: Note }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'remove'; id: string }
  | { type: 'changeText'; id: string; text: string }
  | { type: 'resize'; id: string; width: number; height: number }
  | { type: 'bringToFront'; id: string }
  | { type: 'replace'; notes: Note[] }

export function createNote(rect: Rect, id: string = crypto.randomUUID(), zIndex = 1): Note {
  return {
    id,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    text: '',
    zIndex,
  }
}

export function nextZIndex(notes: readonly Pick<Note, 'zIndex'>[]): number {
  return notes.reduce((max, note) => Math.max(max, note.zIndex), 0) + 1
}

export function noteCountLabel(count: number): string {
  if (count === 0) return 'No notes'
  if (count === 1) return '1 note'
  return `${count} notes`
}

export function notesReducer(notes: readonly Note[], action: NotesAction): readonly Note[] {
  switch (action.type) {
    case 'add':
      return [...notes, action.note]
    case 'move':
      return notes.map((note) =>
        note.id === action.id ? { ...note, x: action.x, y: action.y } : note,
      )
    case 'remove':
      return notes.filter((note) => note.id !== action.id)
    case 'changeText':
      return notes.map((note) =>
        note.id === action.id ? { ...note, text: action.text } : note,
      )
    case 'resize':
      return notes.map((note) =>
        note.id === action.id
          ? { ...note, width: action.width, height: action.height }
          : note,
      )
    case 'bringToFront': {
      const current = notes.find((note) => note.id === action.id)
      const top = notes.reduce((max, note) => Math.max(max, note.zIndex), 0)
      // Already in front. A new number would save the list for no visible change.
      if (!current || current.zIndex === top) return notes
      return notes.map((note) =>
        note.id === action.id ? { ...note, zIndex: top + 1 } : note,
      )
    }
    case 'replace':
      return action.notes
  }
}
