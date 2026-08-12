import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeArabicWord } from './arabicNormalize.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const chaptersDir = join(root, 'client', 'public', 'quran-data', 'chapters');
const outputPath = join(root, 'client', 'public', 'quran-data', 'word-frequency.json');

const chapterFiles = readdirSync(chaptersDir).filter((f) => /^\d+\.json$/.test(f));
if (chapterFiles.length === 0) {
  console.error(`No chapter files found in ${chaptersDir}. Run "npm run copy-data" first.`);
  process.exit(1);
}

const frequency = {};

for (const file of chapterFiles) {
  const chapter = JSON.parse(readFileSync(join(chaptersDir, file), 'utf-8'));
  for (const verse of chapter.verses) {
    const words = verse.text.trim().split(/\s+/).filter(Boolean);
    for (const word of words) {
      const key = normalizeArabicWord(word);
      if (!key) continue;
      frequency[key] = (frequency[key] ?? 0) + 1;
    }
  }
}

writeFileSync(outputPath, JSON.stringify(frequency), 'utf-8');
console.log(
  `Wrote word-frequency index (${Object.keys(frequency).length} unique forms from ${chapterFiles.length} chapters) to ${outputPath}`,
);
