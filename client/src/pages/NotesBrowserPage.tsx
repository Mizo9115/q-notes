import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchNotesMeta } from '../api/notesClient';
import { BackupControls } from '../components/BackupControls';
import { NoteContentPreview } from '../components/NoteContentPreview';
import { useNotes } from '../hooks/useNotes';
import { isVerseNote } from '../types/notes';
import type { ChapterSummary } from '../types/quran';

export function NotesBrowserPage() {
  const { notes, loading, error, reload } = useNotes();
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [meta, setMeta] = useState<{ categories: string[]; tags: string[] }>({
    categories: [],
    tags: [],
  });

  useEffect(() => {
    void (async () => {
      const response = await fetch('/quran-data/chapters/index.json');
      if (response.ok) {
        setChapters((await response.json()) as ChapterSummary[]);
      }
    })();
  }, []);

  useEffect(() => {
    void fetchNotesMeta().then(setMeta);
  }, [notes.length]);

  const chapterMap = useMemo(
    () => new Map(chapters.map((chapter) => [chapter.id, chapter])),
    [chapters],
  );

  const filtered = notes.filter((note) => {
    const q = query.trim().toLowerCase();
    const chapter = chapterMap.get(note.chapterId);
    const matchesQuery =
      !q ||
      String(note.chapterId).includes(q) ||
      String(note.verseId).includes(q) ||
      chapter?.transliteration.toLowerCase().includes(q) ||
      chapter?.name.includes(q) ||
      note.category?.toLowerCase().includes(q) ||
      note.tags.some((t) => t.toLowerCase().includes(q));

    const matchesCategory = !categoryFilter || note.category === categoryFilter;
    const matchesTag = !tagFilter || note.tags.includes(tagFilter);

    return matchesQuery && matchesCategory && matchesTag;
  });

  const noteLink = (note: (typeof notes)[number]) => {
    if (isVerseNote(note)) {
      return `/surah/${note.chapterId}?type=verse&verse=${note.verseId}`;
    }
    return `/surah/${note.chapterId}?verse=${note.verseId}&start=${note.startWord}&end=${note.endWord}`;
  };

  if (loading) return <div className="page-state">Loading notes…</div>;
  if (error) return <div className="page-state error-text">{error}</div>;

  return (
    <div className="notes-browser-page">
      <div className="page-heading">
        <h1>All notes</h1>
        <p>{notes.length} saved note{notes.length === 1 ? '' : 's'}</p>
      </div>

      <BackupControls onImported={() => void reload()} />

      <div className="notes-filters">
        <input
          className="search-input"
          type="search"
          placeholder="Search by surah, verse, category, or tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {meta.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="">All tags</option>
          {meta.tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="page-state">
          No notes yet. Click a word or verse number in any surah to add one.
        </div>
      ) : (
        <div className="notes-list">
          {filtered.map((note) => {
            const chapter = chapterMap.get(note.chapterId);
            return (
              <article key={note.id} className="note-card">
                <div className="note-card-header">
                  <div>
                    <h2>
                      {chapter?.transliteration ?? `Surah ${note.chapterId}`} · Verse {note.verseId}
                      {isVerseNote(note) ? ' (verse)' : ''}
                    </h2>
                    <p className="note-card-meta">
                      {isVerseNote(note)
                        ? 'Full verse note'
                        : `Words ${note.startWord + 1}–${note.endWord + 1}`}
                      {' · '}
                      Updated {new Date(note.updatedAt).toLocaleString()}
                    </p>
                    {(note.category || note.tags.length > 0) && (
                      <div className="note-badges">
                        {note.category && <span className="badge category-badge">{note.category}</span>}
                        {note.tags.map((tag) => (
                          <span key={tag} className="badge tag-badge">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link to={noteLink(note)} className="note-card-link">
                    Open in reader
                  </Link>
                </div>
                <div className="note-card-preview" dir="auto" style={{ unicodeBidi: 'plaintext' }}>
                  <NoteContentPreview content={note.contentJson} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
