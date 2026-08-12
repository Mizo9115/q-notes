import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const dbPath = join(dataDir, 'notes.db');

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    chapter_id INTEGER NOT NULL,
    verse_id INTEGER NOT NULL,
    start_word INTEGER NOT NULL,
    end_word INTEGER NOT NULL,
    content_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_notes_chapter ON notes(chapter_id);
`);

function migrate() {
  const columns = db.prepare('PRAGMA table_info(notes)').all() as Array<{ name: string }>;
  const names = new Set(columns.map((c) => c.name));
  if (!names.has('note_type')) {
    db.exec("ALTER TABLE notes ADD COLUMN note_type TEXT NOT NULL DEFAULT 'word'");
  }
  if (!names.has('category')) {
    db.exec('ALTER TABLE notes ADD COLUMN category TEXT');
  }
  if (!names.has('tags')) {
    db.exec("ALTER TABLE notes ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'");
  }
}

migrate();

export type NoteType = 'word' | 'verse';

export interface NoteRow {
  id: string;
  chapter_id: number;
  verse_id: number;
  start_word: number;
  end_word: number;
  note_type: NoteType;
  category: string | null;
  tags: string;
  content_json: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  chapterId: number;
  verseId: number;
  noteType: NoteType;
  startWord: number;
  endWord: number;
  category: string | null;
  tags: string[];
  contentJson: unknown;
  createdAt: string;
  updatedAt: string;
}

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

export function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    verseId: row.verse_id,
    noteType: row.note_type ?? 'word',
    startWord: row.start_word,
    endWord: row.end_word,
    category: row.category,
    tags: parseTags(row.tags ?? '[]'),
    contentJson: JSON.parse(row.content_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getAllNotes(chapterId?: number): Note[] {
  if (chapterId !== undefined) {
    const stmt = db.prepare(
      'SELECT * FROM notes WHERE chapter_id = ? ORDER BY verse_id, note_type, start_word',
    );
    return (stmt.all(chapterId) as unknown as NoteRow[]).map(rowToNote);
  }
  const stmt = db.prepare(
    'SELECT * FROM notes ORDER BY chapter_id, verse_id, note_type, start_word',
  );
  return (stmt.all() as unknown as NoteRow[]).map(rowToNote);
}

export function getNoteById(id: string): Note | null {
  const stmt = db.prepare('SELECT * FROM notes WHERE id = ?');
  const row = stmt.get(id) as unknown as NoteRow | undefined;
  return row ? rowToNote(row) : null;
}

export function findWordNoteAtLocation(
  chapterId: number,
  verseId: number,
  startWord: number,
  endWord: number,
): Note | null {
  const stmt = db.prepare(`
    SELECT * FROM notes
    WHERE chapter_id = ? AND verse_id = ? AND note_type = 'word'
      AND start_word = ? AND end_word = ?
  `);
  const row = stmt.get(chapterId, verseId, startWord, endWord) as unknown as NoteRow | undefined;
  return row ? rowToNote(row) : null;
}

export function findVerseNote(chapterId: number, verseId: number): Note | null {
  const stmt = db.prepare(`
    SELECT * FROM notes
    WHERE chapter_id = ? AND verse_id = ? AND note_type = 'verse'
  `);
  const row = stmt.get(chapterId, verseId) as unknown as NoteRow | undefined;
  return row ? rowToNote(row) : null;
}

export function getCategoriesAndTags(): { categories: string[]; tags: string[] } {
  const notes = getAllNotes();
  const categories = new Set<string>();
  const tags = new Set<string>();
  for (const note of notes) {
    if (note.category) categories.add(note.category);
    for (const tag of note.tags) tags.add(tag);
  }
  return {
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
    tags: [...tags].sort((a, b) => a.localeCompare(b)),
  };
}

export function createNote(input: {
  id?: string;
  chapterId: number;
  verseId: number;
  noteType?: NoteType;
  startWord: number;
  endWord: number;
  category?: string | null;
  tags?: string[];
  contentJson: unknown;
}): Note {
  const id = input.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const noteType = input.noteType ?? 'word';
  const stmt = db.prepare(`
    INSERT INTO notes (
      id, chapter_id, verse_id, start_word, end_word, note_type,
      category, tags, content_json, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    input.chapterId,
    input.verseId,
    input.startWord,
    input.endWord,
    noteType,
    input.category ?? null,
    JSON.stringify(input.tags ?? []),
    JSON.stringify(input.contentJson),
    now,
    now,
  );
  return getNoteById(id)!;
}

export function updateNote(
  id: string,
  input: { contentJson?: unknown; category?: string | null; tags?: string[] },
): Note | null {
  const existing = getNoteById(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE notes SET
      content_json = ?,
      category = ?,
      tags = ?,
      updated_at = ?
    WHERE id = ?
  `);
  stmt.run(
    JSON.stringify(input.contentJson ?? existing.contentJson),
    input.category !== undefined ? input.category : existing.category,
    JSON.stringify(input.tags ?? existing.tags),
    now,
    id,
  );
  return getNoteById(id);
}

export function upsertNote(input: {
  id: string;
  chapterId: number;
  verseId: number;
  noteType?: NoteType;
  startWord: number;
  endWord: number;
  category?: string | null;
  tags?: string[];
  contentJson: unknown;
  createdAt?: string;
  updatedAt?: string;
}): Note {
  const existing = getNoteById(input.id);
  const now = new Date().toISOString();
  const createdAt = input.createdAt ?? existing?.createdAt ?? now;
  const updatedAt = input.updatedAt ?? now;
  const noteType = input.noteType ?? existing?.noteType ?? 'word';
  const stmt = db.prepare(`
    INSERT INTO notes (
      id, chapter_id, verse_id, start_word, end_word, note_type,
      category, tags, content_json, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      chapter_id = excluded.chapter_id,
      verse_id = excluded.verse_id,
      start_word = excluded.start_word,
      end_word = excluded.end_word,
      note_type = excluded.note_type,
      category = excluded.category,
      tags = excluded.tags,
      content_json = excluded.content_json,
      updated_at = excluded.updated_at
  `);
  stmt.run(
    input.id,
    input.chapterId,
    input.verseId,
    input.startWord,
    input.endWord,
    noteType,
    input.category ?? null,
    JSON.stringify(input.tags ?? []),
    JSON.stringify(input.contentJson),
    createdAt,
    updatedAt,
  );
  return getNoteById(input.id)!;
}

export function deleteNote(id: string): boolean {
  const stmt = db.prepare('DELETE FROM notes WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}
