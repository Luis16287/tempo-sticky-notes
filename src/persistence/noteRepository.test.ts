import { describe, expect, it, vi } from 'vitest'
import {
  NOTES_STORAGE_KEY,
  REPOSITORY_DELAY_MS,
  createLocalStorageNoteRepository,
  parseStoredNotes,
  serializeNotes,
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
  color: 'yellow' as const,
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
      { id: 'a', x: 1, y: 2, width: 200, height: 160, text: '', zIndex: 1, color: 'yellow' },
    ])
  })

  it('fills in stacking when an older note does not have it', () => {
    const raw = JSON.stringify({
      version: 1,
      notes: [{ id: 'a', x: 1, y: 2, width: 200, height: 160, text: 'Hi' }],
    })
    expect(parseStoredNotes(raw)[0]?.zIndex).toBe(1)
  })

  it('uses yellow when the stored color is missing or unknown', () => {
    const raw = JSON.stringify({
      version: 1,
      notes: [{ id: 'a', x: 1, y: 2, width: 200, height: 160, text: 'Hi', zIndex: 2, color: 'red' }],
    })
    expect(parseStoredNotes(raw)[0]?.color).toBe('yellow')
  })
})

describe('createLocalStorageNoteRepository', () => {
  it('saves notes and loads the same list', async () => {
    const repository = createLocalStorageNoteRepository(memoryStorage(), NOTES_STORAGE_KEY, 0)

    await repository.save([note])

    await expect(repository.load()).resolves.toEqual([note])
  })

  it('does not write until the delay has passed', async () => {
    vi.useFakeTimers()
    try {
      const storage = memoryStorage()
      const repository = createLocalStorageNoteRepository(
        storage,
        NOTES_STORAGE_KEY,
        REPOSITORY_DELAY_MS,
      )
      const pending = repository.save([note])

      expect(storage.getItem(NOTES_STORAGE_KEY)).toBeNull()

      await vi.advanceTimersByTimeAsync(REPOSITORY_DELAY_MS)
      await pending

      expect(parseStoredNotes(storage.getItem(NOTES_STORAGE_KEY))).toEqual([note])
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not read until the delay has passed', async () => {
    vi.useFakeTimers()
    try {
      const storage = memoryStorage()
      storage.setItem(NOTES_STORAGE_KEY, serializeNotes([note]))
      const repository = createLocalStorageNoteRepository(
        storage,
        NOTES_STORAGE_KEY,
        REPOSITORY_DELAY_MS,
      )
      let loaded: unknown
      const pending = repository.load().then((notes) => {
        loaded = notes
      })

      await vi.advanceTimersByTimeAsync(REPOSITORY_DELAY_MS - 1)
      expect(loaded).toBeUndefined()

      await vi.advanceTimersByTimeAsync(1)
      await pending

      expect(loaded).toEqual([note])
    } finally {
      vi.useRealTimers()
    }
  })
})
