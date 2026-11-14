import React from 'react';
import {
  AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, Easing, random,
  staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {ParallaxStill} from './Parallax';
import {loadFont as loadRuqaa} from '@remotion/google-fonts/ArefRuqaa';
import {loadFont as loadAmiri} from '@remotion/google-fonts/Amiri';

const {fontFamily: RUQAA} = loadRuqaa();
const {fontFamily: AMIRI} = loadAmiri();

export const FPS = 30;
const NARR_AT = 1.0; // narration starts at 1 s
const XF = 0.3; // crossfade seconds
const HAS_MUSIC = true;

type FX = 'embers' | 'fire' | 'fog' | 'dust' | 'rays' | 'lamp' | 'flash';
type Shot = {
  t0: number; t1: number; src: string; video?: boolean;
  kb?: {s: [number, number]; x: [number, number]; y: [number, number]};
  fx?: FX[]; grade?: string;
  par?: {x: [number, number]; y: [number, number]}; // depth-parallax travel in px
};

// Timeline (seconds). Narration phrase times come from silence detection, +1 s offset.
const SHOTS: Shot[] = [
  {t0: 0.0, t1: 5.7, src: 'k1.png', kb: {s: [1.18, 1.05], x: [-3, 0], y: [3, 0]}, par: {x: [-70, 70], y: [10, -10]}, fx: ['embers', 'fog']},
  {t0: 5.7, t1: 9.87, src: 'k2.png', kb: {s: [1.08, 1.18], x: [2, -2], y: [0, 2]}, par: {x: [70, -70], y: [0, 0]}, fx: ['fire', 'embers']},
  {t0: 9.87, t1: 12.6, src: 'king.mp4', video: true, fx: ['flash', 'embers'], grade: 'contrast(1.05) saturate(1.08)'},
  {t0: 12.6, t1: 16.15, src: 'k3.png', kb: {s: [1.35, 1.6], x: [-8, -10], y: [16, 22]}, par: {x: [-40, 40], y: [20, -20]}, fx: ['fire', 'embers'], grade: 'saturate(1.15) contrast(1.08)'},
  {t0: 16.15, t1: 22.03, src: 'k4.png', kb: {s: [1.08, 1.2], x: [0, 3], y: [0, -3]}, par: {x: [-80, 80], y: [0, 0]}, fx: ['lamp', 'dust']},
  {t0: 22.03, t1: 24.65, src: 'eyes.mp4', video: true, fx: ['lamp']},
  {t0: 24.65, t1: 28.1, src: 'k1.png', kb: {s: [1.7, 1.2], x: [28, 6], y: [30, -4]}, par: {x: [0, 0], y: [80, -60]}, fx: ['fog', 'dust']},
  {t0: 28.1, t1: 30.62, src: 'alley.mp4', video: true, fx: ['fog', 'dust'], grade: 'contrast(1.06)'},
  {t0: 30.62, t1: 32.9, src: 'k6.png', kb: {s: [1.08, 1.22], x: [0, -3], y: [0, 2]}, par: {x: [60, -60], y: [0, 0]}, fx: ['fog', 'dust']},
  {t0: 32.9, t1: 37.91, src: 'k7.png', kb: {s: [1.25, 1.08], x: [-8, 0], y: [-6, 0]}, par: {x: [-90, 90], y: [20, -20]}, fx: ['fog', 'dust']},
  {t0: 37.91, t1: 43.91, src: 'k8.png', kb: {s: [1.08, 1.22], x: [0, -4], y: [0, 2]}, par: {x: [70, -70], y: [0, 0]}, fx: ['rays', 'dust']},
];
const TITLE_AT = 43.91;
export const TOTAL = 49.2;

const LINES: [number, number, string][] = [
  [0.04, 1.53, 'في مدينةٍ قديمة...'],
  [2.33, 3.98, 'نَسِيَ الناسُ خالِقَهم'],
  [4.96, 6.99, 'والناس كانت بتسجد لأصنام من حجر...'],
  [7.28, 8.63, 'حجر يا صاحبي!'],
  [8.98, 9.69, 'والملك؟'],
  [9.94, 11.25, 'ده كان جبّار بصحيح'],
  [11.62, 14.57, 'واللي يخالف دينه... يا يرجع، يا يموت'],
  [15.35, 18.23, 'بس وسط الضلمة دي كلها... كان فيه شوية شباب'],
  [18.56, 19.84, 'رفضوا يسجدوا لغير الله'],
  [20.1, 20.67, 'خالص.'],
  [21.21, 22.6, 'اتقابلوا في السر'],
  [22.98, 25.04, 'وقالوا: إحنا مش هنعبد غير الله'],
  [25.24, 26.44, 'ربّ السما والأرض'],
  [27.32, 28.15, 'وفي نص الليل...'],
  [28.53, 29.46, 'خرجوا من المدينة'],
  [29.79, 31.65, 'مش شايلين معاهم غير إيمانهم'],
  [32.08, 32.83, 'ومعاهم كلبهم...'],
  [33.26, 34.2, 'أيوه، كلبهم.'],
  [34.52, 36.48, 'لحد ما وصلوا كهف في الجبل'],
  [36.81, 37.99, 'واستخبّوا جوّاه'],
  [39.07, 39.99, 'ثُمَّ حَدَثَ...'],
  [40.23, 42.12, 'ما لم يتوقّعْهُ أحد'],
];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.45, 0, 0.55, 1);

