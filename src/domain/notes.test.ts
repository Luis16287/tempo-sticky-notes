import { describe, expect, it } from 'vitest'
import { createNote, noteColor, noteCountLabel, notesReducer } from './notes'

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

  it('resizes one note and leaves the others as they are', () => {
    const existing = [
      createNote({ x: 0, y: 0, width: 200, height: 160 }, 'a'),
      createNote({ x: 40, y: 50, width: 200, height: 160 }, 'b'),
    ]

    const next = notesReducer(existing, { type: 'resize', id: 'b', width: 240, height: 180 })

    expect(next[1]).toEqual({ ...existing[1], width: 240, height: 180 })
    expect(next[0]).toBe(existing[0])
  })

  it('raises one note above the others', () => {
    const existing = [
      createNote({ x: 0, y: 0, width: 200, height: 160 }, 'a', 1),
      createNote({ x: 40, y: 50, width: 200, height: 160 }, 'b', 2),
    ]

    const next = notesReducer(existing, { type: 'bringToFront', id: 'a' })

    expect(next[0]).toEqual({ ...existing[0], zIndex: 3 })
    expect(next[1]).toBe(existing[1])
  })

  it('leaves the list alone when the note is already in front', () => {
    const existing = [
      createNote({ x: 0, y: 0, width: 200, height: 160 }, 'a', 1),
      createNote({ x: 40, y: 50, width: 200, height: 160 }, 'b', 2),
    ]

    expect(notesReducer(existing, { type: 'bringToFront', id: 'b' })).toBe(existing)
  })

  it('changes the color of one note only', () => {
    const existing = [
      createNote({ x: 0, y: 0, width: 200, height: 160 }, 'a'),
      createNote({ x: 40, y: 50, width: 200, height: 160 }, 'b'),
    ]

    const next = notesReducer(existing, { type: 'setColor', id: 'a', color: 'blue' })

    expect(next[0]).toEqual({ ...existing[0], color: 'blue' })
    expect(next[1]).toBe(existing[1])
  })

  it('leaves the list alone when the color does not change', () => {
    const existing = [createNote({ x: 0, y: 0, width: 200, height: 160 }, 'a')]

    expect(notesReducer(existing, { type: 'setColor', id: 'a', color: 'yellow' })).toBe(existing)
  })
})

describe('noteColor', () => {
  it('uses yellow when the color is unknown', () => {
    expect(noteColor('red').id).toBe('yellow')
  })
})
