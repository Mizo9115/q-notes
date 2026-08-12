import { useCallback, useEffect, useState } from 'react';
import * as notesApi from '../api/notesClient';
import type { Note, NoteType } from '../types/notes';

export function useNotes(chapterId?: number) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notesApi.fetchNotes(chapterId);
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveNote = useCallback(
    async (input: {
      id?: string;
      chapterId: number;
      verseId: number;
      noteType: NoteType;
      startWord: number;
      endWord: number;
      category?: string | null;
      tags?: string[];
      contentJson: unknown;
    }) => {
      const saved = input.id
        ? await notesApi.updateNote(input.id, {
            contentJson: input.contentJson,
            category: input.category,
            tags: input.tags,
          })
        : await notesApi.createNote({
            chapterId: input.chapterId,
            verseId: input.verseId,
            noteType: input.noteType,
            startWord: input.startWord,
            endWord: input.endWord,
            category: input.category,
            tags: input.tags,
            contentJson: input.contentJson,
          });
      await reload();
      return saved;
    },
    [reload],
  );

  const removeNote = useCallback(
    async (id: string) => {
      await notesApi.deleteNote(id);
      await reload();
    },
    [reload],
  );

  return { notes, loading, error, reload, saveNote, removeNote };
}

export function noteCoversWord(note: Note, verseId: number, wordIndex: number): boolean {
  if (note.noteType !== 'word') return false;
  return note.verseId === verseId && wordIndex >= note.startWord && wordIndex <= note.endWord;
}

export function verseHasNote(notes: Note[], verseId: number): boolean {
  return notes.some((n) => n.verseId === verseId && n.noteType === 'verse');
}

export function findNoteForSelection(
  notes: Note[],
  chapterId: number,
  verseId: number,
  noteType: NoteType,
  startWord: number,
  endWord: number,
): Note | undefined {
  return notes.find((n) => {
    if (n.chapterId !== chapterId || n.verseId !== verseId || n.noteType !== noteType) {
      return false;
    }
    if (noteType === 'verse') return true;
    return n.startWord === startWord && n.endWord === endWord;
  });
}

export function findVerseNote(notes: Note[], verseId: number): Note | undefined {
  return notes.find((n) => n.verseId === verseId && n.noteType === 'verse');
}
