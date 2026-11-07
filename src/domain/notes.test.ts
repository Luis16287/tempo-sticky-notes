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

  it('moves one note and leaves the others where they are', () => {
    const existing = [
      createNote({ x: 0, y: 0, width: 200, height: 160 }, 'a'),
      createNote({ x: 40, y: 50, width: 200, height: 160 }, 'b'),
    ]

    const next = notesReducer(existing, { type: 'move', id: 'b', x: 80, y: 90 })

    expect(next[0]).toBe(existing[0])
    expect(next[1]).toEqual({ ...existing[1], x: 80, y: 90 })
    expect(existing[1]?.x).toBe(40)
  })

  it('removes one note and leaves the others in place', () => {
    const existing = [
      createNote({ x: 0, y: 0, width: 200, height: 160 }, 'a'),
      createNote({ x: 40, y: 50, width: 200, height: 160 }, 'b'),
    ]

    const next = notesReducer(existing, { type: 'remove', id: 'a' })

    expect(next).toEqual([existing[1]])
    expect(existing).toHaveLength(2)
  })

  it('changes the text of one note only', () => {
    const existing = [
      createNote({ x: 0, y: 0, width: 200, height: 160 }, 'a'),
      createNote({ x: 40, y: 50, width: 200, height: 160 }, 'b'),
    ]

    const next = notesReducer(existing, { type: 'changeText', id: 'a', text: 'Hello' })

    expect(next[0]).toEqual({ ...existing[0], text: 'Hello' })
    expect(next[1]).toBe(existing[1])
  })
})
