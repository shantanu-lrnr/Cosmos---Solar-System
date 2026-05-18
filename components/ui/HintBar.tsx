'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useEffect, useState } from 'react';

export default function HintBar() {
  const selectedId = useStore(s => s.selectedId);
  const setSelected = useStore(s => s.setSelected);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    if (selectedId) setShowHint(false);
  }, [selectedId]);

  return (
    <AnimatePresence>
      {!selectedId && showHint && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 1, duration: 0.8 } }}
          exit={{ opacity: 0, y: -10, transition: { duration: 0.3 } }}
          className="fixed bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        >
          <div className="text-[10px] uppercase tracking-[0.4em] text-white/40 flex items-center gap-3">
            <span className="w-6 h-px bg-white/30" />
            Click a planet to begin
            <span className="w-6 h-px bg-white/30" />
          </div>
        </motion.div>
      )}

      {selectedId && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
          exit={{ opacity: 0 }}
          onClick={() => setSelected(null)}
          className="fixed bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 z-20 pointer-events-auto text-[10px] uppercase tracking-[0.4em] text-white/55 hover:text-white border border-white/15 hover:border-white/40 rounded-full px-5 py-2 glass transition"
        >
          ← Return to overview
        </motion.button>
      )}
    </AnimatePresence>
  );
}
