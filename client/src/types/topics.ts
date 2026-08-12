export interface Topic {
  id: string;
  title: string;
  category: string | null;
  tags: string[];
  contentJson: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface TopicsMeta {
  categories: string[];
  tags: string[];
}

export { EMPTY_DOC } from './notes';
