import type { Rect } from './geometry'

export interface Note {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export const MIN_NOTE_SIZE = { width: 140, height: 100 }
export const DEFAULT_NOTE_SIZE = { width: 200, height: 160 }
// Movement smaller than this, in pixels, is a click and not a drag.
export const CLICK_SLOP = 4

export type NotesAction = { type: 'add'; note: Note }

export function createNote(rect: Rect, id: string = crypto.randomUUID()): Note {
  return { id, x: rect.x, y: rect.y, width: rect.width, height: rect.height }
}

export function noteCountLabel(count: number): string {
  if (count === 0) return 'No notes'
  if (count === 1) return '1 note'
  return `${count} notes`
}

export function notesReducer(notes: readonly Note[], action: NotesAction): Note[] {
  switch (action.type) {
    case 'add':
      return [...notes, action.note]
  }
}
