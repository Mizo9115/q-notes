import { useCallback, useEffect, useRef, useState } from 'react';
import { lookupVerseNote, lookupWordNote } from '../api/notesClient';
import { findNoteForSelection } from './useNotes';
import { useUiStore } from '../store/uiStore';
import type { Note, NoteSelection } from '../types/notes';
import { splitArabicWords } from '../types/quran';

interface UseWordSelectionOptions {
  chapterId: number;
  notes: Note[];
}

export function useWordSelection({ chapterId, notes }: UseWordSelectionOptions) {
  const openNotePanel = useUiStore((s) => s.openNotePanel);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [activeVerseId, setActiveVerseId] = useState<number | null>(null);
  const isDragging = useRef(false);
  const anchorWord = useRef<{ verseId: number; wordIndex: number } | null>(null);
  const dragContext = useRef<{ verseId: number; verseText: string } | null>(null);

  const clearDragPreview = useCallback(() => {
    setDragStart(null);
    setDragEnd(null);
    setActiveVerseId(null);
    isDragging.current = false;
    anchorWord.current = null;
    dragContext.current = null;
  }, []);

  const openWordSelection = useCallback(
    async (verseId: number, startWord: number, endWord: number, verseText: string) => {
      const words = splitArabicWords(verseText).slice(startWord, endWord + 1);
      const existing = findNoteForSelection(notes, chapterId, verseId, 'word', startWord, endWord);
      let note = existing ?? null;
      if (!note) {
        note = await lookupWordNote(chapterId, verseId, startWord, endWord);
      }
      const selection: NoteSelection = {
        chapterId,
        verseId,
        noteType: 'word',
        startWord,
        endWord,
        words,
      };
      openNotePanel(selection, note);
      clearDragPreview();
    },
    [chapterId, notes, openNotePanel, clearDragPreview],
  );

  const openVerseSelection = useCallback(
    async (verseId: number) => {
      const existing = findNoteForSelection(notes, chapterId, verseId, 'verse', -1, -1);
      let note = existing ?? null;
      if (!note) {
        note = await lookupVerseNote(chapterId, verseId);
      }
      const selection: NoteSelection = {
        chapterId,
        verseId,
        noteType: 'verse',
        startWord: -1,
        endWord: -1,
        words: [],
      };
      openNotePanel(selection, note);
    },
    [chapterId, notes, openNotePanel],
  );

  const handleWordMouseDown = useCallback(
    (verseId: number, wordIndex: number, verseText: string, event: React.MouseEvent) => {
      if (event.ctrlKey || event.metaKey) {
        // Let the browser start a native, copyable text selection instead of a note-selection drag.
        return;
      }
      event.preventDefault();

      if (event.shiftKey && anchorWord.current?.verseId === verseId) {
        const start = Math.min(anchorWord.current.wordIndex, wordIndex);
        const end = Math.max(anchorWord.current.wordIndex, wordIndex);
        void openWordSelection(verseId, start, end, verseText);
        return;
      }

      isDragging.current = true;
      anchorWord.current = { verseId, wordIndex };
      dragContext.current = { verseId, verseText };
      setActiveVerseId(verseId);
      setDragStart(wordIndex);
      setDragEnd(wordIndex);
    },
    [openWordSelection],
  );

  const handleWordMouseEnter = useCallback(
    (verseId: number, wordIndex: number) => {
      if (!isDragging.current || activeVerseId !== verseId || dragStart === null) return;
      setDragEnd(wordIndex);
    },
    [activeVerseId, dragStart],
  );

  const finalizeDrag = useCallback(() => {
    if (!isDragging.current || dragStart === null || !dragContext.current) return;
    const end = dragEnd ?? dragStart;
    const start = Math.min(dragStart, end);
    const endWord = Math.max(dragStart, end);
    void openWordSelection(
      dragContext.current.verseId,
      start,
      endWord,
      dragContext.current.verseText,
    );
  }, [dragStart, dragEnd, openWordSelection]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging.current) {
        finalizeDrag();
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [finalizeDrag]);

  const handleWordMouseUp = useCallback(
    (_verseId: number, _wordIndex: number, _verseText: string) => {
      if (!isDragging.current || dragStart === null) return;
      finalizeDrag();
    },
    [dragStart, finalizeDrag],
  );

  const isWordInDragPreview = useCallback(
    (verseId: number, wordIndex: number) => {
      if (activeVerseId !== verseId || dragStart === null || dragEnd === null) return false;
      const start = Math.min(dragStart, dragEnd);
      const end = Math.max(dragStart, dragEnd);
      return wordIndex >= start && wordIndex <= end;
    },
    [activeVerseId, dragStart, dragEnd],
  );

  return {
    handleWordMouseDown,
    handleWordMouseEnter,
    handleWordMouseUp,
    isWordInDragPreview,
    openVerseSelection,
    clearDragPreview,
  };
}
