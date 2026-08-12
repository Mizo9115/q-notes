import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

interface NoteContentPreviewProps {
  content: unknown;
  className?: string;
}

export function NoteContentPreview({ content, className = '' }: NoteContentPreviewProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content as object,
    editable: false,
    editorProps: {
      attributes: {
        class: `note-preview-editor ${className}`.trim(),
        dir: 'auto',
        style: 'unicode-bidi: plaintext',
      },
    },
  });

  if (!editor) return null;
  return <EditorContent editor={editor} />;
}
