'use client';
import { useMemo } from 'react';
import * as THREE from 'three';
import { ORBITING } from '@/lib/planets';
import { useStore } from '@/lib/store';

export default function Orbits() {
  const show = useStore(s => s.showOrbits);
  const hovered = useStore(s => s.hoveredId);
  const selected = useStore(s => s.selectedId);

  const orbits = useMemo(() => {
    return ORBITING.map((p) => {
      const segments = 256;
      const positions = new Float32Array((segments + 1) * 3);
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        positions[i * 3] = Math.cos(t) * p.distance;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = Math.sin(t) * p.distance;
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      return { id: p.id, geom, color: p.color.glow };
    });
  }, []);

  if (!show) return null;
  return (
    <group>
      {orbits.map(o => {
        const highlight = hovered === o.id || selected === o.id;
        return (
          <line key={o.id}>
            <bufferGeometry attach="geometry" {...o.geom} />
            <lineBasicMaterial
              attach="material"
              color={highlight ? o.color : '#3b4a6e'}
              transparent
              opacity={highlight ? 0.85 : 0.18}
            />
          </line>
        );
      })}
    </group>
  );
}
