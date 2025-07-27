import {useState,useEffect,useRef,ChangeEvent} from 'react';

type Lang='en'|'te';
type Map=Record<string,{en:string;te:string}>;

export default function Home(){
  const [lang,setLang]=useState<Lang>('en');
  const [txt,setTxt]=useState('');
  const [id,setId]=useState(1);
  const [trMap,setTrMap]=useState<Map>({});
  const [trans,setTrans]=useState('');
  const [play,setPlay]=useState(false);
  const [t,dT]=useState(0);
  const [dur,dD]=useState(0);
  const [vol,setVol]=useState(1);
  const [busy,setBusy]=useState(false);
  const [randomBg, setRandomBg] = useState('');
  const [bgStyle, setBgStyle] = useState('cover');
  const [bgPosition, setBgPosition] = useState('center center');
  const [bgBrightness, setBgBrightness] = useState('medium');
  const aRef=useRef<HTMLAudioElement>(null);
  const range=663;

  // Enhanced background images array
  const backgroundImages = [
    { url: './background.jpg', aspectRatio: null },
    { url: './background-1.jpg', aspectRatio: null }, 
    { url: './background-2.jpg', aspectRatio: null },
    { url: './background-3.jpg', aspectRatio: null },
    { url: './background-4.jpg', aspectRatio: null },
    { url: './background-5.jpg', aspectRatio: null }
  ];

  // Function to analyze image brightness for adaptive transparency
  const analyzeImageBrightness = (imageSrc: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 100; // Sample size for performance
      canvas.height = 100;
      ctx?.drawImage(img, 0, 0, 100, 100);
      
      try {
        const imageData = ctx?.getImageData(0, 0, 100, 100);
        if (!imageData) return;
        
        let brightness = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
          brightness += (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
        }
        brightness = brightness / (imageData.data.length / 4);
        
        if (brightness < 85) setBgBrightness('dark');
        else if (brightness > 170) setBgBrightness('light');
        else setBgBrightness('medium');
      } catch (e) {
        // CORS or other issues - use default
        setBgBrightness('medium');
      }
    };
    
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
  };

  // Function to calculate optimal background styling based on aspect ratio
  const loadImageWithOptimalStyling = (imageSrc: string) => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      const viewportAspectRatio = window.innerWidth / window.innerHeight;
      
      // Determine optimal background styling
      if (Math.abs(aspectRatio - viewportAspectRatio) < 0.2) {
        setBgStyle('cover');
        setBgPosition('center center');
      } else if (aspectRatio > viewportAspectRatio * 1.5) {
        // Wide image
        setBgStyle('cover');
        setBgPosition('center center');
      } else if (aspectRatio < viewportAspectRatio * 0.7) {
        // Tall image
        setBgStyle('cover');
        setBgPosition('center 30%');
      } else {
        setBgStyle('cover');
        setBgPosition('center center');
      }
      
      // Analyze brightness for adaptive transparency
      analyzeImageBrightness(imageSrc);
    };
    img.src = imageSrc;
  };

  // Select random background with optimal styling
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * backgroundImages.length);
    const selectedImage = backgroundImages[randomIndex].url;
    setRandomBg(selectedImage);
    
    // Calculate optimal styling for this image
    loadImageWithOptimalStyling(selectedImage);
  }, []);

  // Get adaptive transparency based on background brightness
  // Get adaptive transparency based on background brightness
  const getAdaptiveTransparency = () => {
    switch(bgBrightness) {
      case 'dark':
        return 'rgba(255,255,255,0.92)'; // Less transparent for dark backgrounds
      case 'light':
        return 'rgba(255,255,255,0.82)'; // More transparent for light backgrounds  
      case 'medium':
      default:
        return 'rgba(255,255,255,0.88)'; // New default - more transparent
    }
  };

  // Fetch transcripts
  useEffect(()=>{
    fetch('./audio/transcripts.json')
      .then(r=>r.json()).then(setTrMap)
      .catch(()=>console.warn('no transcripts'));
  },[]);

  // Update transcript based on language and audio ID
  useEffect(()=>setTrans(trMap[id]?.[lang]||''),[id,lang,trMap]);

  // Audio event listeners
  useEffect(()=>{
    const a=aRef.current;if(!a)return;
    const meta=()=>{dD(a.duration);a.volume=vol};
    const time=()=>dT(a.currentTime);
    const onP =()=>setPlay(true);
    const onS =()=>setPlay(false);
    a.addEventListener('loadedmetadata',meta);
    a.addEventListener('timeupdate',time);
    a.addEventListener('play',onP);
    a.addEventListener('pause',onS);
    a.addEventListener('ended',onS);
    return ()=>{a.removeEventListener('loadedmetadata',meta);
      a.removeEventListener('timeupdate',time);
      a.removeEventListener('play',onP);
      a.removeEventListener('pause',onS);
      a.removeEventListener('ended',onS);}
  },[id,vol]);

  // Utility functions
  const fmt=(s:number)=>isNaN(s)?'0:00':`${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
  
  const seek=(e:ChangeEvent<HTMLInputElement>)=>{
    if(aRef.current)dT(aRef.current.currentTime=(parseFloat(e.target.value)/100)*dur);
  };
  
  const hashId=async(s:string)=>{
    const b=new TextEncoder().encode(s+Date.now());
    const h=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)));
    return (parseInt(h.slice(0,6).map(x=>x.toString(16).padStart(2,'0')).join(''),16)%range)+1;
  };

  const togglePlay=()=>{
    if(!aRef.current)return;
    if(play){
      aRef.current.pause();
    }else{
      aRef.current.play();
    }
  };

  const handleVolumeChange=(e:ChangeEvent<HTMLInputElement>)=>{
    const newVol=parseFloat(e.target.value)/100;
    setVol(newVol);
    if(aRef.current)aRef.current.volume=newVol;
  };

  const seekSkip=(s:number)=>{
    if(!aRef.current)return;
    const n=Math.max(0,Math.min(dur,aRef.current.currentTime+s));
    aRef.current.currentTime=n;
  };

  const go=async()=>{
    if(!txt.trim())return;
    setBusy(true);
    try{
      const newId=await hashId(txt);
      setId(newId);
      setTxt('');
    }finally{
      setBusy(false);
    }
  };

  return(
  <>
    {/* Dynamic Background with Optimal Styling */}
    <div style={{
      position:'fixed',
      inset:0,
      background: randomBg ? `url(${randomBg}) ${bgPosition}/cover no-repeat fixed` : 'url(./background.jpg) center/cover no-repeat fixed',
      backgroundSize: bgStyle,
      backgroundPosition: bgPosition,
      minHeight: '100vh',
      width: '100%',
      zIndex:-2
    }}/>
    <div style={{position:'fixed',inset:0,background:'rgba(157,194,9,.12)',zIndex:-1}}/>

    <main style={styles.main}>
      
      {/* Header - Fixed Layout to Prevent Movement */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <img src="./sai-baba-logo.jpg" alt="Sadguru Logo" style={styles.logo}/>
          <div style={styles.titleContainer}>
            <h1 style={styles.title}>
              <span style={styles.titleText}>
                {lang === 'en' ? 'Sadguru Vaakku' : 'సద్గురు వాక్కు'}
              </span>
            </h1>
            <p style={styles.subtitle}>
              <span style={styles.subtitleText}>
                {lang === 'en' ? 'Divine Audio Oracle' : 'దైవిక ఆడియో ఆరాకల్'}
              </span>
            </p>
          </div>
        </div>
        
        {/* Language Toggle */}
        <div style={styles.langContainer}>
          <button onClick={()=>setLang('en')} style={{...styles.langBtn, ...(lang==='en'?styles.langBtnActive:{})}}>
            <span style={styles.langBtnText}>EN</span>
          </button>
          <button onClick={()=>setLang('te')} style={{...styles.langBtn, ...(lang==='te'?styles.langBtnActive:{})}}>
            <span style={styles.langBtnText}>తె</span>
          </button>
        </div>
      </header>

      {/* Unified Main Section with Adaptive Transparency */}
      <section style={{
        ...styles.unifiedSection,
        background: getAdaptiveTransparency()
      }}>
        
        {/* Input Subsection */}
        <div style={styles.inputSubsection}>
          <h3 style={styles.subsectionTitle}>
            <span style={styles.subsectionTitleText}>
              🔮 {lang === 'en' ? 'Ask the Oracle' : 'ఆరాకల్‌ను అడగండి'}
            </span>
          </h3>
          <div style={styles.inputWrapper}>
            <input 
              value={txt} 
              onChange={e=>setTxt(e.target.value)}
              onKeyPress={e=>e.key==='Enter'&&go()}
              placeholder={lang === 'en' ? 'Enter your spiritual question...' : 'మీ ఆధ్యాత్మిక ప్రశ్నను నమోదు చేయండి...'}
              style={styles.input}
            />
            <button onClick={go} disabled={busy||!txt.trim()} style={{...styles.submitBtn, ...(busy?styles.submitBtnDisabled:{})}}>
              <span style={styles.submitBtnText}>
                {busy ? '⏳' : (lang === 'en' ? 'Submit' : 'సబ్మిట్')}
              </span>
            </button>
          </div>
        </div>

        {/* Visual Divider */}
        <div style={styles.divider}></div>

        {/* Audio Player Subsection */}  
        <div style={styles.audioSubsection}>
          <h3 style={styles.subsectionTitle}>
            <span style={styles.subsectionTitleText}>
              🎵 {lang === 'en' ? `Divine Message #${id}` : `దైవిక సందేశం #${id}`}
            </span>
          </h3>
          
          <audio ref={aRef} src={`./audio/${id}.mp3`} preload="metadata" style={{display:'none'}}/>
          
          {/* Progress Bar */}
          <div style={styles.progressContainer}>
            <span style={styles.timeText}>{fmt(t)}</span>
            <div style={styles.progressTrack}>
              <div style={{...styles.progressFill, width: `${dur ? (t/dur)*100 : 0}%`}}/>
              <input type="range" min="0" max="100" value={dur? (t/dur)*100:0} onChange={seek} style={styles.progressSlider}/>
            </div>
            <span style={styles.timeText}>{fmt(dur)}</span>
          </div>

          {/* Modern Audio Controls */}
          <div style={styles.controls}>
            <button onClick={()=>seekSkip(-10)} style={styles.controlBtn} title="Rewind 10 seconds">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.5,3C17.15,3 21.08,6.03 22.47,10.22L20.1,11C19.05,7.81 16.04,5.5 12.5,5.5C10.54,5.5 8.77,6.22 7.38,7.38L10,10H3V3L5.6,5.6C7.45,4 9.85,3 12.5,3M10,12V22H8V14H6V12H10Z"/>
              </svg>
              <span style={styles.skipLabel}>10</span>
            </button>
            
            <button onClick={togglePlay} style={styles.playBtn} title={play?'Pause':'Play'}>
              {play ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,19H18V5H14M6,19H10V5H6V19Z"/>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                </svg>
              )}
            </button>
            
            <button onClick={()=>seekSkip(10)} style={styles.controlBtn} title="Forward 10 seconds">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.5,3C6.85,3 2.92,6.03 1.53,10.22L3.9,11C4.95,7.81 7.96,5.5 11.5,5.5C13.46,5.5 15.23,6.22 16.62,7.38L14,10H21V3L18.4,5.6C16.55,4 14.15,3 11.5,3M14,12V22H16V14H18V12H14Z"/>
              </svg>
              <span style={styles.skipLabel}>10</span>
            </button>
          </div>

          {/* Volume Control */}
          <div style={styles.volumeContainer}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={styles.volumeIcon}>
              <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.01,19.86 21,16.28 21,12C21,7.72 18.01,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
            </svg>
            <div style={styles.volumeTrack}>
              <div style={{...styles.volumeFill, width: `${vol*100}%`}}/>
              <input type="range" min="0" max="100" value={vol*100} onChange={handleVolumeChange} style={styles.volumeSlider}/>
            </div>
            <span style={styles.volumeText}>{Math.round(vol*100)}%</span>
          </div>
        </div>

        {/* Visual Divider */}
        {trans && <div style={styles.divider}></div>}

        {/* Transcript Subsection */}
        {trans && (
          <div style={styles.transcriptSubsection}>
            <h3 style={styles.subsectionTitle}>
              <span style={styles.subsectionTitleText}>
                📜 {lang === 'en' ? 'Divine Transcript' : 'దైవిక లిఖిత రూపం'}
              </span>
            </h3>
            
            <div style={styles.transcriptContent}>
              <p style={styles.transcriptText}>{trans}</p>
            </div>
            
            <div style={styles.transcriptActions}>
              <button onClick={() => navigator.clipboard?.writeText(trans)} style={styles.actionBtn}>
                <span style={styles.actionBtnText}>
                  📋 {lang === 'en' ? 'Copy' : 'కాపీ'}
                </span>
              </button>
              <button onClick={() => window.speechSynthesis?.speak(new SpeechSynthesisUtterance(trans))} style={styles.actionBtn}>
                <span style={styles.actionBtnText}>
                  🔊 {lang === 'en' ? 'Read Aloud' : 'చదవండి'}
                </span>
              </button>
            </div>
          </div>
        )}

      </section>

    </main>
  </>);
}

