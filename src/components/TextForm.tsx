import { useState } from 'react';
import { useLang } from '../contexts/LanguageContext';

export default function TextForm({ onSubmit }: { onSubmit: (txt: string) => void }) {
  const { t } = useLang();
  const [txt, setTxt] = useState('');
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (txt.trim()) { onSubmit(txt); setTxt(''); } }}
      style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 480 }}>
      <input value={txt}
             onChange={(e) => setTxt(e.target.value)}
             placeholder={t('placeholder')}
             style={{ flex: 1, padding: 10, border: '1px solid var(--lemon)', borderRadius: 4 }} />
      <button type="submit"
              style={{ background: 'var(--lemon)', border: 0, padding: '0 18px', borderRadius: 4 }}>
        {t('submit')}
      </button>
    </form>
  );
}
