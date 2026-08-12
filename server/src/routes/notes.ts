import { Router } from 'express';
import multer from 'multer';
import {
  createNote,
  deleteNote,
  findVerseNote,
  findWordNoteAtLocation,
  getAllNotes,
  getCategoriesAndTags,
  getNoteById,
  updateNote,
  upsertNote,
  type NoteType,
} from '../db.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
export const notesRouter = Router();

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === 'string').map((t) => t.trim()).filter(Boolean);
}

notesRouter.get('/export', (_req, res) => {
  const notes = getAllNotes();
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    notes: notes.map((n) => ({
      id: n.id,
      chapterId: n.chapterId,
      verseId: n.verseId,
      noteType: n.noteType,
      startWord: n.startWord,
      endWord: n.endWord,
      category: n.category,
      tags: n.tags,
      contentJson: n.contentJson,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    })),
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="q-notes-backup.json"');
  res.json(payload);
});

notesRouter.post('/import', upload.single('file'), (req, res) => {
  try {
    let raw: unknown;
    if (req.file) {
      raw = JSON.parse(req.file.buffer.toString('utf-8'));
    } else if (req.body && typeof req.body === 'object') {
      raw = req.body;
    } else {
      res.status(400).json({ error: 'No import file provided' });
      return;
    }

    if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { notes?: unknown }).notes)) {
      res.status(400).json({ error: 'Invalid backup format: expected { notes: [...] }' });
      return;
    }

    const notes = (raw as { notes: Array<Record<string, unknown>> }).notes;
    let imported = 0;

    for (const item of notes) {
      if (
        typeof item.id !== 'string' ||
        typeof item.chapterId !== 'number' ||
        typeof item.verseId !== 'number' ||
        typeof item.startWord !== 'number' ||
        typeof item.endWord !== 'number' ||
        item.contentJson === undefined
      ) {
        res.status(400).json({ error: 'Invalid note entry in backup file' });
        return;
      }

      const noteType: NoteType =
        item.noteType === 'verse' ? 'verse' : 'word';

      upsertNote({
        id: item.id,
        chapterId: item.chapterId,
        verseId: item.verseId,
        noteType,
        startWord: item.startWord,
        endWord: item.endWord,
        category: typeof item.category === 'string' ? item.category : null,
        tags: normalizeTags(item.tags),
        contentJson: item.contentJson,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
        updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
      });
      imported++;
    }

    res.json({ imported, total: notes.length });
  } catch {
    res.status(400).json({ error: 'Failed to parse import file as JSON' });
  }
});

notesRouter.get('/meta', (_req, res) => {
  res.json(getCategoriesAndTags());
});

notesRouter.get('/', (req, res) => {
  const chapterParam = req.query.chapter;
  if (chapterParam !== undefined) {
    const chapterId = Number(chapterParam);
    if (Number.isNaN(chapterId)) {
      res.status(400).json({ error: 'Invalid chapter parameter' });
      return;
    }
    res.json(getAllNotes(chapterId));
    return;
  }
  res.json(getAllNotes());
});

notesRouter.get('/lookup', (req, res) => {
  const chapterId = Number(req.query.chapter);
  const verseId = Number(req.query.verse);
  const noteType = req.query.noteType === 'verse' ? 'verse' : 'word';

  if ([chapterId, verseId].some(Number.isNaN)) {
    res.status(400).json({ error: 'Invalid lookup parameters' });
    return;
  }

  if (noteType === 'verse') {
    res.json(findVerseNote(chapterId, verseId));
    return;
  }

  const startWord = Number(req.query.startWord);
  const endWord = Number(req.query.endWord);
  if ([startWord, endWord].some(Number.isNaN)) {
    res.status(400).json({ error: 'Invalid lookup parameters' });
    return;
  }

  const note = findWordNoteAtLocation(chapterId, verseId, startWord, endWord);
  res.json(note);
});

notesRouter.get('/:id', (req, res) => {
  const note = getNoteById(req.params.id);
  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  res.json(note);
});

notesRouter.post('/', (req, res) => {
  const { chapterId, verseId, noteType, startWord, endWord, category, tags, contentJson } =
    req.body ?? {};
  const type: NoteType = noteType === 'verse' ? 'verse' : 'word';

  if (typeof chapterId !== 'number' || typeof verseId !== 'number' || contentJson === undefined) {
    res.status(400).json({ error: 'Missing or invalid note fields' });
    return;
  }

  if (type === 'word') {
    if (typeof startWord !== 'number' || typeof endWord !== 'number') {
      res.status(400).json({ error: 'startWord and endWord are required for word notes' });
      return;
    }
    const existing = findWordNoteAtLocation(chapterId, verseId, startWord, endWord);
    if (existing) {
      res.status(409).json({ error: 'Note already exists at this location', note: existing });
      return;
    }
  } else {
    const existing = findVerseNote(chapterId, verseId);
    if (existing) {
      res.status(409).json({ error: 'Verse note already exists', note: existing });
      return;
    }
  }

  const note = createNote({
    chapterId,
    verseId,
    noteType: type,
    startWord: type === 'verse' ? -1 : startWord,
    endWord: type === 'verse' ? -1 : endWord,
    category: typeof category === 'string' ? category : null,
    tags: normalizeTags(tags),
    contentJson,
  });
  res.status(201).json(note);
});

notesRouter.put('/:id', (req, res) => {
  const { contentJson, category, tags } = req.body ?? {};
  if (contentJson === undefined && category === undefined && tags === undefined) {
    res.status(400).json({ error: 'Nothing to update' });
    return;
  }
  const note = updateNote(req.params.id, {
    contentJson,
    category: category !== undefined ? (category || null) : undefined,
    tags: tags !== undefined ? normalizeTags(tags) : undefined,
  });
  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  res.json(note);
});

notesRouter.delete('/:id', (req, res) => {
  const deleted = deleteNote(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  res.status(204).send();
});
