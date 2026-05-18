'use client';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { EASE } from '@/lib/motion';

export default function BottomControls() {
  const timeScale = useStore(s => s.timeScale);
  const setTimeScale = useStore(s => s.setTimeScale);
  const showOrbits = useStore(s => s.showOrbits);
  const setShowOrbits = useStore(s => s.setShowOrbits);
  const showLabels = useStore(s => s.showLabels);
  const setShowLabels = useStore(s => s.setShowLabels);
  const audioOn = useStore(s => s.audioOn);
  const toggleAudio = useStore(s => s.toggleAudio);

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { duration: 0.9, delay: 0.5, ease: EASE } }}
      className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
    >
      <div className="glass-strong rounded-full px-3 py-2.5 flex items-center gap-3 md:gap-5">
        {/* Time speed */}
        <div className="flex items-center gap-2.5 pl-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/45 hidden md:inline">Time</span>
          <SpeedDial value={timeScale} onChange={setTimeScale} />
          <span className="text-[11px] font-mono text-white/75 w-8 text-right tabular-nums">{timeScale.toFixed(1)}×</span>
        </div>

        <div className="w-px h-7 bg-white/10" />

        {/* Orbit toggle */}
        <Toggle on={showOrbits} onClick={() => setShowOrbits(!showOrbits)} icon="orbit" label="Orbits" />
        <Toggle on={showLabels} onClick={() => setShowLabels(!showLabels)} icon="labels" label="Labels" />

        <div className="w-px h-7 bg-white/10" />

        {/* Audio */}
        <Toggle on={audioOn} onClick={toggleAudio} icon="audio" label="Ambience" />
      </div>
    </motion.div>
  );
}

function SpeedDial({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const presets = [0, 0.25, 0.5, 1, 2, 4, 8];
  return (
    <div className="flex items-center gap-1">
      {presets.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`text-[10px] font-mono px-1.5 py-1 rounded-md transition
            ${Math.abs(value - p) < 0.01
              ? 'bg-cosmos-accent/20 text-cosmos-accent border border-cosmos-accent/30'
              : 'text-white/45 hover:text-white/85 border border-transparent'}`}
        >
          {p === 0 ? '⏸' : `${p}×`}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onClick, icon, label }: { on: boolean; onClick: () => void; icon: 'orbit'|'labels'|'audio'; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border transition
        ${on
          ? 'border-white/25 bg-white/8 text-white'
          : 'border-white/10 bg-transparent text-white/55 hover:text-white/85 hover:bg-white/5'}`}
      title={label}
    >
      <Icon name={icon} on={on} />
      <span className="text-[10px] uppercase tracking-[0.25em] hidden md:inline">{label}</span>
    </button>
  );
}

function Icon({ name, on }: { name: string; on: boolean }) {
  const stroke = on ? '#7dd3fc' : 'currentColor';
  if (name === 'orbit') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="12" rx="9" ry="4" stroke={stroke} strokeWidth="1.6"/>
      <circle cx="12" cy="12" r="2.2" fill={stroke}/>
    </svg>
  );
  if (name === 'labels') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="12" rx="3" stroke={stroke} strokeWidth="1.6"/>
      <path d="M8 11h8M8 14h5" stroke={stroke} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'audio') return on ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill={stroke}/>
      <path d="M16 8c1.5 1.2 1.5 6.8 0 8M19 5c3 2 3 12 0 14" stroke={stroke} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill={stroke}/>
      <path d="M16 9l5 6M21 9l-5 6" stroke={stroke} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
  return null;
}
