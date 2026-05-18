'use client';
import { motion } from 'framer-motion';
import { useStore, type View } from '@/lib/store';
import { EASE } from '@/lib/motion';

export default function TopBar() {
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { duration: 1, delay: 0.3, ease: EASE } }}
      className="fixed top-0 left-0 right-0 z-30 pointer-events-none"
    >
      <div className="flex items-center justify-between px-5 md:px-8 pt-5">
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border border-cosmos-accent/40 animate-pulse-slow" />
            <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-cosmos-accent to-cosmos-plasma shadow-[0_0_18px_#7dd3fc]" />
          </div>
          <div className="leading-tight">
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/50">Cosmos</div>
            <div className="text-sm font-medium tracking-wide text-white">Stellar Atlas v2.6</div>
          </div>
        </div>

        <Nav />

        <SystemStats />
      </div>
    </motion.div>
  );
}

function Nav() {
  const view = useStore(s => s.view);
  const setView = useStore(s => s.setView);
  const tour = useStore(s => s.tourMode);
  const setTour = useStore(s => s.setTour);

  const items: { label: string; onClick: () => void; isActive: boolean }[] = [
    { label: 'Explore',  onClick: () => { setView('explore'); setTour(false); }, isActive: view === 'explore' && !tour },
    { label: 'Tour',     onClick: () => { setView('explore'); setTour(!tour); }, isActive: tour },
    { label: 'Compare',  onClick: () => { setTour(false); setView(view === 'compare' ? 'explore' : 'compare'); }, isActive: view === 'compare' },
    { label: 'Timeline', onClick: () => { setTour(false); setView(view === 'timeline' ? 'explore' : 'timeline'); }, isActive: view === 'timeline' },
  ];

  return (
    <div className="pointer-events-auto hidden md:flex items-center gap-2 glass rounded-full px-1.5 py-1.5">
      {items.map(it => (
        <NavPill key={it.label} label={it.label} active={it.isActive} onClick={it.onClick} />
      ))}
    </div>
  );
}

function NavPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-1.5 rounded-full text-[11px] uppercase tracking-[0.25em] transition-colors
        ${active ? 'text-white' : 'text-white/55 hover:text-white/90'}`}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-full bg-white/10 border border-white/15"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
      <span className="relative">{label}</span>
    </button>
  );
}

function SystemStats() {
  const hovered = useStore(s => s.hoveredId);
  return (
    <div className="pointer-events-auto flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/60">
      <div className="hidden sm:flex items-center gap-2 glass rounded-full px-3 py-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>System Online</span>
      </div>
      <div className="hidden lg:flex items-center gap-2 glass rounded-full px-3 py-1.5 font-mono normal-case tracking-normal text-white/70">
        <span className="text-white/40">Target</span>
        <span className="text-cosmos-accent capitalize">{hovered ?? '—'}</span>
      </div>
    </div>
  );
}
