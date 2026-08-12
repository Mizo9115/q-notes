import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note, NoteSelection } from '../types/notes';
import type { TranslationLanguageCode } from '../types/quran';

export type Theme = 'light' | 'dark' | 'system';

interface UiState {
  translationLanguage: TranslationLanguageCode | null;
  showTransliteration: boolean;
  theme: Theme;
  notePanelOpen: boolean;
  activeSelection: NoteSelection | null;
  activeNote: Note | null;
  setTranslationLanguage: (lang: TranslationLanguageCode | null) => void;
  setShowTransliteration: (show: boolean) => void;
  setTheme: (theme: Theme) => void;
  openNotePanel: (selection: NoteSelection, note?: Note | null) => void;
  closeNotePanel: () => void;
  setActiveNote: (note: Note | null) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      translationLanguage: null,
      showTransliteration: false,
      theme: 'system',
      notePanelOpen: false,
      activeSelection: null,
      activeNote: null,
      setTranslationLanguage: (translationLanguage) => set({ translationLanguage }),
      setShowTransliteration: (showTransliteration) => set({ showTransliteration }),
      setTheme: (theme) => set({ theme }),
      openNotePanel: (activeSelection, activeNote = null) =>
        set({ notePanelOpen: true, activeSelection, activeNote }),
      closeNotePanel: () =>
        set({ notePanelOpen: false, activeSelection: null, activeNote: null }),
      setActiveNote: (activeNote) => set({ activeNote }),
    }),
    {
      name: 'q-notes-ui',
      partialize: (state) => ({
        translationLanguage: state.translationLanguage,
        showTransliteration: state.showTransliteration,
        theme: state.theme,
      }),
    },
  ),
);

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', resolveTheme(theme));
}
