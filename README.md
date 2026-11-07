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
- Edit the text of a note.
- Resize a note from its corner.
- Bring a note to the front by touching it.
- Choose one of five colors for a note.
- Keep notes in the browser and restore them on reload.
- Show the title and how many notes exist.

### Create a note

Press New note, then drag on the board. Release the pointer to place the note. Create mode turns off after that, so another note needs the button again.

A click, or a drag of only a few pixels, places a note of 200×160. A longer drag uses the drawn size, but never smaller than 140×100. The note is moved back inside the board if it would cross the edge.

While the pointer is down, an outline follows it. That outline is the raw drag. The final size is decided on release.

### Move a note

Drag a note by the grip at the top. It keeps its size and stays inside the board. The other notes do not move.

### Resize a note

Drag the lines in the bottom-right corner. The note does not get smaller than 140×100, and it stays inside the board.

### Order

The note you drag, resize, or click comes to the front. A new note also starts in front.

### Color

The top bar has five colors: yellow, orange, pink, green, and blue. A new note is yellow. Press a color to change that note. The grip stays on the left, so choosing a color does not drag the note.

### Edit a note

The note just created is ready to type. On an existing note, click the body. The grip is only for dragging, so the text can be selected. Notes are saved in this browser and come back when the page is opened again.

### Delete a note

Drag a note until the pointer is over the trash icon, then release. That note is removed. If you release anywhere else, the note stays where you dropped it. The icon lights up while the pointer is over it.

## Structure

`App.tsx` used to contain the toolbar, the board, and every pointer event. Creating a note and moving a note are different gestures, so they no longer share that file.

- `App.tsx` keeps the list of notes and the toolbar. It loads and saves that list. It does not listen to the pointer.
- `Board.tsx` is the board surface. It creates a note and owns the trash.
- `Note.tsx` is a single note. The grip moves it, the colors sit on the right of that bar, the corner resizes it, and the body edits the text. Touching it brings it to the front.

## Decisions

Positions are relative to the board, not to the browser window, because the toolbar sits above the board. The outline is updated on the element itself and the note is added to React state only when the pointer is released. That avoids re-rendering the board on every move.

The note count is calculated from the list. It does not reveal a note that is hidden under another one.

While a note is dragged, it is drawn on the element. The new position is saved when the pointer is released, so the other notes are not drawn again on every move.

A note is deleted only when the pointer itself is over the trash. The edge of the note does not count. That avoids deleting a note that only brushes the zone.

A note stores a color name from a fixed list of five. It does not store a free color value. A note saved before colors existed, or with a name that is not in the list, opens as yellow. The page stays light, so the browser does not darken the notes until they match the board.

Each note keeps a stacking number. The one you touch gets a higher number than the rest. A note saved before that number existed opens at the back. The new size is saved when the pointer is released, the same way as the position.

Saving goes through a repository, not a direct call from the note. The write waits a short time, so each key does not touch storage. The stored list has a version. A list from another version is ignored and the board starts empty.

## Scripts

- `npm run dev` starts the dev server
- `npm run build` typechecks and builds for production
- `npm run preview` serves the production build
- `npm run lint` runs the linter
- `npm test` runs the unit tests