// ---------- overlays ----------
const Embers: React.FC<{n?: number}> = ({n = 38}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
      {Array.from({length: n}).map((_, i) => {
        const sp = 0.004 + random(`es${i}`) * 0.006;
        const p = (f * sp + random(`ep${i}`)) % 1;
        const x = random(`ex${i}`) * 100 + Math.sin(f / 22 + i) * 2.5;
        const y = 108 - p * 120;
        const sz = 3 + random(`ez${i}`) * 6;
        const o = Math.sin(p * Math.PI) * (0.5 + 0.5 * Math.sin(f / 4 + i * 3));
        return (
          <div key={i} style={{
            position: 'absolute', left: `${x}%`, top: `${y}%`, width: sz, height: sz, borderRadius: '50%',
            background: '#ffb347', opacity: o, boxShadow: `0 0 ${sz * 3}px ${sz}px rgba(255,120,30,0.55)`,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

const Dust: React.FC<{n?: number}> = ({n = 45}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
      {Array.from({length: n}).map((_, i) => {
        const x = (random(`dx${i}`) * 110 + f * (0.02 + random(`dv${i}`) * 0.05)) % 110 - 5;
        const y = random(`dy${i}`) * 100 + Math.sin(f / 40 + i) * 1.5;
        const sz = 1.5 + random(`dz${i}`) * 3.5;
        const o = 0.25 + 0.35 * Math.sin(f / 25 + i * 1.7) ** 2;
        return <div key={i} style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: sz, height: sz,
          borderRadius: '50%', background: '#fff6dc', opacity: o, filter: 'blur(0.6px)'}} />;
      })}
    </AbsoluteFill>
  );
};

const Fog: React.FC = () => {
  const f = useCurrentFrame();
  const blob = (i: number, top: number, w: number, sp: number, o: number) => (
    <div key={i} style={{
      position: 'absolute', top: `${top}%`, left: `${-40 + ((f * sp + i * 37) % 140)}%`, width: `${w}%`, height: '45%',
      background: 'radial-gradient(ellipse at center, rgba(190,200,230,0.55) 0%, rgba(190,200,230,0) 70%)',
      opacity: o, filter: 'blur(30px)',
    }} />
  );
  return <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
    {blob(1, 62, 80, 0.08, 0.35)}{blob(2, 70, 90, 0.05, 0.3)}{blob(3, 55, 70, 0.11, 0.2)}
  </AbsoluteFill>;
};

const FireFlicker: React.FC = () => {
  const f = useCurrentFrame();
  const o = 0.1 + 0.08 * Math.sin(f * 0.9) + 0.06 * Math.sin(f * 2.3 + 1) + 0.05 * (random(`ff${f}`) - 0.5);
  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at 15% 20%, rgba(255,140,40,1), rgba(255,90,20,0) 60%)',
    opacity: o, mixBlendMode: 'screen', pointerEvents: 'none'}} />;
};

const LampGlow: React.FC = () => {
  const f = useCurrentFrame();
  const o = 0.22 + 0.07 * Math.sin(f * 0.7) + 0.05 * Math.sin(f * 1.9 + 2);
  return <AbsoluteFill style={{background: 'radial-gradient(circle at 38% 85%, rgba(255,170,60,1), rgba(255,120,30,0) 45%)',
    opacity: o, mixBlendMode: 'screen', pointerEvents: 'none'}} />;
};

const GodRays: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none', overflow: 'hidden'}}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{
          position: 'absolute', right: `${2 + i * 7}%`, top: '-20%', width: `${7 + i * 2}%`, height: '150%',
          transformOrigin: 'top center', transform: `rotate(${32 + i * 4}deg)`,
          background: 'linear-gradient(to bottom, rgba(200,220,255,0.55), rgba(200,220,255,0))',
          opacity: 0.25 + 0.15 * Math.sin(f / (30 + i * 7) + i), filter: 'blur(18px)',
        }} />
      ))}
    </AbsoluteFill>
  );
};

