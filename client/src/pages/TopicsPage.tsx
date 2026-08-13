import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTopicsMeta } from '../api/topicsClient';
import { NoteContentPreview } from '../components/NoteContentPreview';
import { useTopics } from '../hooks/useTopics';

export function TopicsPage() {
  const { topics, loading, error, removeTopic } = useTopics();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [meta, setMeta] = useState<{ categories: string[]; tags: string[] }>({
    categories: [],
    tags: [],
  });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchTopicsMeta().then(setMeta);
  }, [topics.length]);

  const filtered = topics.filter((topic) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      topic.title.toLowerCase().includes(q) ||
      topic.category?.toLowerCase().includes(q) ||
      topic.tags.some((t) => t.toLowerCase().includes(q));

    const matchesCategory = !categoryFilter || topic.category === categoryFilter;
    const matchesTag = !tagFilter || topic.tags.includes(tagFilter);

    return matchesQuery && matchesCategory && matchesTag;
  });

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete topic "${title}"?`)) return;
    setDeletingId(id);
    try {
      await removeTopic(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="page-state">Loading topics…</div>;
  if (error) return <div className="page-state error-text">{error}</div>;

  return (
    <div className="topics-page">
      <div className="page-heading topics-page-heading">
        <div>
          <h1>Topics</h1>
          <p>
            {topics.length} saved topic{topics.length === 1 ? '' : 's'} — grammar rules, tajweed,
            and other reference notes
          </p>
        </div>
        <Link to="/topics/new" className="topics-new-link">
          New topic
        </Link>
      </div>

      <div className="notes-filters">
        <input
          className="search-input"
          type="search"
          placeholder="Search by title, category, or tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {meta.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="">All tags</option>
          {meta.tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="page-state">
          {topics.length === 0
            ? 'No topics yet. Create one to document grammar rules, tajweed, or other reference material.'
            : 'No topics match your filters.'}
        </div>
      ) : (
        <div className="notes-list">
          {filtered.map((topic) => {
            const expanded = expandedIds.has(topic.id);
            return (
              <article
                key={topic.id}
                className={`note-card${expanded ? ' note-card-expanded' : ''}`}
              >
                <div className="note-card-header">
                  <button
                    type="button"
                    className="note-card-toggle"
                    aria-expanded={expanded}
                    onClick={() => toggleExpanded(topic.id)}
                  >
                    <span className="note-card-chevron" aria-hidden="true">
                      {expanded ? '▾' : '▸'}
                    </span>
                    <span className="note-card-toggle-body">
                      <h2>{topic.title}</h2>
                      <p className="note-card-meta">
                        Updated {new Date(topic.updatedAt).toLocaleString()}
                      </p>
                      {(topic.category || topic.tags.length > 0) && (
                        <div className="note-badges">
                          {topic.category && (
                            <span className="badge category-badge">{topic.category}</span>
                          )}
                          {topic.tags.map((tag) => (
                            <span key={tag} className="badge tag-badge">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </span>
                  </button>
                  <div className="topic-card-actions">
                    <Link
                      to={`/topics/${topic.id}`}
                      className="note-card-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="topic-delete-button"
                      disabled={deletingId === topic.id}
                      onClick={() => void handleDelete(topic.id, topic.title)}
                    >
                      {deletingId === topic.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
                {expanded && (
                  <div
                    className="note-card-preview"
                    dir="auto"
                    style={{ unicodeBidi: 'plaintext' }}
                  >
                    <NoteContentPreview content={topic.contentJson} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
