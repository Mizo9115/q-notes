export interface ChapterSummary {
  id: number;
  name: string;
  transliteration: string;
  type: 'meccan' | 'medinan';
  total_verses: number;
  translation?: string;
}

export interface Verse {
  id: number;
  text: string;
  transliteration?: string;
  translation?: string;
}

export interface Chapter {
  id: number;
  name: string;
  transliteration: string;
  translation?: string;
  type: 'meccan' | 'medinan';
  total_verses: number;
  verses: Verse[];
}

export const TRANSLATION_LANGUAGES = [
  { code: 'bn', label: 'Bengali' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'id', label: 'Indonesian' },
  { code: 'ru', label: 'Russian' },
  { code: 'sv', label: 'Swedish' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ur', label: 'Urdu' },
  { code: 'zh', label: 'Chinese' },
] as const;

export type TranslationLanguageCode = (typeof TRANSLATION_LANGUAGES)[number]['code'];

export function splitArabicWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}
