import { useCallback, useEffect, useState } from 'react';
import * as bookmarksApi from '../api/bookmarksClient';
import type { Bookmark } from '../types/bookmarks';

export function useBookmarks(chapterId?: number) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookmarksApi.fetchBookmarks(chapterId);
      setBookmarks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const isBookmarked = useCallback(
    (verseId: number) => bookmarks.some((bookmark) => bookmark.verseId === verseId),
    [bookmarks],
  );

  const findBookmark = useCallback(
    (verseId: number) => bookmarks.find((bookmark) => bookmark.verseId === verseId),
    [bookmarks],
  );

  const toggleBookmark = useCallback(
    async (targetChapterId: number, verseId: number) => {
      const existing = bookmarks.find(
        (bookmark) => bookmark.chapterId === targetChapterId && bookmark.verseId === verseId,
      );
      if (existing) {
        await bookmarksApi.deleteBookmark(existing.id);
      } else {
        await bookmarksApi.createBookmark(targetChapterId, verseId);
      }
      await reload();
    },
    [bookmarks, reload],
  );

  return { bookmarks, loading, error, reload, isBookmarked, findBookmark, toggleBookmark };
}
