import { useCallback, useEffect, useState } from 'react';
import * as topicsApi from '../api/topicsClient';
import type { Topic } from '../types/topics';

export function useTopics(category?: string) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await topicsApi.fetchTopics(category);
      setTopics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load topics');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveTopic = useCallback(
    async (input: {
      id?: string;
      title: string;
      category?: string | null;
      tags?: string[];
      contentJson: unknown;
    }) => {
      const saved = input.id
        ? await topicsApi.updateTopic(input.id, {
            title: input.title,
            contentJson: input.contentJson,
            category: input.category,
            tags: input.tags,
          })
        : await topicsApi.createTopic({
            title: input.title,
            category: input.category,
            tags: input.tags,
            contentJson: input.contentJson,
          });
      await reload();
      return saved;
    },
    [reload],
  );

  const removeTopic = useCallback(
    async (id: string) => {
      await topicsApi.deleteTopic(id);
      await reload();
    },
    [reload],
  );

  return { topics, loading, error, reload, saveTopic, removeTopic };
}
