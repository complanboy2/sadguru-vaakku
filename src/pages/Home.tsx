import { useEffect, useState } from 'react';
import { useHashId } from '../hooks/useHashId';
import AudioPlayer from '../components/AudioPlayer';
import LanguageToggle from '../components/LanguageToggle';
import TextForm from '../components/TextForm';
import { useLang } from '../contexts/LanguageContext';

interface Transcripts { [id: string]: { en: string; te: string } }

export default function Home() {
  const totalAudio = 20;            // adjust to your real count
  const hashId = useHashId(totalAudio);
  const { lang, t } = useLang();

  const [audioId, setAudioId] = useState<number | null>(null);
  const [transcripts, setTranscripts] = useState<Transcripts>({});

  useEffect(() => {
    fetch('/audio/transcripts.json').then(r => r.json()).then(setTranscripts);
  }, []);

  const handleSubmit = async (txt: string) => setAudioId(await hashId(txt));

  const transcript = audioId ? transcripts[audioId]?.[lang] : '';

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <img src="/lemon-logo.svg" alt="logo" style={{ width: 120, marginBottom: 16 }} />

      <LanguageToggle />

      <TextForm onSubmit={handleSubmit} />

      {audioId && (
        <>
          <p style={{ marginTop: 24, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {t('id')}: {audioId}
          </p>
          <AudioPlayer src={`/audio/${audioId}.mp3`} />
          {transcript && (
            <p style={{ marginTop: 24, maxWidth: 600, lineHeight: 1.5 }}>{transcript}</p>
          )}
        </>
      )}
    </div>
  );
}
