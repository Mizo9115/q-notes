export function scrollToVerse(verseId: number): boolean {
  const target = document.querySelector(`[data-verse="${verseId}"]`);
  if (!target) return false;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}
