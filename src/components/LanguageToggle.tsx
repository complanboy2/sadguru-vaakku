import { useLang } from '../contexts/LanguageContext';

export default function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={() => setLang('en')}
              style={{ background: lang === 'en' ? 'var(--lemon)' : 'transparent',
                       border: '1px solid var(--lemon)', padding: '6px 12px', marginRight: 8 }}>
        English
      </button>
      <button onClick={() => setLang('te')}
              style={{ background: lang === 'te' ? 'var(--lemon)' : 'transparent',
                       border: '1px solid var(--lemon)', padding: '6px 12px' }}>
        తెలుగు
      </button>
    </div>
  );
}
