import { useUiStore } from '../store/uiStore';
import { TRANSLATION_LANGUAGES } from '../types/quran';

export function LanguageControls() {
  const translationLanguage = useUiStore((s) => s.translationLanguage);
  const showTransliteration = useUiStore((s) => s.showTransliteration);
  const setTranslationLanguage = useUiStore((s) => s.setTranslationLanguage);
  const setShowTransliteration = useUiStore((s) => s.setShowTransliteration);

  return (
    <div className="language-controls">
      <label className="control-group">
        <span>Translation</span>
        <select
          value={translationLanguage ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            setTranslationLanguage(value ? (value as NonNullable<typeof translationLanguage>) : null);
          }}
        >
          <option value="">None</option>
          {TRANSLATION_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </label>
      <label className="control-group checkbox">
        <input
          type="checkbox"
          checked={showTransliteration}
          onChange={(e) => setShowTransliteration(e.target.checked)}
        />
        <span>Transliteration</span>
      </label>
    </div>
  );
}
