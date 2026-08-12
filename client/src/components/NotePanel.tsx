import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { fetchNotesMeta } from '../api/notesClient';
import { getWordOccurrenceCounts } from '../api/wordFrequency';
import { useUiStore } from '../store/uiStore';
import { EMPTY_DOC, selectionLabel } from '../types/notes';
import type { Chapter } from '../types/quran';
import { TagInput } from './TagInput';

interface NotePanelProps {
  chapter: Chapter | null;
  onSave: (input: {
    contentJson: unknown;
    category: string | null;
    tags: string[];
  }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function NotePanel({ chapter, onSave, onDelete }: NotePanelProps) {
  const notePanelOpen = useUiStore((s) => s.notePanelOpen);
  const activeSelection = useUiStore((s) => s.activeSelection);
  const activeNote = useUiStore((s) => s.activeNote);
  const closeNotePanel = useUiStore((s) => s.closeNotePanel);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [wordCounts, setWordCounts] = useState<number[] | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: activeNote?.contentJson ?? EMPTY_DOC,
    editorProps: {
      attributes: {
        class: 'note-editor-content',
        dir: 'auto',
        style: 'unicode-bidi: plaintext',
      },
    },
  });

  useEffect(() => {
    void fetchNotesMeta().then((meta) => {
      setCategorySuggestions(meta.categories);
      setTagSuggestions(meta.tags);
    });
  }, [activeNote?.id]);

  useEffect(() => {
    if (!activeSelection || activeSelection.noteType !== 'word' || activeSelection.words.length === 0) {
      setWordCounts(null);
      return;
    }
    let cancelled = false;
    setWordCounts(null);
    void getWordOccurrenceCounts(activeSelection.words).then((counts) => {
      if (!cancelled) setWordCounts(counts);
    });
    return () => {
      cancelled = true;
    };
  }, [activeSelection]);

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(activeNote?.contentJson ?? EMPTY_DOC);
    setCategory(activeNote?.category ?? '');
    setTags(activeNote?.tags ?? []);
  }, [editor, activeNote, activeSelection]);

  if (!notePanelOpen || !activeSelection) {
    return null;
  }

  const chapterLabel = chapter?.transliteration ?? `Surah ${activeSelection.chapterId}`;
  const scopeLabel =
    activeSelection.noteType === 'verse'
      ? `Verse ${activeSelection.verseId} (full verse)`
      : selectionLabel(activeSelection);

  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        contentJson: editor.getJSON(),
        category: category.trim() || null,
        tags,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeNote) {
      closeNotePanel();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onDelete();
      closeNotePanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    } finally {
      setSaving(false);
    }
  };

  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <aside className="note-panel">
      <div className="note-panel-header">
        <div>
          <p className="note-panel-label">
            {activeSelection.noteType === 'verse' ? 'Verse note' : 'Word note'}
          </p>
          <p className="note-panel-breadcrumb" dir="auto" style={{ unicodeBidi: 'plaintext' }}>
            {chapterLabel} ·{' '}
            {activeSelection.noteType === 'verse' ? (
              scopeLabel
            ) : (
              <>
                Verse {activeSelection.verseId} ·{' '}
                <span className="selected-arabic">{scopeLabel}</span>
              </>
            )}
          </p>
        </div>
        <button type="button" className="icon-button" onClick={closeNotePanel} aria-label="Close">
          ×
        </button>
      </div>

      {activeSelection.noteType === 'word' && activeSelection.words.length > 0 && (
        <div className="word-frequency" dir="auto" style={{ unicodeBidi: 'plaintext' }}>
          {wordCounts === null ? (
            <span className="word-frequency-loading">Checking occurrences…</span>
          ) : activeSelection.words.length === 1 ? (
            <span>
              Appears <strong>{wordCounts[0]}</strong>{' '}
              {wordCounts[0] === 1 ? 'time' : 'times'} in the Quran
            </span>
          ) : (
            <span className="word-frequency-list">
              {activeSelection.words.map((word, i) => (
                <span key={`${word}-${i}`} className="word-frequency-item">
                  <span className="selected-arabic">{word}</span> · {wordCounts[i]}×
                </span>
              ))}
            </span>
          )}
        </div>
      )}

      <div className="note-meta-fields">
        <label className="field-label" htmlFor="note-category">
          Category
        </label>
        <input
          id="note-category"
          type="text"
          list="category-suggestions"
          value={category}
          placeholder="e.g. Tafsir, Grammar, Reflection"
          onChange={(e) => setCategory(e.target.value)}
        />
        <datalist id="category-suggestions">
          {categorySuggestions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <TagInput tags={tags} suggestions={tagSuggestions} onChange={setTags} />
      </div>

      <div className="editor-toolbar">
        <button
          type="button"
          title="Bold"
          aria-label="Bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          B
        </button>
        <button
          type="button"
          title="Italic"
          aria-label="Italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <span style={{ fontStyle: 'italic' }}>I</span>
        </button>
        <button
          type="button"
          title="Bullet list"
          aria-label="Bullet list"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          ≡
        </button>
        <button
          type="button"
          title="Heading"
          aria-label="Heading"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H
        </button>
        <button type="button" title="Insert table" aria-label="Insert table" onClick={insertTable}>
          ⊞
        </button>
      </div>

      <div className="note-editor" dir="auto" style={{ unicodeBidi: 'plaintext' }}>
        <EditorContent editor={editor} />
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="note-panel-actions">
        <button type="button" className="primary" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Saving…' : 'Save note'}
        </button>
        {activeNote && (
          <button type="button" className="danger" onClick={() => void handleDelete()} disabled={saving}>
            Delete
          </button>
        )}
      </div>
    </aside>
  );
}