const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#fff3e0', opacity: interpolate(f, [0, 2, 9], [0, 0.85, 0], clamp)}} />;
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: 0.08, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 9} /></filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none'}} />
);

// ---------- shots ----------
const ShotView: React.FC<{s: Shot}> = ({s}) => {
  const f = useCurrentFrame();
  const dur = (s.t1 - s.t0 + XF) * FPS;
  const p = interpolate(f, [0, dur], [0, 1], {...clamp, easing: ease});
  const fade = interpolate(f, [0, XF * FPS], [0, 1], clamp);
  const kb = s.kb ?? {s: [1.0, 1.06], x: [0, 0], y: [0, 0]};
  const sc = kb.s[0] + (kb.s[1] - kb.s[0]) * p;
  const x = kb.x[0] + (kb.x[1] - kb.x[0]) * p;
  const y = kb.y[0] + (kb.y[1] - kb.y[0]) * p;
  const media = {width: '100%', height: '100%', objectFit: 'cover' as const};
  return (
    <AbsoluteFill style={{opacity: s.t0 === 0 ? 1 : fade}}>
      <AbsoluteFill style={{transform: `translate(${x}%, ${y}%) scale(${sc})`, filter: s.grade}}>
        {s.video ? <OffthreadVideo src={staticFile(s.src)} muted style={media} />
          : s.par ? <ParallaxStill src={s.src} depth={'d_' + s.src} dx={s.par.x[0] + (s.par.x[1] - s.par.x[0]) * p} dy={s.par.y[0] + (s.par.y[1] - s.par.y[0]) * p} />
          : <Img src={staticFile(s.src)} style={media} />}
      </AbsoluteFill>
      {s.fx?.includes('fire') && <FireFlicker />}
      {s.fx?.includes('lamp') && <LampGlow />}
      {s.fx?.includes('rays') && <GodRays />}
      {s.fx?.includes('fog') && <Fog />}
      {s.fx?.includes('embers') && <Embers />}
      {s.fx?.includes('dust') && <Dust />}
      {s.fx?.includes('flash') && <Flash />}
    </AbsoluteFill>
  );
};

