'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { getPlanet } from '@/lib/planets';

const tabs = ['Overview', 'Composition', 'Moons', 'Fun Facts'] as const;
type Tab = typeof tabs[number];

import { EASE, EASE_OUT } from '@/lib/motion';

const panelMotion = {
  initial: { x: 480, opacity: 0, filter: 'blur(20px)' },
  animate: { x: 0, opacity: 1, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
  exit:    { x: 480, opacity: 0, filter: 'blur(20px)', transition: { duration: 0.4, ease: EASE_OUT } },
};

export default function PlanetPanel() {
  const selectedId = useStore(s => s.selectedId);
  const setSelected = useStore(s => s.setSelected);
  const planet = getPlanet(selectedId);
  const [tab, setTab] = useState<Tab>('Overview');

  return (
    <AnimatePresence mode="wait">
      {planet && (
        <motion.aside
          key={planet.id}
          {...panelMotion}
          className="fixed top-0 right-0 bottom-0 z-30 w-full md:w-[440px] lg:w-[480px] p-4 md:p-5 flex pointer-events-none"
        >
          <div className="glass-strong relative w-full rounded-3xl overflow-hidden flex flex-col pointer-events-auto">
            {/* Planet color accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${planet.color.glow}, transparent)` }}
            />
            {/* Glow blob */}
            <div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-40 blur-3xl pointer-events-none"
              style={{ background: planet.color.glow }}
            />

            <header className="relative p-6 md:p-7 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                  className="text-[10px] uppercase tracking-[0.4em] text-white/50 mb-2"
                >
                  {planet.tagline}
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.28 } }}
                  className="text-4xl md:text-5xl font-light text-gradient leading-none"
                >
                  {planet.name}
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.5 } }}
                  className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/55"
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: planet.color.glow, boxShadow: `0 0 10px ${planet.color.glow}` }}
                  />
                  {planet.type === 'star' ? 'G-type Star' :
                   planet.type === 'rocky' ? 'Terrestrial' :
                   planet.type === 'gas' ? 'Gas Giant' : 'Ice Giant'}
                </motion.div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-9 h-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 transition flex items-center justify-center text-white/70 hover:text-white"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            {/* Tabs */}
            <div className="px-6 md:px-7 flex gap-1 border-b border-white/5">
              {tabs.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative px-3 py-3 text-[11px] uppercase tracking-[0.25em] transition-colors
                    ${tab === t ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                  {t}
                  {tab === t && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute left-2 right-2 -bottom-px h-[2px] rounded-full"
                      style={{ background: planet.color.glow, boxShadow: `0 0 8px ${planet.color.glow}` }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                >
                  {tab === 'Overview' && (
                    <>
                      <p className="text-white/75 text-[14px] leading-relaxed mb-7">{planet.description}</p>
                      <StatGrid planet={planet} />
                    </>
                  )}

                  {tab === 'Composition' && (
                    <div className="space-y-5">
                      <Row label="Composition" value={planet.facts.composition} />
                      <Row label="Diameter" value={planet.facts.diameter} />
                      <Row label="Mass" value={planet.facts.mass} />
                      <Row label="Gravity" value={planet.facts.gravity} />
                      <Row label="Surface Temp" value={planet.facts.temperature} />
                      <Row label="Discovered" value={planet.facts.discovered} />
                      <CompositionBar planet={planet} />
                    </div>
                  )}

                  {tab === 'Moons' && (
                    <div>
                      <div className="text-white/60 text-sm mb-4">
                        Known natural satellites: <span className="text-white">{planet.facts.moons}</span>
                      </div>
                      {planet.moons && planet.moons.length > 0 ? (
                        <ul className="space-y-2.5">
                          {planet.moons.map(m => (
                            <li key={m.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition">
                              <div className="w-7 h-7 rounded-full shrink-0" style={{
                                background: `radial-gradient(circle at 30% 30%, ${m.color}, #000)`,
                                boxShadow: `0 0 10px ${m.color}40`,
                              }} />
                              <div className="flex-1">
                                <div className="text-white/95 font-medium">{m.name}</div>
                                <div className="text-[11px] uppercase tracking-widest text-white/45">
                                  r: {m.radius.toFixed(2)} · orbit: {m.distance.toFixed(1)}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-white/45 italic">No moons in this system.</div>
                      )}
                    </div>
                  )}

                  {tab === 'Fun Facts' && (
                    <ul className="space-y-3">
                      {planet.funFacts.map((f, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0, transition: { delay: i * 0.08 } }}
                          className="flex gap-3 p-3.5 rounded-2xl border border-white/8 bg-white/[0.03]"
                        >
                          <div className="text-cosmos-accent font-mono text-xs pt-0.5">{String(i+1).padStart(2,'0')}</div>
                          <div className="text-white/80 text-[14px] leading-relaxed">{f}</div>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
      <span className="text-[11px] uppercase tracking-[0.25em] text-white/45">{label}</span>
      <span className="text-white/90 text-sm font-mono text-right">{value}</span>
    </div>
  );
}

function StatGrid({ planet }: { planet: ReturnType<typeof getPlanet> & {} }) {
  const stats = [
    { l: 'Diameter', v: planet.facts.diameter },
    { l: 'Gravity', v: planet.facts.gravity },
    { l: 'Day Length', v: planet.facts.day },
    { l: 'Year Length', v: planet.facts.year },
    { l: 'Distance', v: planet.facts.distanceFromSun },
    { l: 'Moons', v: planet.facts.moons },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((s, i) => (
        <motion.div
          key={s.l}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.05 * i + 0.2 } }}
          className="p-3.5 rounded-2xl border border-white/8 bg-white/[0.025] hover:bg-white/[0.05] transition"
        >
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/45 mb-1">{s.l}</div>
          <div className="text-white/95 text-sm font-mono break-words">{s.v}</div>
        </motion.div>
      ))}
    </div>
  );
}

function CompositionBar({ planet }: { planet: ReturnType<typeof getPlanet> & {} }) {
  // Decorative composition strip
  const segs =
    planet.type === 'star' ? [['Hydrogen', 73, '#fde68a'], ['Helium', 25, '#fb923c'], ['Other', 2, '#fda4af']]
    : planet.type === 'gas' ? [['Hydrogen', 90, '#fde68a'], ['Helium', 8, '#fbcfe8'], ['Other', 2, '#a78bfa']]
    : planet.type === 'ice' ? [['Hydrogen', 80, '#a5f3fc'], ['Helium', 10, '#93c5fd'], ['Methane', 10, '#c4b5fd']]
    : [['Iron', 32, '#fb923c'], ['Oxygen', 30, '#7dd3fc'], ['Silicon', 15, '#a78bfa'], ['Other', 23, '#94a3b8']];

  return (
    <div className="mt-2">
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/45 mb-2">Estimated Composition</div>
      <div className="flex h-2 rounded-full overflow-hidden border border-white/10">
        {segs.map(([name, pct, c]) => (
          <div key={name as string} title={`${name} ${pct}%`} style={{ width: `${pct}%`, background: c as string }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-[11px]">
        {segs.map(([name, pct, c]) => (
          <div key={name as string} className="flex items-center gap-1.5 text-white/65">
            <span className="w-2 h-2 rounded-full" style={{ background: c as string }} />
            <span className="text-white/80">{name as string}</span>
            <span className="text-white/40 font-mono">{pct as number}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
