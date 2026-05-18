'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { EASE } from '@/lib/motion';

export default function Intro() {
  const introDone = useStore(s => s.introDone);
  const finishIntro = useStore(s => s.finishIntro);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (introDone) setShow(false);
  }, [introDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.2, ease: EASE } }}
          className="fixed inset-0 z-40 flex items-center justify-center pointer-events-auto bg-gradient-to-b from-black/85 via-black/60 to-transparent"
        >
          {/* Backdrop grid */}
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute inset-0 bg-gradient-radial" style={{
            background: 'radial-gradient(ellipse at center, rgba(125,211,252,0.06) 0%, transparent 60%)'
          }} />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 1.4, delay: 0.1, ease: EASE } }}
            className="relative text-center max-w-2xl px-6"
          >
            <motion.div
              initial={{ letterSpacing: '0.1em', opacity: 0 }}
              animate={{ letterSpacing: '0.5em', opacity: 1, transition: { duration: 1.8, delay: 0.4 } }}
              className="text-[10px] md:text-xs uppercase text-cosmos-accent/80 mb-5"
            >
              Anthropic Stellar Observatory
            </motion.div>

            <motion.h1
              className="font-display text-5xl md:text-7xl font-light text-gradient mb-5"
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.6, delay: 0.6 } }}
            >
              Welcome to the Cosmos
            </motion.h1>

            <motion.p
              className="text-white/60 text-base md:text-lg max-w-lg mx-auto mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 1.2, delay: 1.0 } }}
            >
              A real-time interactive journey through our solar system.
              <br className="hidden md:inline" />
              Click any world to travel there.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.9, delay: 1.4 } }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => finishIntro()}
              className="btn-glow group relative px-8 py-3.5 rounded-full text-sm uppercase tracking-[0.3em] text-white glass-strong"
            >
              <span className="relative z-10">Begin Journey</span>
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cosmos-accent/0 via-cosmos-accent/15 to-cosmos-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </motion.button>

            <motion.div
              className="mt-12 flex justify-center gap-6 text-[10px] uppercase tracking-[0.3em] text-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 1.8, duration: 1 } }}
            >
              <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-cosmos-accent" /> Click planets</div>
              <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-cosmos-plasma" /> Drag to orbit</div>
              <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-pink-400" /> Scroll to zoom</div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
