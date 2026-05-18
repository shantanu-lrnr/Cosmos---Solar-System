'use client';
import { motion } from 'framer-motion';
import { PLANETS } from '@/lib/planets';
import { useStore } from '@/lib/store';
import { EASE } from '@/lib/motion';

export default function PlanetDock() {
  const selected = useStore(s => s.selectedId);
  const setSelected = useStore(s => s.setSelected);
  const view = useStore(s => s.view);

  if (view !== 'explore') return null;

  return (
    <motion.div
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1, transition: { delay: 0.6, duration: 0.9, ease: EASE } }}
      className="fixed left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 pointer-events-auto hidden sm:block"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      <div className="glass rounded-3xl py-2 px-1.5 flex flex-col gap-0.5 max-h-full overflow-y-auto">
        {PLANETS.map((p, i) => {
          const active = selected === p.id;
          return (
            <motion.button
              key={p.id}
              onClick={() => setSelected(p.id)}
              whileHover={{ scale: 1.08, x: 4 }}
              whileTap={{ scale: 0.95 }}
              className={`group relative flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full transition
                ${active ? 'bg-white/8' : 'hover:bg-white/5'}`}
            >
              <div
                className="w-5 h-5 rounded-full relative shrink-0 bg-cover bg-center"
                style={p.id === 'earth' ? {
                  backgroundImage: `
                    radial-gradient(circle at 30% 28%, rgba(255,255,255,0.22) 0%, transparent 36%),
                    radial-gradient(circle at 72% 75%, rgba(0,0,0,0.55) 55%, transparent 92%),
                    url('/textures/earth/2k_earth_daymap.jpg')
                  `,
                  backgroundSize: '100%, 100%, 220%',
                  backgroundPosition: 'center, center, 38% 50%',
                  boxShadow: active
                    ? `0 0 18px ${p.color.glow}, inset 0 0 6px rgba(0,0,0,0.4)`
                    : `0 0 0 1px rgba(255,255,255,0.08), inset 0 0 6px rgba(0,0,0,0.4)`,
                } : {
                  background: `radial-gradient(circle at 30% 30%, ${p.color.primary}, ${p.color.secondary})`,
                  boxShadow: active
                    ? `0 0 18px ${p.color.glow}, inset 0 0 6px rgba(0,0,0,0.4)`
                    : `0 0 0 1px rgba(255,255,255,0.06), inset 0 0 6px rgba(0,0,0,0.4)`,
                }}
              >
                {p.ring && (
                  <div className="absolute -inset-1 rounded-full border" style={{
                    borderColor: p.color.glow,
                    opacity: 0.35,
                    transform: 'rotateX(70deg)',
                  }} />
                )}
              </div>
              <div className={`text-[11px] uppercase tracking-[0.2em] transition-all
                ${active ? 'text-white' : 'text-white/55 group-hover:text-white/85'}
                hidden md:block`}>
                {p.name}
              </div>
              {active && (
                <motion.span
                  layoutId="dock-bar"
                  className="absolute -left-1.5 inset-y-1 w-[3px] rounded-full bg-cosmos-accent"
                  style={{ boxShadow: '0 0 10px #7dd3fc' }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
