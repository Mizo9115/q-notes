import type { Bookmark } from '../types/bookmarks';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function fetchBookmarks(chapterId?: number): Promise<Bookmark[]> {
  const url = chapterId ? `/api/bookmarks?chapter=${chapterId}` : '/api/bookmarks';
  return handleResponse<Bookmark[]>(await fetch(url));
}

export async function lookupBookmark(chapterId: number, verseId: number): Promise<Bookmark | null> {
  const params = new URLSearchParams({
    chapter: String(chapterId),
    verse: String(verseId),
  });
  return handleResponse<Bookmark | null>(await fetch(`/api/bookmarks/lookup?${params}`));
}

export async function createBookmark(chapterId: number, verseId: number): Promise<Bookmark> {
  return handleResponse<Bookmark>(
    await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId, verseId }),
    }),
  );
}

export async function deleteBookmark(id: string): Promise<void> {
  await handleResponse<void>(await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' }));
}
