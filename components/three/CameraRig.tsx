'use client';
import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { useStore } from '@/lib/store';
import { getPlanet, PLANETS } from '@/lib/planets';

// Cubic easing
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export default function CameraRig({ controlsRef }: { controlsRef: React.MutableRefObject<OrbitControls | null> }) {
  const { camera } = useThree();
  const selectedId = useStore(s => s.selectedId);
  const tourMode = useStore(s => s.tourMode);

  const animRef = useRef<{
    active: boolean;
    t: number;
    duration: number;
    fromPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toPos: THREE.Vector3;
    toTarget: THREE.Vector3;
  } | null>(null);

  const tourIndex = useRef(0);
  const tourTimer = useRef(0);
  const lastTourMode = useRef(false);

  // Begin transition when selection changes
  useEffect(() => {
    const planet = getPlanet(selectedId);
    const controls = controlsRef.current;
    if (!controls) return;

    // Compute target position dynamically each frame instead of static — but capture target id
    const fromPos = camera.position.clone();
    const fromTarget = controls.target.clone();

    let toPos = new THREE.Vector3();
    let toTarget = new THREE.Vector3();

    if (planet) {
      // Compute current world position of the planet (approx — same compute as Planet uses with random offset means we can't know exact angle. We use planet.distance and current scene angle 0 as approx, but more reliably: do a search by id on rendered objects via the scene.) For simplicity we use a snap-to-orbit-distance vector along sun-camera ray.
      // We'll set a placeholder; the camera update loop computes the real target using scene.getObjectByName.
      toTarget.set(planet.distance, 0, 0);
      const offset = planet.radius * 5 + 3;
      toPos.copy(toTarget).add(new THREE.Vector3(offset * 0.5, offset * 0.4, offset));
    } else {
      // Reset to overview
      toTarget.set(0, 0, 0);
      toPos.set(0, 50, 110);
    }

    animRef.current = {
      active: true,
      t: 0,
      duration: planet ? 1.8 : 2.2,
      fromPos,
      fromTarget,
      toPos,
      toTarget,
    };
  }, [selectedId, camera, controlsRef]);

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const anim = animRef.current;

    // Find planet object in scene for live target tracking
    const planet = getPlanet(selectedId);
    let livePos: THREE.Vector3 | null = null;
    if (planet && planet.id !== 'sun') {
      const obj = state.scene.getObjectByName(`planet-${planet.id}`);
      if (obj) {
        livePos = new THREE.Vector3();
        obj.getWorldPosition(livePos);
      }
    } else if (planet?.id === 'sun') {
      livePos = new THREE.Vector3(0, 0, 0);
    }

    if (anim?.active) {
      anim.t += delta / anim.duration;
      const t = Math.min(anim.t, 1);
      const e = ease(t);

      // Live tracking — if there's a live position, adjust the target end-point
      let toTarget = anim.toTarget;
      let toPos = anim.toPos;
      if (livePos && planet) {
        toTarget = livePos.clone();
        const offset = planet.radius * 5 + 3;
        // place camera relative to live planet
        toPos = livePos.clone().add(new THREE.Vector3(offset * 0.6, offset * 0.45, offset));
      }

      camera.position.lerpVectors(anim.fromPos, toPos, e);
      controls.target.lerpVectors(anim.fromTarget, toTarget, e);
      controls.update();
      if (t >= 1) {
        anim.active = false;
      }
    } else if (planet && livePos) {
      // After arrival, keep following the planet smoothly
      const offset = planet.radius * 5 + 3;
      const desiredTarget = livePos;
      const desiredPos = livePos.clone().add(new THREE.Vector3(offset * 0.6, offset * 0.45, offset));
      // Only follow tightly when not user-orbiting
      const dampTarget = 0.06;
      controls.target.lerp(desiredTarget, dampTarget);
      // Don't slam position — let user orbit freely; just nudge slowly
      const nudge = 0.015;
      camera.position.lerp(
        new THREE.Vector3().copy(camera.position).add(
          desiredTarget.clone().sub(controls.target)
        ),
        nudge
      );
      controls.update();
    } else {
      controls.update();
    }

    // Auto-tour
    if (tourMode) {
      // Just turned on — jump immediately
      if (!lastTourMode.current) {
        lastTourMode.current = true;
        tourTimer.current = 0;
        tourIndex.current = 0;
        useStore.getState().setSelected(PLANETS[tourIndex.current].id);
      } else if (!anim?.active) {
        tourTimer.current += delta;
        if (tourTimer.current > 2.2) {
          tourTimer.current = 0;
          tourIndex.current = (tourIndex.current + 1) % PLANETS.length;
          useStore.getState().setSelected(PLANETS[tourIndex.current].id);
        }
      }
    } else {
      lastTourMode.current = false;
      tourTimer.current = 0;
    }
  });

  return null;
}