// Ruq'ah location card: right-to-left ink wipe + growing rule.
const Location: React.FC<{title: string; sub: string}> = ({title, sub}) => {
  const f = useCurrentFrame();
  const wipe = interpolate(f, [0, 28], [100, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  const line = interpolate(f, [10, 40], [0, 100], {...clamp, easing: Easing.out(Easing.cubic)});
  const out = interpolate(f, [80, 96], [1, 0], clamp);
  return (<>
    <div style={{position: 'absolute', top: 0, right: 0, width: 900, height: 330, opacity: out * 0.85,
      background: 'radial-gradient(ellipse at 85% 30%, rgba(0,0,0,0.75), rgba(0,0,0,0) 65%)'}} />
    <div style={{position: 'absolute', top: 70, right: 90, direction: 'rtl', textAlign: 'right', opacity: out}}>
      <div style={{fontFamily: RUQAA, fontSize: 78, color: '#f4e6c4', clipPath: `inset(0 0 0 ${wipe}%)`,
        textShadow: '0 3px 14px rgba(0,0,0,0.85)', lineHeight: 1.25}}>{title}</div>
      <div style={{height: 3, width: `${line}%`, marginLeft: 'auto', background: 'linear-gradient(to left, #d9a94a, rgba(217,169,74,0))'}} />
      <div style={{fontFamily: AMIRI, fontSize: 34, color: '#d9c7a0', marginTop: 8, opacity: interpolate(f, [24, 40], [0, 1], clamp),
        textShadow: '0 2px 10px rgba(0,0,0,0.9)'}}>{sub}</div>
    </div></>
  );
};

const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS - NARR_AT;
  const cur = LINES.find(([a, b]) => t >= a - 0.1 && t <= b + 0.35);
  if (!cur) return null;
  const [a, b, txt] = cur;
  const o = Math.min(interpolate(t, [a - 0.1, a + 0.12], [0, 1], clamp), interpolate(t, [b + 0.15, b + 0.35], [1, 0], clamp));
  return (
    <div style={{position: 'absolute', bottom: 78, width: '100%', textAlign: 'center', direction: 'rtl', opacity: o}}>
      <span style={{fontFamily: AMIRI, fontSize: 52, color: '#fbf3e2', fontWeight: 700,
        textShadow: '0 0 4px #000, 0 3px 12px rgba(0,0,0,0.95)'}}>{txt}</span>
    </div>
  );
};

const Title: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 24], [0, 1], clamp);
  const sc = interpolate(f, [0, 150], [1.12, 1.0], {...clamp, easing: Easing.out(Easing.cubic)});
  const glow = 18 + 10 * Math.sin(f / 12);
  const sub = interpolate(f, [30, 54], [0, 1], clamp);
  const end = interpolate(f, [130, 159], [1, 0], clamp);
  return (
    <AbsoluteFill style={{background: '#050403', opacity: end}}>
      <AbsoluteFill style={{opacity: 0.28 * o}}>
        <Img src={staticFile('k8.png')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px) brightness(0.6)'}} />
      </AbsoluteFill>
      <Dust n={60} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: o, transform: `scale(${sc})`}}>
        <div style={{fontFamily: RUQAA, fontSize: 230, lineHeight: 1.3, direction: 'rtl',
          background: 'linear-gradient(180deg, #fff1c9 0%, #e8b65a 55%, #9c6a22 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          filter: `drop-shadow(0 0 ${glow}px rgba(232,182,90,0.55))`}}>أصحاب الكهف</div>
        <div style={{fontFamily: AMIRI, fontSize: 40, color: '#cdb98e', opacity: sub, marginTop: 10, direction: 'rtl'}}>
          قصةٌ من القرآن الكريم · سورة الكهف
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  const {durationInFrames} = useVideoConfig();
  const narrEnd = (NARR_AT + 42.52) * FPS;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SHOTS.map((s, i) => {
        const from = Math.round((s.t0 === 0 ? 0 : s.t0 - XF) * FPS);
        const to = Math.round(s.t1 * FPS);
        return <Sequence key={i} from={from} durationInFrames={to - from + 1}><ShotView s={s} /></Sequence>;
      })}
      <Sequence from={12} durationInFrames={100}><Location title="أَفَسُس" sub="آسيا الصغرى · العهد الروماني" /></Sequence>
      <Vignette />
      <Grain />
      <Subtitles />
      <Sequence from={Math.round(TITLE_AT * FPS)}><Title /></Sequence>
      <Sequence from={Math.round(NARR_AT * FPS)}><Audio src={staticFile('narration.wav')} /></Sequence>
      <Audio src={staticFile('sfx.wav')} volume={1.0} />
      {HAS_MUSIC && (
        <Audio src={staticFile('music.wav')} volume={(f) =>
          interpolate(f, [0, 20, NARR_AT * FPS, narrEnd, narrEnd + 20, durationInFrames - 30, durationInFrames],
            [0, 0.55, 0.28, 0.28, 0.6, 0.6, 0], clamp)} />
      )}
    </AbsoluteFill>
  );
};
