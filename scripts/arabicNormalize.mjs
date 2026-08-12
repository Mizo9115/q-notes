// Strips Quranic diacritics/tatweel and unifies alef-wasla so the same
// underlying word is counted once regardless of vocalization or context.
// Keep this logic in sync with client/src/utils/arabicNormalize.ts.
const DIACRITICS_REGEX =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u08D3-\u08E1\u08E3-\u08FF]/g;
const TATWEEL_REGEX = /\u0640/g;
const ALEF_WASLA_REGEX = /\u0671/g;

export function normalizeArabicWord(word) {
  return word
    .replace(DIACRITICS_REGEX, '')
    .replace(TATWEEL_REGEX, '')
    .replace(ALEF_WASLA_REGEX, '\u0627')
    .trim();
}
