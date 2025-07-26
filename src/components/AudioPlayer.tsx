import { useRef, useState } from 'react';
import { useLang } from '../contexts/LanguageContext';

export default function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { t } = useLang();
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const a = audioRef.current!;
    playing ? a.pause() : a.play();
  };

  return (
    <div style={{ marginTop: 24 }}>
      <audio ref={audioRef} src={src} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
      <button onClick={toggle}
              style={{ background: 'var(--lemon-dark)', color: '#fff', border: 0, padding: '8px 20px', borderRadius: 4 }}>
        {playing ? t('pause') : t('play')}
      </button>
    </div>
  );
}
