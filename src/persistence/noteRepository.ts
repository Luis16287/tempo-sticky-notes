import { noteColor, type Note } from '../domain/notes.ts'

export const NOTES_STORAGE_KEY = 'sticky-notes'
// The pause stands in for a request. Callers already wait on the promise,
// so a real API can replace this repository without changing the board.
export const REPOSITORY_DELAY_MS = 200
const SCHEMA_VERSION = 1

export interface NoteRepository {
  load(): Promise<Note[]>
  save(notes: readonly Note[]): Promise<void>
}

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

// A stored list from another version is ignored. The board starts empty
// instead of crashing on data it does not understand.
export function parseStoredNotes(raw: string | null): Note[] {
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!parsed || typeof parsed !== 'object') return []
  const record = parsed as { version?: unknown; notes?: unknown }
  if (record.version !== SCHEMA_VERSION || !Array.isArray(record.notes)) return []
  return record.notes.flatMap(toNote)
}

function toNote(value: unknown): Note[] {
  if (!value || typeof value !== 'object') return []
  const note = value as Record<string, unknown>
  if (
    typeof note.id !== 'string' ||
    typeof note.x !== 'number' ||
    typeof note.y !== 'number' ||
    typeof note.width !== 'number' ||
    typeof note.height !== 'number'
  ) {
    return []
  }
  return [
    {
      id: note.id,
      x: note.x,
      y: note.y,
      width: note.width,
      height: note.height,
      // A note saved before text, stacking, or color existed still opens.
      text: typeof note.text === 'string' ? note.text : '',
      zIndex: typeof note.zIndex === 'number' ? note.zIndex : 1,
      color: noteColor(typeof note.color === 'string' ? note.color : '').id,
    },
  ]
}

export function serializeNotes(notes: readonly Note[]): string {
  return JSON.stringify({ version: SCHEMA_VERSION, notes })
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function createLocalStorageNoteRepository(
  storage: StorageLike = localStorage,
  key = NOTES_STORAGE_KEY,
  delayMs = REPOSITORY_DELAY_MS,
): NoteRepository {
  return {
    async load() {
      await wait(delayMs)
      return parseStoredNotes(storage.getItem(key))
    },
    async save(notes) {
      await wait(delayMs)
      storage.setItem(key, serializeNotes(notes))
    },
  }
}
