import type { Topic, TopicsMeta } from '../types/topics';

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

export async function fetchTopics(category?: string): Promise<Topic[]> {
  const url = category ? `/api/topics?category=${encodeURIComponent(category)}` : '/api/topics';
  return handleResponse<Topic[]>(await fetch(url));
}

export async function fetchTopicsMeta(): Promise<TopicsMeta> {
  return handleResponse<TopicsMeta>(await fetch('/api/topics/meta'));
}

export async function fetchTopic(id: string): Promise<Topic> {
  return handleResponse<Topic>(await fetch(`/api/topics/${id}`));
}

export async function createTopic(input: {
  title: string;
  category?: string | null;
  tags?: string[];
  contentJson: unknown;
}): Promise<Topic> {
  return handleResponse<Topic>(
    await fetch('/api/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateTopic(
  id: string,
  input: {
    title?: string;
    contentJson?: unknown;
    category?: string | null;
    tags?: string[];
  },
): Promise<Topic> {
  return handleResponse<Topic>(
    await fetch(`/api/topics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteTopic(id: string): Promise<void> {
  await handleResponse<void>(await fetch(`/api/topics/${id}`, { method: 'DELETE' }));
}
