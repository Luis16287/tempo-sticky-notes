import { describe, expect, it, vi } from 'vitest'
import {
  NOTES_STORAGE_KEY,
  NOTES_URL,
  REPOSITORY_DELAY_MS,
  createLocalStorageHttpClient,
  createRestNoteRepository,
  parseStoredNotes,
  readStoredNotes,
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

describe('readStoredNotes', () => {
  it('does not treat an empty store as a broken list', () => {
    expect(readStoredNotes(null)).toEqual({ notes: [], ignored: false })
    expect(readStoredNotes(JSON.stringify({ version: 1, notes: [] }))).toEqual({
      notes: [],
      ignored: false,
    })
  })

  it('marks a broken or unknown payload as ignored', () => {
    expect(readStoredNotes('{').ignored).toBe(true)
    expect(readStoredNotes(JSON.stringify({ version: 2, notes: [note] })).ignored).toBe(true)
  })
})

describe('createRestNoteRepository', () => {
  it('saves with PUT and loads the same list with GET', async () => {
    const storage = memoryStorage()
    const http = createLocalStorageHttpClient(storage, 0)
    const repository = createRestNoteRepository(http)

    await repository.save([note])

    await expect(repository.load()).resolves.toEqual({ notes: [note], ignored: false })
    expect(storage.getItem(NOTES_STORAGE_KEY)).toBe(serializeNotes([note]))
  })

  it('does not PUT until the delay has passed', async () => {
    vi.useFakeTimers()
    try {
      const storage = memoryStorage()
      const http = createLocalStorageHttpClient(storage, REPOSITORY_DELAY_MS)
      const pending = http.put(NOTES_URL, JSON.parse(serializeNotes([note])) as unknown)

      expect(storage.getItem(NOTES_STORAGE_KEY)).toBeNull()

      await vi.advanceTimersByTimeAsync(REPOSITORY_DELAY_MS)
      await pending

      expect(parseStoredNotes(storage.getItem(NOTES_STORAGE_KEY))).toEqual([note])
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not GET until the delay has passed', async () => {
    vi.useFakeTimers()
    try {
      const storage = memoryStorage()
      storage.setItem(NOTES_STORAGE_KEY, serializeNotes([note]))
      const repository = createRestNoteRepository(
        createLocalStorageHttpClient(storage, REPOSITORY_DELAY_MS),
      )
      let loaded: unknown
      const pending = repository.load().then((notes) => {
        loaded = notes
      })

      await vi.advanceTimersByTimeAsync(REPOSITORY_DELAY_MS - 1)
      expect(loaded).toBeUndefined()

      await vi.advanceTimersByTimeAsync(1)
      await pending

      expect(loaded).toEqual({ notes: [note], ignored: false })
    } finally {
      vi.useRealTimers()
    }
  })
})
