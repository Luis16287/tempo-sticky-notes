import { describe, expect, it } from 'vitest'
import {
  NOTES_STORAGE_KEY,
  createLocalStorageNoteRepository,
  parseStoredNotes,
} from './noteRepository'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem(key: string) {
      return values.get(key) ?? null
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
}

const note = {
  id: 'a',
  x: 10,
  y: 20,
  width: 200,
  height: 160,
  text: 'Hello',
  zIndex: 1,
}

describe('parseStoredNotes', () => {
  it('returns an empty list when nothing is stored', () => {
    expect(parseStoredNotes(null)).toEqual([])
  })

  it('returns an empty list for a broken or unknown payload', () => {
    expect(parseStoredNotes('{')).toEqual([])
    expect(parseStoredNotes(JSON.stringify({ version: 2, notes: [note] }))).toEqual([])
  })

  it('fills in text when an older note does not have it', () => {
    const raw = JSON.stringify({
      version: 1,
      notes: [{ id: 'a', x: 1, y: 2, width: 200, height: 160 }],
    })
    expect(parseStoredNotes(raw)).toEqual([
      { id: 'a', x: 1, y: 2, width: 200, height: 160, text: '', zIndex: 1 },
    ])
  })

  it('fills in stacking when an older note does not have it', () => {
    const raw = JSON.stringify({
      version: 1,
      notes: [{ id: 'a', x: 1, y: 2, width: 200, height: 160, text: 'Hi' }],
    })
    expect(parseStoredNotes(raw)[0]?.zIndex).toBe(1)
  })
})

describe('createLocalStorageNoteRepository', () => {
  it('saves notes and loads the same list', async () => {
    const repository = createLocalStorageNoteRepository(memoryStorage(), NOTES_STORAGE_KEY)

    await repository.save([note])

    await expect(repository.load()).resolves.toEqual([note])
  })
})
