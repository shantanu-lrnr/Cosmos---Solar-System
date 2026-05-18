'use client';
import { create } from 'zustand';

export type View = 'explore' | 'compare' | 'timeline';

type State = {
  selectedId: string | null;
  hoveredId: string | null;
  timeScale: number;
  showOrbits: boolean;
  showLabels: boolean;
  audioOn: boolean;
  introDone: boolean;
  tourMode: boolean;
  ready: boolean;
  view: View;
  setReady: (v: boolean) => void;
  setSelected: (id: string | null) => void;
  setHovered: (id: string | null) => void;
  setTimeScale: (v: number) => void;
  setShowOrbits: (v: boolean) => void;
  setShowLabels: (v: boolean) => void;
  toggleAudio: () => void;
  finishIntro: () => void;
  setTour: (v: boolean) => void;
  setView: (v: View) => void;
};

export const useStore = create<State>((set) => ({
  selectedId: null,
  hoveredId: null,
  timeScale: 1,
  showOrbits: true,
  showLabels: true,
  audioOn: false,
  introDone: false,
  tourMode: false,
  ready: false,
  view: 'explore',
  setView: (v) => set({ view: v }),
  setReady: (v) => set({ ready: v }),
  setSelected: (id) => set({ selectedId: id }),
  setHovered: (id) => set({ hoveredId: id }),
  setTimeScale: (v) => set({ timeScale: v }),
  setShowOrbits: (v) => set({ showOrbits: v }),
  setShowLabels: (v) => set({ showLabels: v }),
  toggleAudio: () => set((s) => ({ audioOn: !s.audioOn })),
  finishIntro: () => set({ introDone: true }),
  setTour: (v) => set({ tourMode: v }),
}));
