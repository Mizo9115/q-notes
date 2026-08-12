import { Router } from 'express';
import {
  createTopic,
  deleteTopic,
  getAllTopics,
  getTopicById,
  getTopicsCategoriesAndTags,
  updateTopic,
} from '../db.js';

export const topicsRouter = Router();

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === 'string').map((t) => t.trim()).filter(Boolean);
}

topicsRouter.get('/meta', (_req, res) => {
  res.json(getTopicsCategoriesAndTags());
});

topicsRouter.get('/', (req, res) => {
  const categoryParam = req.query.category;
  if (categoryParam !== undefined) {
    const category = String(categoryParam);
    if (!category) {
      res.status(400).json({ error: 'Invalid category parameter' });
      return;
    }
    res.json(getAllTopics(category));
    return;
  }
  res.json(getAllTopics());
});

topicsRouter.get('/:id', (req, res) => {
  const topic = getTopicById(req.params.id);
  if (!topic) {
    res.status(404).json({ error: 'Topic not found' });
    return;
  }
  res.json(topic);
});

topicsRouter.post('/', (req, res) => {
  const { title, category, tags, contentJson } = req.body ?? {};

  if (typeof title !== 'string' || !title.trim() || contentJson === undefined) {
    res.status(400).json({ error: 'Missing or invalid topic fields' });
    return;
  }

  const topic = createTopic({
    title,
    category: typeof category === 'string' ? category : null,
    tags: normalizeTags(tags),
    contentJson,
  });
  res.status(201).json(topic);
});

topicsRouter.put('/:id', (req, res) => {
  const { title, contentJson, category, tags } = req.body ?? {};
  if (
    title === undefined &&
    contentJson === undefined &&
    category === undefined &&
    tags === undefined
  ) {
    res.status(400).json({ error: 'Nothing to update' });
    return;
  }
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    res.status(400).json({ error: 'Invalid title' });
    return;
  }
  const topic = updateTopic(req.params.id, {
    title,
    contentJson,
    category: category !== undefined ? (category || null) : undefined,
    tags: tags !== undefined ? normalizeTags(tags) : undefined,
  });
  if (!topic) {
    res.status(404).json({ error: 'Topic not found' });
    return;
  }
  res.json(topic);
});

topicsRouter.delete('/:id', (req, res) => {
  const deleted = deleteTopic(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Topic not found' });
    return;
  }
  res.status(204).send();
});
