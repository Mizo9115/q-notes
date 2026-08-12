# Q-Notes

A local Quran study app with clickable word/phrase annotations, rich-text notes (including tables), optional translations and transliteration, and JSON backup import/export.

## Features

- Read the Quran in original Arabic (Uthmani text from [quran-json](https://github.com/risan/quran-json))
- Optional translation (10 languages) and transliteration toggles
- Click any Arabic word to add a note, and instantly see how many times that word occurs across the whole Quran
- Drag or Shift+click to select a phrase and annotate it
- Click a verse number to add a **verse-level note** for the whole ayah
- Organize notes with **categories** and **tags**
- Rich-text notes with formatting and tables (Tiptap)
- Mixed Arabic/English notes with automatic bidirectional text handling
- **Light, dark, or system** theme
- Export/import all notes as a JSON backup file
- Notes stored locally in SQLite (`server/data/notes.db`)

## Requirements

- Node.js 22+ (tested on v24)

## Setup

```bash
npm install
```

The Quran text/translations (`client/public/quran-data/`) are already committed to this repo, so no extra data-fetching step is required.

If you need to regenerate that data from a fresh copy of [quran-json](https://github.com/risan/quran-json) (e.g. after updating the vendored source at `quran-json-main/quran-json-main/dist/chapters`), run:

```bash
npm run copy-data
```

`copy-data` copies the chapter JSON files and also rebuilds `client/public/quran-data/word-frequency.json`, a diacritic-insensitive word-occurrence index used to power the "appears N times in the Quran" hint in the word note panel. Re-run `npm run build-word-freq` on its own any time only the frequency index needs refreshing.

## Development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Production build

```bash
npm run build
npm run start --prefix server
```

The server serves the built client from `client/dist` and the API from `/api`.

## License note

Quran text and bundled translations are from the [quran-json](https://github.com/risan/quran-json) project (CC-BY-SA 4.0). See `THIRD_PARTY_LICENSES/quran-json-LICENSE.txt`.
