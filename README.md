# Sticky Notes

Desktop board for sticky notes. The board fills the window. It is meant for a desktop screen of at least 1024×768.

## Requirements

- Node.js 22 or later

## Run locally

```sh
npm install
npm run dev
```

Vite prints a local URL, usually http://localhost:5173.

## What it does

- Create a note at a chosen position and size.
- Move a note by dragging it.
- Delete a note by dropping it on the trash.
- Show the title and how many notes exist.

### Create a note

Press New note, then drag on the board. Release the pointer to place the note. Create mode turns off after that, so another note needs the button again.

A click, or a drag of only a few pixels, places a note of 200×160. A longer drag uses the drawn size, but never smaller than 140×100. The note is moved back inside the board if it would cross the edge.

While the pointer is down, an outline follows it. That outline is the raw drag. The final size is decided on release.

### Move a note

Drag a note to a new place. It keeps its size and stays inside the board. The other notes do not move.

### Delete a note

Drag a note until the pointer is over the trash icon, then release. That note is removed. If you release anywhere else, the note stays where you dropped it. The icon lights up while the pointer is over it.

## Structure

`App.tsx` used to contain the toolbar, the board, and every pointer event. Creating a note and moving a note are different gestures, so they no longer share that file.

- `App.tsx` keeps the list of notes and the toolbar. It does not listen to the pointer.
- `Board.tsx` is the board surface. It creates a note and owns the trash.
- `Note.tsx` is a single note. It moves that note and reports where the pointer is released.

## Decisions

Positions are relative to the board, not to the browser window, because the toolbar sits above the board. The outline is updated on the element itself and the note is added to React state only when the pointer is released. That avoids re-rendering the board on every move.

The note count is calculated from the list. It does not reveal a note that is hidden under another one.

While a note is dragged, it is drawn on the element. The new position is saved when the pointer is released, so the other notes are not drawn again on every move.

A note is deleted only when the pointer itself is over the trash. The edge of the note does not count. That avoids deleting a note that only brushes the zone.

## Scripts

- `npm run dev` starts the dev server
- `npm run build` typechecks and builds for production
- `npm run preview` serves the production build
- `npm run lint` runs the linter
- `npm test` runs the unit tests
