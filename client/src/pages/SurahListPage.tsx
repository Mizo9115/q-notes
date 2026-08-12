import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ChapterSummary } from '../types/quran';

export function SurahListPage() {
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/quran-data/chapters/index.json');
        if (!response.ok) throw new Error('Failed to load surah list');
        const data = (await response.json()) as ChapterSummary[];
        setChapters(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load surahs');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = chapters.filter((chapter) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      String(chapter.id).includes(q) ||
      chapter.name.includes(q) ||
      chapter.transliteration.toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="page-state">Loading surahs…</div>;
  if (error) return <div className="page-state error-text">{error}</div>;

  return (
    <div className="surah-list-page">
      <div className="page-heading">
        <h1>Surahs</h1>
        <p>Select a surah to read and annotate individual words or phrases.</p>
      </div>
      <input
        className="search-input"
        type="search"
        placeholder="Search by number, Arabic name, or transliteration…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="surah-grid">
        {filtered.map((chapter) => (
          <Link key={chapter.id} to={`/surah/${chapter.id}`} className="surah-card">
            <span className="surah-card-number">
              <span className="surah-card-number-label">{chapter.id}</span>
            </span>
            <div className="surah-card-body">
              <span className="surah-card-name" dir="rtl">
                {chapter.name}
              </span>
              <span className="surah-card-translit">{chapter.transliteration}</span>
              <span className="surah-card-meta">
                {chapter.type.charAt(0).toUpperCase() + chapter.type.slice(1)} · {chapter.total_verses}{' '}
                verses
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
