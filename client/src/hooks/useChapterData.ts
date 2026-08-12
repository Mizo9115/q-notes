import { useCallback, useEffect, useState } from 'react';
import type { Chapter } from '../types/quran';
import type { TranslationLanguageCode } from '../types/quran';

export function useChapterData(chapterId: number, translationLanguage: TranslationLanguageCode | null) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const path =
        translationLanguage !== null
          ? `/quran-data/chapters/${translationLanguage}/${chapterId}.json`
          : `/quran-data/chapters/${chapterId}.json`;
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load chapter ${chapterId}`);
      }
      const data = (await response.json()) as Chapter;
      setChapter(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chapter');
      setChapter(null);
    } finally {
      setLoading(false);
    }
  }, [chapterId, translationLanguage]);

  useEffect(() => {
    void load();
  }, [load]);

  return { chapter, loading, error, reload: load };
}
