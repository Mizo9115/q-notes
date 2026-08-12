import { useEffect } from 'react';
import { applyTheme, useUiStore, type Theme } from '../store/uiStore';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function ThemeToggle() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  return (
    <div className="theme-segmented" role="group" aria-label="Theme">
      {THEMES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={theme === value ? 'active' : undefined}
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
