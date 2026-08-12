export type NoteType = 'word' | 'verse';

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

export interface NoteSelection {
  chapterId: number;
  verseId: number;
  noteType: NoteType;
  startWord: number;
  endWord: number;
  words: string[];
}

export interface ImportResult {
  imported: number;
  total: number;
  importedBookmarks?: number;
  totalBookmarks?: number;
  importedTopics?: number;
  totalTopics?: number;
}

export interface NotesMeta {
  categories: string[];
  tags: string[];
}

export const EMPTY_DOC = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export function isVerseNote(note: Note): boolean {
  return note.noteType === 'verse';
}

export function selectionLabel(selection: NoteSelection): string {
  if (selection.noteType === 'verse') {
    return `Verse ${selection.verseId}`;
  }
  if (selection.startWord === selection.endWord) {
    return selection.words.join(' ');
  }
  return selection.words.join(' ');
}
