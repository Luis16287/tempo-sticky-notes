import { noteColor, type Note } from '../domain/notes.ts'

export const NOTES_STORAGE_KEY = 'sticky-notes'
// The pause stands in for a request. Callers already wait on the promise,
// so a real API can replace this repository without changing the board.
export const REPOSITORY_DELAY_MS = 200
// The read is slower than a save, so the note outlines stay on screen.
export const LOAD_DELAY_MIN_MS = 800
export const LOAD_DELAY_MAX_MS = 1400
const SCHEMA_VERSION = 1

export interface LoadResult {
  notes: Note[]
  ignored: boolean
}

export interface NoteRepository {
  load(): Promise<LoadResult>
  save(notes: readonly Note[]): Promise<void>
}

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

// A stored list from another version is ignored. The board starts empty
// instead of crashing on data it does not understand.
export function readStoredNotes(raw: string | null): LoadResult {
  if (!raw) return { notes: [], ignored: false }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { notes: [], ignored: true }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { notes: [], ignored: true }
  }
  const record = parsed as { version?: unknown; notes?: unknown }
  if (record.version !== SCHEMA_VERSION || !Array.isArray(record.notes)) {
    return { notes: [], ignored: true }
  }
  return { notes: record.notes.flatMap(toNote), ignored: false }
}

export function parseStoredNotes(raw: string | null): Note[] {
  return readStoredNotes(raw).notes
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

export const NOTES_URL = '/api/notes'

export interface HttpClient {
  get(url: string): Promise<unknown>
  put(url: string, body: unknown): Promise<void>
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function loadDelayMs(random: () => number = Math.random): number {
  return LOAD_DELAY_MIN_MS + random() * (LOAD_DELAY_MAX_MS - LOAD_DELAY_MIN_MS)
}

// localStorage is the fake server. The board never calls it directly.
// A fixed delay is for tests. The app leaves it unset, so a load varies
// and a save stays short.
export function createLocalStorageHttpClient(
  storage: StorageLike = localStorage,
  delayMs?: number,
  random: () => number = Math.random,
): HttpClient {
  return {
    async get(url) {
      await wait(delayMs ?? loadDelayMs(random))
      if (url !== NOTES_URL) throw new Error(`Unknown route: ${url}`)
      const raw = storage.getItem(NOTES_STORAGE_KEY)
      if (!raw) return { version: SCHEMA_VERSION, notes: [] }
      try {
        return JSON.parse(raw) as unknown
      } catch {
        return null
      }
    },
    async put(url, body) {
      await wait(delayMs ?? REPOSITORY_DELAY_MS)
      if (url !== NOTES_URL) throw new Error(`Unknown route: ${url}`)
      storage.setItem(NOTES_STORAGE_KEY, JSON.stringify(body))
    },
  }
}

export function createRestNoteRepository(
  http: HttpClient = createLocalStorageHttpClient(),
): NoteRepository {
  return {
    async load() {
      const body = await http.get(NOTES_URL)
      return readStoredNotes(JSON.stringify(body))
    },
    async save(notes) {
      await http.put(NOTES_URL, JSON.parse(serializeNotes(notes)) as unknown)
    },
  }
}
