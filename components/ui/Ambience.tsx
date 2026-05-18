'use client';
import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';

// Procedurally synthesized ambient drone — no audio file needed.
export default function Ambience() {
  const audioOn = useStore(s => s.audioOn);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ master: GainNode; oscs: { osc: OscillatorNode; gain: GainNode }[] } | null>(null);

  useEffect(() => {
    if (!audioOn) {
      if (nodesRef.current) {
        nodesRef.current.master.gain.cancelScheduledValues(0);
        nodesRef.current.master.gain.linearRampToValueAtTime(0, (ctxRef.current?.currentTime ?? 0) + 0.6);
        const oscs = nodesRef.current.oscs;
        setTimeout(() => {
          oscs.forEach(({ osc }) => { try { osc.stop(); } catch {} });
          ctxRef.current?.close();
          ctxRef.current = null;
          nodesRef.current = null;
        }, 700);
      }
      return;
    }

    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2);

    // Low pass filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.7;
    filter.connect(master);

    const freqs = [55, 82.4, 110, 164.8, 220];
    const oscs = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.18 / (i + 1), ctx.currentTime + 3);
      // Slow LFO on gain
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.06 + i * 0.03;
      lfoGain.gain.value = 0.08;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      lfo.start();
      osc.connect(g);
      g.connect(filter);
      osc.start();
      return { osc, gain: g };
    });

    nodesRef.current = { master, oscs };

    return () => {
      try { master.disconnect(); } catch {}
    };
  }, [audioOn]);

  return null;
}
