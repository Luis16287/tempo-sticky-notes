import type { SkeletonNote } from './skeletonLayout.ts'

export function NoteSkeleton({ notes }: { notes: readonly SkeletonNote[] }) {
  return (
    <div aria-hidden="true">
      {notes.map((note) => (
        <div
          key={`${note.x}-${note.y}`}
          className="note-skeleton"
          style={{
            left: `${note.x}%`,
            top: `${note.y}%`,
            width: `${note.width}%`,
            height: `${note.height}%`,
          }}
        >
          <div className="note-skeleton-header" />
          <div className="note-skeleton-line" />
          <div className="note-skeleton-line note-skeleton-line-short" />
        </div>
      ))}
    </div>
  )
}
