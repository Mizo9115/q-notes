import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBookmarks } from '../hooks/useBookmarks';
import type { ChapterSummary } from '../types/quran';

export function BookmarksPage() {
  const { bookmarks, loading, error } = useBookmarks();
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);

  useEffect(() => {
    void (async () => {
      const response = await fetch('/quran-data/chapters/index.json');
      if (response.ok) {
        setChapters((await response.json()) as ChapterSummary[]);
      }
    })();
  }, []);

  const chapterMap = useMemo(
    () => new Map(chapters.map((chapter) => [chapter.id, chapter])),
    [chapters],
  );

  const sortedBookmarks = useMemo(
    () =>
      [...bookmarks].sort((a, b) => {
        if (a.chapterId !== b.chapterId) return a.chapterId - b.chapterId;
        return a.verseId - b.verseId;
      }),
    [bookmarks],
  );

  if (loading) return <div className="page-state">Loading bookmarks…</div>;
  if (error) return <div className="page-state error-text">{error}</div>;

  return (
    <div className="bookmarks-page">
      <div className="page-heading">
        <h1>Bookmarks</h1>
        <p>{bookmarks.length} saved bookmark{bookmarks.length === 1 ? '' : 's'}</p>
      </div>

      {sortedBookmarks.length === 0 ? (
        <div className="page-state">
          No bookmarks yet. Click the star next to any verse number to bookmark it.
        </div>
      ) : (
        <div className="bookmarks-list">
          {sortedBookmarks.map((bookmark) => {
            const chapter = chapterMap.get(bookmark.chapterId);
            return (
              <article key={bookmark.id} className="bookmark-card">
                <div className="bookmark-card-header">
                  <div>
                    <h2>
                      {chapter?.transliteration ?? `Surah ${bookmark.chapterId}`} · Verse{' '}
                      {bookmark.verseId}
                    </h2>
                    {chapter && (
                      <p className="bookmark-card-meta">
                        <span dir="rtl">{chapter.name}</span>
                        {' · '}
                        Surah {chapter.id}
                      </p>
                    )}
                    <p className="bookmark-card-meta">
                      Bookmarked {new Date(bookmark.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    to={`/surah/${bookmark.chapterId}?goto=${bookmark.verseId}`}
                    className="bookmark-card-link"
                  >
                    Open in reader
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
