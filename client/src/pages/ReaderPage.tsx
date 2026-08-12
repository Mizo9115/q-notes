import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArabicVerse } from '../components/ArabicVerse';
import { LanguageControls } from '../components/LanguageControls';
import { NotePanel } from '../components/NotePanel';
import { useChapterData } from '../hooks/useChapterData';
import { useNotes } from '../hooks/useNotes';
import { useWordSelection } from '../hooks/useWordSelection';
import { useUiStore } from '../store/uiStore';

export function ReaderPage() {
  const { id } = useParams();
  const chapterId = Number(id);
  const translationLanguage = useUiStore((s) => s.translationLanguage);
  const showTransliteration = useUiStore((s) => s.showTransliteration);
  const notePanelOpen = useUiStore((s) => s.notePanelOpen);
  const activeSelection = useUiStore((s) => s.activeSelection);
  const activeNote = useUiStore((s) => s.activeNote);
  const setActiveNote = useUiStore((s) => s.setActiveNote);
  const openNotePanel = useUiStore((s) => s.openNotePanel);
  const [searchParams] = useSearchParams();

  const { chapter, loading, error } = useChapterData(chapterId, translationLanguage);
  const { notes, saveNote, removeNote } = useNotes(chapterId);
  const selection = useWordSelection({ chapterId, notes });

  const showTranslation = translationLanguage !== null;

  useEffect(() => {
    if (!chapter) return;

    const noteType = searchParams.get('type') === 'verse' ? 'verse' : 'word';
    const verseId = Number(searchParams.get('verse'));
    if (Number.isNaN(verseId)) return;

    if (noteType === 'verse') {
      const existing = notes.find(
        (n) => n.chapterId === chapterId && n.verseId === verseId && n.noteType === 'verse',
      );
      openNotePanel(
        {
          chapterId,
          verseId,
          noteType: 'verse',
          startWord: -1,
          endWord: -1,
          words: [],
        },
        existing ?? null,
      );
      return;
    }

    const startWord = Number(searchParams.get('start'));
    const endWord = Number(searchParams.get('end'));
    if ([startWord, endWord].some(Number.isNaN)) return;

    const verse = chapter.verses.find((v) => v.id === verseId);
    if (!verse) return;

    const existing = notes.find(
      (n) =>
        n.chapterId === chapterId &&
        n.verseId === verseId &&
        n.noteType === 'word' &&
        n.startWord === startWord &&
        n.endWord === endWord,
    );

    openNotePanel(
      {
        chapterId,
        verseId,
        noteType: 'word',
        startWord,
        endWord,
        words: verse.text.trim().split(/\s+/).slice(startWord, endWord + 1),
      },
      existing ?? null,
    );
  }, [chapter, chapterId, notes, openNotePanel, searchParams]);

  if (Number.isNaN(chapterId)) {
    return <div className="page-state error-text">Invalid surah number.</div>;
  }

  if (loading) return <div className="page-state">Loading surah…</div>;
  if (error || !chapter) return <div className="page-state error-text">{error ?? 'Surah not found'}</div>;

  const handleSave = async (input: {
    contentJson: unknown;
    category: string | null;
    tags: string[];
  }) => {
    if (!activeSelection) return;
    const saved = await saveNote({
      id: activeNote?.id,
      chapterId: activeSelection.chapterId,
      verseId: activeSelection.verseId,
      noteType: activeSelection.noteType,
      startWord: activeSelection.startWord,
      endWord: activeSelection.endWord,
      category: input.category,
      tags: input.tags,
      contentJson: input.contentJson,
    });
    setActiveNote(saved);
  };

  const handleDelete = async () => {
    if (!activeNote) return;
    await removeNote(activeNote.id);
  };

  return (
    <div className={`reader-layout ${notePanelOpen ? 'panel-open' : ''}`}>
      <section className="reader-main">
        <div className="reader-toolbar">
          <Link to="/" className="back-link">
            ← All surahs
          </Link>
          <LanguageControls />
        </div>

        <header className="chapter-header">
          <span className="chapter-ornament top-left" aria-hidden="true" />
          <span className="chapter-ornament top-right" aria-hidden="true" />
          <span className="chapter-ornament bottom-left" aria-hidden="true" />
          <span className="chapter-ornament bottom-right" aria-hidden="true" />
          <p className="chapter-kicker">Surah {chapter.id}</p>
          <h1 dir="rtl">{chapter.name}</h1>
          <p className="chapter-subtitle">
            {chapter.transliteration}
            {chapter.translation ? ` · ${chapter.translation}` : ''}
          </p>
          <p className="chapter-meta">
            {chapter.type.charAt(0).toUpperCase() + chapter.type.slice(1)} · {chapter.total_verses}{' '}
            verses · click a verse&apos;s medallion for a verse note
          </p>
        </header>

        <div className="verse-list">
          {chapter.verses.map((verse) => (
            <ArabicVerse
              key={verse.id}
              chapterId={chapter.id}
              verse={verse}
              notes={notes}
              showTransliteration={showTransliteration}
              showTranslation={showTranslation}
              onWordMouseDown={selection.handleWordMouseDown}
              onWordMouseEnter={selection.handleWordMouseEnter}
              onWordMouseUp={selection.handleWordMouseUp}
              onVerseNoteClick={(verseId) => void selection.openVerseSelection(verseId)}
              isWordInDragPreview={selection.isWordInDragPreview}
            />
          ))}
        </div>
      </section>

      <NotePanel chapter={chapter} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}
