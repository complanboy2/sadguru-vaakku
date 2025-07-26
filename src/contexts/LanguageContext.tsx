import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Lang = 'en' | 'te';
interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string; }

const texts = {
  en: { placeholder: 'Ask the oracle…', submit: 'Submit', id: 'Selected audio ID', play: 'Play', pause: 'Pause' },
  te: { placeholder: 'ఆరాకల్‌ను అడగండి…', submit: 'సబ్మిట్', id: 'ఎంచుకున్న ఆడియో ID', play: 'ప్లే', pause: 'పాజ్' }
};

const LanguageContext = createContext<Ctx>(null!);
export const useLang = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'en');
  useEffect(() => localStorage.setItem('lang', lang), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: (k) => texts[lang][k] }}>
      {children}
    </LanguageContext.Provider>
  );
}
