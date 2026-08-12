import type { ImportResult, Note, NoteType, NotesMeta } from '../types/notes';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function fetchNotes(chapterId?: number): Promise<Note[]> {
  const url = chapterId ? `/api/notes?chapter=${chapterId}` : '/api/notes';
  return handleResponse<Note[]>(await fetch(url));
}

export async function fetchNotesMeta(): Promise<NotesMeta> {
  return handleResponse<NotesMeta>(await fetch('/api/notes/meta'));
}

export async function lookupWordNote(
  chapterId: number,
  verseId: number,
  startWord: number,
  endWord: number,
): Promise<Note | null> {
  const params = new URLSearchParams({
    chapter: String(chapterId),
    verse: String(verseId),
    noteType: 'word',
    startWord: String(startWord),
    endWord: String(endWord),
  });
  return handleResponse<Note | null>(await fetch(`/api/notes/lookup?${params}`));
}

export async function lookupVerseNote(chapterId: number, verseId: number): Promise<Note | null> {
  const params = new URLSearchParams({
    chapter: String(chapterId),
    verse: String(verseId),
    noteType: 'verse',
  });
  return handleResponse<Note | null>(await fetch(`/api/notes/lookup?${params}`));
}

export async function createNote(input: {
  chapterId: number;
  verseId: number;
  noteType: NoteType;
  startWord: number;
  endWord: number;
  category?: string | null;
  tags?: string[];
  contentJson: unknown;
}): Promise<Note> {
  return handleResponse<Note>(
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateNote(
  id: string,
  input: { contentJson?: unknown; category?: string | null; tags?: string[] },
): Promise<Note> {
  return handleResponse<Note>(
    await fetch(`/api/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteNote(id: string): Promise<void> {
  await handleResponse<void>(await fetch(`/api/notes/${id}`, { method: 'DELETE' }));
}

export async function exportNotes(): Promise<void> {
  const response = await fetch('/api/notes/export');
  if (!response.ok) {
    throw new Error('Export failed');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `q-notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importNotes(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  return handleResponse<ImportResult>(
    await fetch('/api/notes/import', {
      method: 'POST',
      body: formData,
    }),
  );
}
