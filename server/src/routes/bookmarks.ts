import { Router } from 'express';
import {
  createBookmark,
  deleteBookmark,
  findBookmark,
  getAllBookmarks,
  getBookmarkById,
} from '../db.js';

export const bookmarksRouter = Router();

bookmarksRouter.get('/', (req, res) => {
  const chapterParam = req.query.chapter;
  if (chapterParam !== undefined) {
    const chapterId = Number(chapterParam);
    if (Number.isNaN(chapterId)) {
      res.status(400).json({ error: 'Invalid chapter parameter' });
      return;
    }
    res.json(getAllBookmarks(chapterId));
    return;
  }
  res.json(getAllBookmarks());
});

bookmarksRouter.get('/lookup', (req, res) => {
  const chapterId = Number(req.query.chapter);
  const verseId = Number(req.query.verse);

  if ([chapterId, verseId].some(Number.isNaN)) {
    res.status(400).json({ error: 'Invalid lookup parameters' });
    return;
  }

  res.json(findBookmark(chapterId, verseId));
});

bookmarksRouter.get('/:id', (req, res) => {
  const bookmark = getBookmarkById(req.params.id);
  if (!bookmark) {
    res.status(404).json({ error: 'Bookmark not found' });
    return;
  }
  res.json(bookmark);
});

bookmarksRouter.post('/', (req, res) => {
  const { chapterId, verseId } = req.body ?? {};

  if (typeof chapterId !== 'number' || typeof verseId !== 'number') {
    res.status(400).json({ error: 'Missing or invalid bookmark fields' });
    return;
  }

  const existing = findBookmark(chapterId, verseId);
  if (existing) {
    res.status(409).json({ error: 'Verse already bookmarked', bookmark: existing });
    return;
  }

  const bookmark = createBookmark({ chapterId, verseId });
  res.status(201).json(bookmark);
});

bookmarksRouter.delete('/:id', (req, res) => {
  const deleted = deleteBookmark(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Bookmark not found' });
    return;
  }
  res.status(204).send();
});
