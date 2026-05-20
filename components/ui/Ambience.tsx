'use client';
import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';

// Drop your audio file at: public/audio/space-ambience.mp3
// (.ogg / .wav also fine — just change AUDIO_SRC)
const AUDIO_SRC = '/audio/space-ambience.mp3';
const TARGET_VOLUME = 1.0;
const FADE_IN_MS = 150;
const FADE_OUT_MS = 600;

export default function Ambience() {
  const audioOn = useStore(s => s.audioOn);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      const a = new Audio(AUDIO_SRC);
      a.loop = true;
      a.preload = 'auto';
      a.volume = 0;
      audioRef.current = a;
    }
    const a = audioRef.current;

    // Cancel any in-flight fade
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const startVol = a.volume;
    const targetVol = audioOn ? TARGET_VOLUME : 0;
    const duration = audioOn ? FADE_IN_MS : FADE_OUT_MS;
    const startTime = performance.now();

    let unlockCleanup: (() => void) | null = null;

    if (audioOn) {
      const tryPlay = () => a.play();
      tryPlay().catch(() => {
        // Browser blocked autoplay — wait for the first user interaction
        // anywhere on the page, then start. Works for the intro screen
        // where the page loads with audioOn=true but no gesture yet.
        const unlock = () => {
          tryPlay().catch(() => {});
          if (unlockCleanup) unlockCleanup();
        };
        const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart'];
        events.forEach(e => window.addEventListener(e, unlock, { once: true, passive: true }));
        unlockCleanup = () => {
          events.forEach(e => window.removeEventListener(e, unlock));
          unlockCleanup = null;
        };
      });
    }

    const tick = () => {
      const t = Math.min(1, (performance.now() - startTime) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
      a.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        if (!audioOn) {
          a.pause();
          a.currentTime = 0;
        }
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (unlockCleanup) unlockCleanup();
    };
  }, [audioOn]);

  // Stop audio on unmount (route change, etc.)
  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.src = '';
      }
    };
  }, []);

  return null;
}
