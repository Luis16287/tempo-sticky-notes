import { describe, expect, it } from 'vitest'
import { createNote, noteCountLabel, notesReducer } from './notes'

describe('noteCountLabel', () => {
  it('uses the singular only for one note', () => {
    expect(noteCountLabel(0)).toBe('No notes')
    expect(noteCountLabel(1)).toBe('1 note')
    expect(noteCountLabel(2)).toBe('2 notes')
  })
})

describe('notesReducer', () => {
  it('appends a note without changing the previous list', () => {
    const existing = [createNote({ x: 0, y: 0, width: 200, height: 160 }, 'a')]
    const added = createNote({ x: 20, y: 30, width: 140, height: 100 }, 'b')

    const next = notesReducer(existing, { type: 'add', note: added })

    expect(next).toEqual([...existing, added])
    expect(existing).toHaveLength(1)
  })
})
