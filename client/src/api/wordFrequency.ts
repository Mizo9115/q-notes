import { normalizeArabicWord } from '../utils/arabicNormalize';

type FrequencyIndex = Record<string, number>;

let indexPromise: Promise<FrequencyIndex> | null = null;

function loadIndex(): Promise<FrequencyIndex> {
  if (!indexPromise) {
    indexPromise = fetch('/quran-data/word-frequency.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load word frequency index');
        }
        return response.json() as Promise<FrequencyIndex>;
      })
      .catch((err) => {
        indexPromise = null;
        throw err;
      });
  }
  return indexPromise;
}

/** Number of times a single word (surface form) appears across the whole Quran. */
export async function getWordOccurrenceCount(word: string): Promise<number> {
  const index = await loadIndex();
  return index[normalizeArabicWord(word)] ?? 0;
}

/** Per-word occurrence counts, in the same order as the input words. */
export async function getWordOccurrenceCounts(words: string[]): Promise<number[]> {
  const index = await loadIndex();
  return words.map((word) => index[normalizeArabicWord(word)] ?? 0);
}
