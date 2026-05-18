'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { PLANETS, ORBITING, getPlanet } from '@/lib/planets';
import { EASE } from '@/lib/motion';

export default function CompareView() {
  const view = useStore(s => s.view);
  const setView = useStore(s => s.setView);
  const open = view === 'compare';
  const [aId, setAId] = useState<string>('earth');
  const [bId, setBId] = useState<string>('jupiter');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="compare"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.4 } }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="fixed inset-0 z-[60] pointer-events-auto"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-md"
            onClick={() => setView('explore')}
          />

          <motion.div
            initial={{ y: 30, opacity: 0, filter: 'blur(20px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE, delay: 0.05 } }}
            exit={{ y: 30, opacity: 0, transition: { duration: 0.25 } }}
            className="relative w-full h-full flex flex-col"
          >
            <Header onClose={() => setView('explore')} />

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="w-full max-w-6xl mx-auto px-4 md:px-10 pt-24 pb-8 flex flex-col gap-4 md:gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <PlanetSide side="left" id={aId} setId={setAId} other={bId} />
                  <PlanetSide side="right" id={bId} setId={setBId} other={aId} />
                </div>

                <ComparisonBars aId={aId} bId={bId} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute top-6 left-0 right-0 z-10 flex items-center justify-between px-6 md:px-10 pointer-events-none">
      <div className="pointer-events-auto">
        <div className="text-[10px] uppercase tracking-[0.4em] text-white/45 mb-1">Compare</div>
        <h2 className="text-xl md:text-2xl font-light text-gradient">Two Worlds, Side by Side</h2>
      </div>
      <button
        onClick={onClose}
        className="pointer-events-auto w-10 h-10 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 transition flex items-center justify-center text-white/70 hover:text-white"
        aria-label="Close compare"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function PlanetSide({ side, id, setId, other }: { side: 'left' | 'right'; id: string; setId: (s: string) => void; other: string }) {
  const p = getPlanet(id)!;
  return (
    <motion.div
      initial={{ x: side === 'left' ? -40 : 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1, transition: { duration: 0.6, ease: EASE, delay: 0.2 } }}
      className="glass-strong relative rounded-3xl p-4 md:p-5 flex flex-col overflow-hidden"
    >
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: p.color.glow }}
      />

      {/* Selector */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PLANETS.map(o => {
          const active = o.id === id;
          const disabled = o.id === other;
          return (
            <button
              key={o.id}
              disabled={disabled}
              onClick={() => setId(o.id)}
              className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] border transition
                ${active ? 'border-white/40 bg-white/12 text-white' :
                  disabled ? 'border-white/5 bg-transparent text-white/20 cursor-not-allowed' :
                  'border-white/10 bg-transparent text-white/55 hover:text-white hover:border-white/25 hover:bg-white/5'}`}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: o.color.glow }} />
              {o.name}
            </button>
          );
        })}
      </div>

      {/* Big planet visual */}
      <div className="flex items-center justify-center my-2 md:my-3">
        <motion.div
          key={p.id}
          initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0, transition: { duration: 0.8, ease: EASE } }}
          className="relative"
        >
          <div
            className="w-24 h-24 md:w-32 md:h-32 rounded-full relative"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${p.color.primary}, ${p.color.secondary} 70%, #000 100%)`,
              boxShadow: `0 0 60px ${p.color.glow}55, inset -15px -15px 40px rgba(0,0,0,0.55)`,
            }}
          >
            {p.ring && (
              <div
                className="absolute left-1/2 top-1/2 rounded-full border-2 pointer-events-none"
                style={{
                  width: '170%',
                  height: '170%',
                  transform: 'translate(-50%, -50%) rotateX(72deg)',
                  borderColor: p.color.glow,
                  opacity: 0.55,
                  boxShadow: `0 0 20px ${p.color.glow}55`,
                }}
              />
            )}
          </div>
        </motion.div>
      </div>

      <div className="text-center mb-3">
        <div className="text-[9px] uppercase tracking-[0.4em] text-white/45">{p.tagline}</div>
        <h3 className="text-2xl md:text-3xl font-light text-gradient mt-0.5">{p.name}</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <Cell label="Diameter" value={p.facts.diameter} />
        <Cell label="Gravity" value={p.facts.gravity} />
        <Cell label="Day" value={p.facts.day} />
        <Cell label="Year" value={p.facts.year} />
        <Cell label="Temp" value={p.facts.temperature} />
        <Cell label="Moons" value={p.facts.moons} />
      </div>
    </motion.div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-xl border border-white/8 bg-white/[0.03]">
      <div className="text-[9px] uppercase tracking-[0.25em] text-white/40 mb-0.5">{label}</div>
      <div className="text-white/90 text-xs font-mono break-words">{value}</div>
    </div>
  );
}

function ComparisonBars({ aId, bId }: { aId: string; bId: string }) {
  const a = getPlanet(aId)!;
  const b = getPlanet(bId)!;

  const metrics = useMemo(() => {
    // Numerical comparisons using scene radius (proportional)
    const max = Math.max(a.radius, b.radius);
    return [
      { label: 'Relative Size', av: a.radius / max, bv: b.radius / max, format: (p: typeof a) => p.facts.diameter },
      { label: 'Distance from Sun', av: a.distance / 84, bv: b.distance / 84, format: (p: typeof a) => p.facts.distanceFromSun },
      { label: 'Orbit Speed', av: a.orbitSpeed / 0.42, bv: b.orbitSpeed / 0.42, format: (p: typeof a) => p.facts.year },
    ];
  }, [a, b]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.6, ease: EASE } }}
      className="w-full glass-strong rounded-3xl p-4 md:p-5"
    >
      <div className="text-[10px] uppercase tracking-[0.4em] text-white/45 mb-3">Head to Head</div>
      <div className="space-y-3">
        {metrics.map(m => (
          <div key={m.label}>
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-white/55 mb-1.5">
              <span className="text-white/90 font-mono normal-case tracking-normal">{m.format(a)}</span>
              <span>{m.label}</span>
              <span className="text-white/90 font-mono normal-case tracking-normal">{m.format(b)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex justify-end">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(m.av * 100, 2)}%`, transition: { duration: 0.9, ease: EASE } }}
                  className="h-2 rounded-l-full"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${a.color.glow})`,
                    boxShadow: `0 0 12px ${a.color.glow}66`,
                  }}
                />
              </div>
              <div className="w-px h-3 bg-white/30" />
              <div className="flex-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(m.bv * 100, 2)}%`, transition: { duration: 0.9, ease: EASE } }}
                  className="h-2 rounded-r-full"
                  style={{
                    background: `linear-gradient(90deg, ${b.color.glow}, transparent)`,
                    boxShadow: `0 0 12px ${b.color.glow}66`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
