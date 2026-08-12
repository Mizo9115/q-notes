import { useRef, useState } from 'react';
import { exportNotes, importNotes } from '../api/notesClient';

interface BackupControlsProps {
  onImported?: () => void;
}

export function BackupControls({ onImported }: BackupControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await exportNotes();
      setStatus('Notes exported successfully.');
    } catch {
      setStatus('Export failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    setStatus(null);
    try {
      const result = await importNotes(file);
      setStatus(`Imported ${result.imported} of ${result.total} notes.`);
      onImported?.();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="backup-controls">
      <button type="button" onClick={() => void handleExport()} disabled={busy}>
        ◆ Export
      </button>
      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy}>
        ◆ Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => void handleImport(e)}
      />
      {status && <p className="backup-status">{status}</p>}
    </div>
  );
}
