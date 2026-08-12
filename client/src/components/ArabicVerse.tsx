import { Fragment } from 'react';
import { noteCoversWord, verseHasNote } from '../hooks/useNotes';
import { useUiStore } from '../store/uiStore';
import type { Note } from '../types/notes';
import type { Verse } from '../types/quran';
import { splitArabicWords } from '../types/quran';

interface ArabicVerseProps {
  chapterId: number;
  verse: Verse;
  notes: Note[];
  onWordMouseDown: (verseId: number, wordIndex: number, verseText: string, event: React.MouseEvent) => void;
  onWordMouseEnter: (verseId: number, wordIndex: number) => void;
  onWordMouseUp: (verseId: number, wordIndex: number, verseText: string) => void;
  onVerseNoteClick: (verseId: number) => void;
  onToggleBookmark: (verseId: number) => void;
  isBookmarked: boolean;
  isWordInDragPreview: (verseId: number, wordIndex: number) => boolean;
  showTransliteration: boolean;
  showTranslation: boolean;
}

function isWordInActiveSelection(
  chapterId: number,
  verseId: number,
  wordIndex: number,
  activeSelection: ReturnType<typeof useUiStore.getState>['activeSelection'],
  notePanelOpen: boolean,
): boolean {
  if (!notePanelOpen || !activeSelection) return false;
  if (activeSelection.chapterId !== chapterId || activeSelection.verseId !== verseId) return false;
  if (activeSelection.noteType === 'verse') return false;
  return wordIndex >= activeSelection.startWord && wordIndex <= activeSelection.endWord;
}

export function ArabicVerse({
  chapterId,
  verse,
  notes,
  onWordMouseDown,
  onWordMouseEnter,
  onWordMouseUp,
  onVerseNoteClick,
  onToggleBookmark,
  isBookmarked,
  isWordInDragPreview,
  showTransliteration,
  showTranslation,
}: ArabicVerseProps) {
  const words = splitArabicWords(verse.text);
  const hasVerseNote = verseHasNote(notes, verse.id);
  const activeSelection = useUiStore((s) => s.activeSelection);
  const notePanelOpen = useUiStore((s) => s.notePanelOpen);

  return (
    <article
      className={`verse-block ${hasVerseNote ? 'has-verse-note' : ''} ${isBookmarked ? 'is-bookmarked' : ''}`}
      data-verse={verse.id}
    >
      <div className="verse-controls">
        <button
          type="button"
          className={`verse-number ${hasVerseNote ? 'has-note' : ''}`}
          title={hasVerseNote ? 'Edit verse note' : 'Add verse note'}
          onClick={() => onVerseNoteClick(verse.id)}
        >
          <span className="verse-number-label">{verse.id}</span>
        </button>
        <button
          type="button"
          className={`verse-bookmark ${isBookmarked ? 'is-active' : ''}`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
          aria-pressed={isBookmarked}
          onClick={() => onToggleBookmark(verse.id)}
        >
          {isBookmarked ? '★' : '☆'}
        </button>
      </div>
      <div className="verse-content">
        <p className="arabic-line" dir="rtl">
          {words.map((word, index) => {
            const hasNote = notes.some((note) => noteCoversWord(note, verse.id, index));
            const isSelected = isWordInActiveSelection(
              chapterId,
              verse.id,
              index,
              activeSelection,
              notePanelOpen,
            );
            const isPreview = isWordInDragPreview(verse.id, index);
            return (
              <Fragment key={`${chapterId}-${verse.id}-${index}`}>
                <span
                  className={[
                    'word-token',
                    hasNote ? 'has-note' : '',
                    isSelected ? 'is-selected' : '',
                    isPreview ? 'drag-preview' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  data-chapter={chapterId}
                  data-verse={verse.id}
                  data-word={index}
                  onMouseDown={(event) => onWordMouseDown(verse.id, index, verse.text, event)}
                  onMouseEnter={() => onWordMouseEnter(verse.id, index)}
                  onMouseUp={() => onWordMouseUp(verse.id, index, verse.text)}
                >
                  {word}
                </span>
                {index < words.length - 1 ? ' ' : null}
              </Fragment>
            );
          })}
        </p>
        {showTransliteration && verse.transliteration && (
          <p className="transliteration-line" dir="ltr">
            {verse.transliteration}
          </p>
        )}
        {showTranslation && verse.translation && (
          <p className="translation-line" dir="auto" style={{ unicodeBidi: 'plaintext' }}>
            {verse.translation}
          </p>
        )}
      </div>
    </article>
  );
}
