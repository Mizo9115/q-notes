import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const source = join(root, 'quran-json-main', 'quran-json-main', 'dist', 'chapters');
const target = join(root, 'client', 'public', 'quran-data', 'chapters');

if (!existsSync(source)) {
  console.error(`Source not found: ${source}`);
  process.exit(1);
}

mkdirSync(join(root, 'client', 'public', 'quran-data'), { recursive: true });
if (existsSync(target)) {
  rmSync(target, { recursive: true, force: true });
}

cpSync(source, target, { recursive: true });
console.log(`Copied Quran data to ${target}`);
