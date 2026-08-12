import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchTopic, fetchTopicsMeta } from '../api/topicsClient';
import { TagInput } from '../components/TagInput';
import { useTopics } from '../hooks/useTopics';
import { EMPTY_DOC } from '../types/topics';

export function TopicEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new' || !id;
  const navigate = useNavigate();
  const { saveTopic, removeTopic } = useTopics();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [initialContent, setInitialContent] = useState<unknown>(EMPTY_DOC);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent as object,
    editorProps: {
      attributes: {
        class: 'note-editor-content',
        dir: 'auto',
        style: 'unicode-bidi: plaintext',
      },
    },
  });

  useEffect(() => {
    void fetchTopicsMeta().then((meta) => {
      setCategorySuggestions(meta.categories);
      setTagSuggestions(meta.tags);
    });
  }, []);

  useEffect(() => {
    if (isNew || !id) return;

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const topic = await fetchTopic(id);
        if (cancelled) return;
        setTitle(topic.title);
        setCategory(topic.category ?? '');
        setTags(topic.tags);
        setInitialContent(topic.contentJson);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load topic');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  useEffect(() => {
    if (!editor || isNew) return;
    editor.commands.setContent(initialContent as object);
  }, [editor, initialContent, isNew]);

  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleSave = async () => {
    if (!editor) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveTopic({
        id: isNew ? undefined : id,
        title: trimmedTitle,
        category: category.trim() || null,
        tags,
        contentJson: editor.getJSON(),
      });
      navigate('/topics');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save topic');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew || !id) return;
    if (!window.confirm(`Delete topic "${title}"?`)) return;

    setSaving(true);
    setError(null);
    try {
      await removeTopic(id);
      navigate('/topics');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete topic');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-state">Loading topic…</div>;

  return (
    <div className="topic-editor-page">
      <div className="page-heading">
        <h1>{isNew ? 'New topic' : 'Edit topic'}</h1>
        <p>
          {isNew
            ? 'Document a grammar rule, tajweed rule, or other reference material.'
            : 'Update your topic content and metadata.'}
        </p>
      </div>

      <div className="topic-editor-form">
        <label className="field-label" htmlFor="topic-title">
          Title
        </label>
        <input
          id="topic-title"
          type="text"
          className="topic-title-input"
          value={title}
          placeholder="e.g. Idgham, Iʿrab of the subject"
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="note-meta-fields">
          <label className="field-label" htmlFor="topic-category">
            Category
          </label>
          <input
            id="topic-category"
            type="text"
            list="topic-category-suggestions"
            value={category}
            placeholder="e.g. Grammar, Tajweed"
            onChange={(e) => setCategory(e.target.value)}
          />
          <datalist id="topic-category-suggestions">
            {categorySuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <TagInput tags={tags} suggestions={tagSuggestions} onChange={setTags} />
        </div>

        <div className="topic-editor-panel">
          <div className="editor-toolbar">
            <button
              type="button"
              title="Bold"
              aria-label="Bold"
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              B
            </button>
            <button
              type="button"
              title="Italic"
              aria-label="Italic"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <span style={{ fontStyle: 'italic' }}>I</span>
            </button>
            <button
              type="button"
              title="Bullet list"
              aria-label="Bullet list"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              ≡
            </button>
            <button
              type="button"
              title="Heading"
              aria-label="Heading"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              H
            </button>
            <button type="button" title="Insert table" aria-label="Insert table" onClick={insertTable}>
              ⊞
            </button>
          </div>

          <div className="note-editor topic-editor-body" dir="auto" style={{ unicodeBidi: 'plaintext' }}>
            <EditorContent editor={editor} />
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="topic-editor-actions">
          <button type="button" className="primary" onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Create topic' : 'Save changes'}
          </button>
          <Link to="/topics" className="topic-cancel-link">
            Cancel
          </Link>
          {!isNew && (
            <button type="button" className="danger" onClick={() => void handleDelete()} disabled={saving}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
