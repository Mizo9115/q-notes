import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { applyTheme, useUiStore } from './store/uiStore';

function ThemeBootstrap() {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeBootstrap />
    <App />
  </StrictMode>,
);