// Complete Styles Object - Optimized for Stability and Responsiveness
const styles = {
  // Main container
  main: {
    maxWidth: 780,
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minHeight: '100vh',
    color: '#333'
  },

  // Header styles - Prevents movement on language change
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(15px) saturate(120%)',
    padding: '22px 28px',
    borderRadius: 18,
    boxShadow: '0 6px 25px rgba(0,0,0,0.12)',
    marginBottom: 28,
    minHeight: 94,
    border: '1px solid rgba(255,255,255,0.5)'
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    flex: 1
  },

  logo: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    border: '3px solid #9DC209',
    objectFit: 'cover' as const,
    boxShadow: '0 4px 12px rgba(157,194,9,0.35)',
    flexShrink: 0
  },

  titleContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    minWidth: 220
  },

  title: {
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: '700',
    color: '#2c3e50',
    minHeight: 38,
    display: 'flex',
    alignItems: 'center'
  },

  titleText: {
    display: 'inline-block',
    minWidth: 200,
    textAlign: 'left' as const
  },

  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: '500',
    minHeight: 22,
    display: 'flex',
    alignItems: 'center'
  },

  subtitleText: {
    display: 'inline-block',
    minWidth: 160,
    textAlign: 'left' as const
  },

  // Language toggle - Fixed dimensions
  langContainer: {
    display: 'flex',
    background: 'rgba(157,194,9,0.12)',
    borderRadius: 12,
    padding: 5,
    gap: 5,
    flexShrink: 0
  },

  langBtn: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    color: '#666',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: 13,
    minWidth: 45,
    minHeight: 36,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  langBtnActive: {
    background: 'linear-gradient(135deg, #9DC209, #7da104)',
    color: '#fff',
    transform: 'scale(1.02)',
    boxShadow: '0 3px 10px rgba(157,194,9,0.4)'
  },

  langBtnText: {
    display: 'inline-block',
    textAlign: 'center' as const,
    width: '100%'
  },

  // Unified section with adaptive transparency
  unifiedSection: {
    backdropFilter: 'blur(15px) saturate(120%)',
    borderRadius: 22,
    padding: '36px',
    boxShadow: '0 8px 35px rgba(0,0,0,0.15)',
    border: '1px solid rgba(255,255,255,0.5)',
    marginBottom: 24
  },

  // Subsection styles with fixed heights
  inputSubsection: {
    marginBottom: 28,
    minHeight: 130
  },

  audioSubsection: {
    marginBottom: 28,
    minHeight: 220
  },

  transcriptSubsection: {
    marginBottom: 0,
    minHeight: 200
  },

  subsectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '1.15rem',
    fontWeight: '600',
    color: '#2c3e50',
    minHeight: 30,
    display: 'flex',
    alignItems: 'center'
  },

  subsectionTitleText: {
    display: 'inline-block',
    minWidth: 220,
    textAlign: 'left' as const
  },

  // Visual divider
  divider: {
    height: 2,
    background: 'linear-gradient(90deg, transparent, rgba(157,194,9,0.35), transparent)',
    margin: '28px 0',
    borderRadius: 1
  },

  // Input styles
  inputWrapper: {
    display: 'flex',
    gap: 14,
    alignItems: 'stretch',
    minHeight: 52
  },

  input: {
    flex: 1,
    padding: '16px 18px',
    border: '2px solid rgba(157,194,9,0.35)',
    borderRadius: 14,
    fontSize: 16,
    outline: 'none',
    background: 'rgba(255,255,255,0.95)',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    color: '#333'
  },

  submitBtn: {
    padding: '16px 28px',
    background: 'linear-gradient(135deg, #9DC209, #7da104)',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: 15,
    minWidth: 110,
    minHeight: 52,
    boxShadow: '0 5px 15px rgba(157,194,9,0.4)',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  submitBtnDisabled: {
    background: 'rgba(157,194,9,0.6)',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },

  submitBtnText: {
    display: 'inline-block',
    textAlign: 'center' as const,
    width: '100%'
  },

  // Audio player styles
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    minHeight: 28
  },

  timeText: {
    fontSize: 14,
    color: '#9DC209',
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'center' as const
  },

  progressTrack: {
    flex: 1,
    position: 'relative' as const,
    height: 8,
    background: 'rgba(157,194,9,0.2)',
    borderRadius: 4,
    overflow: 'hidden'
  },

  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #9DC209, #7da104)',
    borderRadius: 4,
    transition: 'width 0.1s ease'
  },

  progressSlider: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    margin: 0
  },

  // Modern control buttons
  controls: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
    minHeight: 68
  },

  controlBtn: {
    width: 54,
    height: 54,
    borderRadius: 15,
    border: '2px solid rgba(157,194,9,0.35)',
    background: 'rgba(255,255,255,0.95)',
    color: '#9DC209',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    transition: 'all 0.2s ease',
    flexShrink: 0
  },

  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 18,
    border: 'none',
    background: 'linear-gradient(135deg, #9DC209, #7da104)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 25px rgba(157,194,9,0.45)',
    transition: 'all 0.2s ease',
    flexShrink: 0
  },

  skipLabel: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 1,
    color: '#9DC209'
  },

  // Volume control
  volumeContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    minHeight: 28
  },

  volumeIcon: {
    color: '#9DC209'
  },

  volumeTrack: {
    position: 'relative' as const,
    width: 110,
    height: 6,
    background: 'rgba(157,194,9,0.2)',
    borderRadius: 3,
    overflow: 'hidden'
  },

  volumeFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #9DC209, #7da104)',
    borderRadius: 3,
    transition: 'width 0.1s ease'
  },

  volumeSlider: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    margin: 0
  },

  volumeText: {
    fontSize: 13,
    color: '#9DC209',
    fontWeight: '700',
    minWidth: 38,
    textAlign: 'center' as const
  },

  // Transcript styles
  transcriptContent: {
    background: 'rgba(157,194,9,0.06)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 18,
    borderLeft: '5px solid #9DC209',
    minHeight: 90
  },

  transcriptText: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.75,
    color: '#2c3e50',
    textAlign: 'justify' as const,
    fontWeight: '400'
  },

  transcriptActions: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap' as const,
    minHeight: 40
  },

  actionBtn: {
    padding: '10px 18px',
    background: 'rgba(157,194,9,0.12)',
    border: '2px solid rgba(157,194,9,0.35)',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 13,
    color: '#9DC209',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    minWidth: 90,
    minHeight: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  actionBtnText: {
    display: 'inline-block',
    textAlign: 'center' as const,
    width: '100%'
  }
};
