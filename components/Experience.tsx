'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls, AdaptiveDpr, AdaptiveEvents, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import type { OrbitControls } from 'three-stdlib';

import Sun from './three/Sun';
import Planet from './three/Planet';
import Orbits from './three/Orbits';
import Background from './three/Background';
import Effects from './three/Effects';
import CameraRig from './three/CameraRig';
import { ORBITING } from '@/lib/planets';

import Intro from './ui/Intro';
import TopBar from './ui/TopBar';
import PlanetPanel from './ui/PlanetPanel';
import BottomControls from './ui/BottomControls';
import PlanetDock from './ui/PlanetDock';
import HintBar from './ui/HintBar';
import Ambience from './ui/Ambience';
import CompareView from './ui/CompareView';
import TimelineView from './ui/TimelineView';

export default function Experience() {
  const controlsRef = useRef<OrbitControls | null>(null);

  return (
    <>
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
        }}
        camera={{ position: [0, 50, 110], fov: 45, near: 0.1, far: 2000 }}
      >
        <color attach="background" args={['#03040a']} />
        <fog attach="fog" args={['#03040a', 200, 700]} />

        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        <ambientLight intensity={0.04} color="#9bb4ff" />

        <Suspense fallback={null}>
          <Background />
          <Sun />
          <Orbits />
          {ORBITING.map(p => <Planet key={p.id} planet={p} />)}
        </Suspense>

        <DreiOrbitControls
          ref={controlsRef as any}
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.55}
          zoomSpeed={0.85}
          minDistance={4}
          maxDistance={400}
          makeDefault
        />
        <CameraRig controlsRef={controlsRef} />

        <Suspense fallback={null}>
          <Effects />
        </Suspense>
      </Canvas>

      {/* UI layer */}
      <Intro />
      <TopBar />
      <PlanetDock />
      <PlanetPanel />
      <BottomControls />
      <HintBar />
      <Ambience />
      <CompareView />
      <TimelineView />

      {/* Corner crosshair decor */}
      <Corners />
    </>
  );
}

function Corners() {
  return (
    <>
      <div className="pointer-events-none fixed top-4 left-4 w-6 h-6 border-l border-t border-white/15" />
      <div className="pointer-events-none fixed top-4 right-4 w-6 h-6 border-r border-t border-white/15" />
      <div className="pointer-events-none fixed bottom-4 left-4 w-6 h-6 border-l border-b border-white/15" />
      <div className="pointer-events-none fixed bottom-4 right-4 w-6 h-6 border-r border-b border-white/15" />
    </>
  );
}
