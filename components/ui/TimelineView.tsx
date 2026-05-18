'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { EASE } from '@/lib/motion';

type Event = { year: string; title: string; body: string; color: string };

const EVENTS: Event[] = [
  { year: 'Prehistory', title: 'Naked-eye Planets', body: 'Mercury, Venus, Mars, Jupiter and Saturn were known to ancient civilizations across the world.', color: '#fde68a' },
  { year: '1543', title: 'Heliocentric Model', body: 'Nicolaus Copernicus proposes that the planets orbit the Sun, not the Earth.', color: '#fb923c' },
  { year: '1610', title: "Galileo's Moons", body: "Galileo discovers Jupiter's four largest moons — Io, Europa, Ganymede, Callisto.", color: '#f5d9a8' },
  { year: '1655', title: 'Titan', body: 'Christiaan Huygens discovers Saturn’s largest moon and identifies its ring system.', color: '#e9d49b' },
  { year: '1781', title: 'Uranus Discovered', body: 'William Herschel discovers Uranus — the first planet found with a telescope.', color: '#b8f0ef' },
  { year: '1846', title: 'Neptune Predicted', body: "Neptune is mathematically predicted by Le Verrier and observed by Galle and d'Arrest.", color: '#5b8def' },
  { year: '1957', title: 'Space Age Begins', body: 'Sputnik 1 is launched, marking humanity\'s first artificial satellite.', color: '#7dd3fc' },
  { year: '1969', title: 'Moon Landing', body: 'Apollo 11 lands humans on the Moon for the first time in history.', color: '#cfcfcf' },
  { year: '1977', title: 'Voyager 1 & 2', body: 'NASA launches the Voyager probes — still sending data from interstellar space.', color: '#a78bfa' },
  { year: '1990', title: 'Pale Blue Dot', body: 'Voyager 1 photographs Earth from 6 billion km — a tiny mote of dust in a sunbeam.', color: '#60a5fa' },
  { year: '1995', title: 'First Exoplanet', body: '51 Pegasi b — the first confirmed exoplanet orbiting a Sun-like star.', color: '#c4b5fd' },
  { year: '2012', title: 'Curiosity on Mars', body: 'NASA’s Curiosity rover lands on Mars, finding evidence of ancient habitability.', color: '#ff9b6a' },
  { year: '2015', title: 'New Horizons', body: 'New Horizons performs the first-ever flyby of Pluto and reveals an alien world.', color: '#e7d6b0' },
  { year: '2021', title: 'JWST', body: 'The James Webb Space Telescope launches, opening a new infrared window on the cosmos.', color: '#f0abfc' },
];

export default function TimelineView() {
  const view = useStore(s => s.view);
  const setView = useStore(s => s.setView);
  const open = view === 'timeline';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="timeline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.4 } }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="fixed inset-0 z-[60] pointer-events-auto"
        >
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-md"
            onClick={() => setView('explore')}
          />

          <motion.div
            initial={{ y: 30, opacity: 0, filter: 'blur(18px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE, delay: 0.05 } }}
            exit={{ y: 30, opacity: 0, transition: { duration: 0.25 } }}
            className="relative w-full h-full flex flex-col px-6 md:px-12 py-12"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] uppercase tracking-[0.4em] text-white/45 mb-1">Discovery Timeline</div>
                <h2 className="text-2xl md:text-3xl font-light text-gradient">Milestones of Solar Exploration</h2>
              </div>
              <button
                onClick={() => setView('explore')}
                className="w-10 h-10 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 transition flex items-center justify-center text-white/70 hover:text-white"
                aria-label="Close timeline"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 glass-strong rounded-3xl p-6 md:p-8 overflow-hidden">
              <div className="relative h-full overflow-x-auto overflow-y-hidden">
                {/* Horizontal line */}
                <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                <div className="relative flex items-center gap-10 md:gap-16 min-w-max h-full px-6">
                  {EVENTS.map((e, i) => (
                    <motion.div
                      key={e.year + e.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.08 * i + 0.15, duration: 0.6, ease: EASE } }}
                      className="flex flex-col items-center w-56 md:w-64 shrink-0 group"
                    >
                      {/* Card above or below alternating */}
                      <div className={`w-full ${i % 2 === 0 ? 'order-1' : 'order-3'}`}>
                        <div className="glass rounded-2xl p-4 border border-white/8 group-hover:border-white/20 transition">
                          <div className="text-[10px] uppercase tracking-[0.3em] mb-1.5" style={{ color: e.color }}>{e.year}</div>
                          <div className="text-white font-medium leading-snug mb-1.5">{e.title}</div>
                          <div className="text-white/65 text-xs leading-relaxed">{e.body}</div>
                        </div>
                      </div>

                      {/* Connector */}
                      <div className={`order-2 my-3 h-12 w-px bg-gradient-to-b ${i % 2 === 0 ? 'from-white/30 to-transparent' : 'from-transparent to-white/30'}`} />

                      {/* Dot */}
                      <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full`}
                        style={{ background: e.color, boxShadow: `0 0 14px ${e.color}` }} />

                      {/* Empty spacer for the alternating layout */}
                      <div className={`w-full ${i % 2 === 0 ? 'order-3' : 'order-1'} h-0`} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] uppercase tracking-[0.4em] text-white/35 mt-4">
              Scroll horizontally to explore
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
