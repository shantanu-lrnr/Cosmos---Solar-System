'use client';
import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/lib/store';
import type { Planet as PlanetData } from '@/lib/planets';
import EarthBody from './EarthBody';

const planetVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vWorldNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Procedural planet surface using fbm noise; lit by direction to sun (origin in world)
const planetFrag = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vWorldNormal;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uType;     // 0 rocky, 1 gas, 2 ice
  uniform float uRoughness;
  uniform vec3 uSunDir;    // normalized world dir from planet center to sun

  // hash
  float hash(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float noise(vec3 x){
    vec3 p=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(p+vec3(0,0,0)),hash(p+vec3(1,0,0)),f.x),
                   mix(hash(p+vec3(0,1,0)),hash(p+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(p+vec3(0,0,1)),hash(p+vec3(1,0,1)),f.x),
                   mix(hash(p+vec3(0,1,1)),hash(p+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p){
    float v=0.0; float a=0.5;
    for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.05; a*=0.5; }
    return v;
  }

  void main() {
    vec3 p = normalize(vPos);
    float n;
    if (uType < 0.5) {
      // rocky — combine continents + detail
      n = fbm(p * 2.5) * 0.7 + fbm(p * 8.0) * 0.3;
    } else if (uType < 1.5) {
      // gas — banded
      float bands = sin(p.y * 12.0 + fbm(p * 2.5) * 4.0) * 0.5 + 0.5;
      float turb = fbm(p * 4.0 + uTime * 0.02) * 0.4;
      n = bands * 0.7 + turb;
    } else {
      // ice — smooth striations
      n = fbm(p * 1.8) * 0.6 + 0.4;
      n += sin(p.y * 4.0) * 0.05;
    }
    n = clamp(n, 0.0, 1.0);
    vec3 base = mix(uColorB, uColorA, n);

    // Lambert lighting from sun direction
    float diff = max(dot(normalize(vWorldNormal), uSunDir), 0.0);
    float ambient = 0.06;
    vec3 lit = base * (ambient + diff);

    // Subtle rim
    float rim = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.5);
    lit += uColorA * rim * 0.08;

    gl_FragColor = vec4(lit, 1.0);
  }
`;

const atmoFrag = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform vec3 uSunDir;
  void main() {
    float fres = pow(1.0 - max(dot(vNormal, vec3(0.0,0.0,1.0)), 0.0), 2.0);
    float lit = max(dot(normalize(vWorldNormal), uSunDir), 0.0);
    float a = fres * (0.4 + lit * 0.8) * uIntensity;
    gl_FragColor = vec4(uColor, a);
  }
`;

const atmoVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

type Props = { planet: PlanetData };

export default function Planet({ planet }: Props) {
  const groupRef = useRef<THREE.Group>(null!);   // orbit pivot
  const tiltRef = useRef<THREE.Group>(null!);    // axial tilt holder
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const atmoMatRef = useRef<THREE.ShaderMaterial>(null!);
  const angleRef = useRef<number>(Math.random() * Math.PI * 2);

  const timeScale = useStore(s => s.timeScale);
  const setSelected = useStore(s => s.setSelected);
  const setHovered = useStore(s => s.setHovered);
  const selectedId = useStore(s => s.selectedId);
  const hoveredId = useStore(s => s.hoveredId);
  const showLabels = useStore(s => s.showLabels);
  const view = useStore(s => s.view);

  const [labelHover, setLabelHover] = useState(false);
  const isFocused = selectedId === planet.id;
  const isHovered = hoveredId === planet.id || labelHover;

  const typeVal = planet.type === 'rocky' ? 0 : planet.type === 'gas' ? 1 : 2;

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color(planet.color.primary) },
    uColorB: { value: new THREE.Color(planet.color.secondary) },
    uType: { value: typeVal },
    uRoughness: { value: 0.6 },
    uSunDir: { value: new THREE.Vector3(1, 0, 0) },
  }), [planet, typeVal]);

  const atmoUniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(planet.atmosphere?.color ?? planet.color.glow) },
    uIntensity: { value: planet.atmosphere?.intensity ?? 0 },
    uSunDir: { value: new THREE.Vector3(1, 0, 0) },
  }), [planet]);

  const ringGeom = useMemo(() => {
    if (!planet.ring) return null;
    const g = new THREE.RingGeometry(planet.ring.inner, planet.ring.outer, 128);
    // Re-map UVs so radial axis is uv.x
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const r = v.length();
      const t = (r - planet.ring.inner) / (planet.ring.outer - planet.ring.inner);
      uv.setXY(i, t, 0);
    }
    return g;
  }, [planet]);

  useFrame((state, delta) => {
    angleRef.current += delta * planet.orbitSpeed * 0.15 * timeScale;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angleRef.current) * planet.distance;
      groupRef.current.position.z = Math.sin(angleRef.current) * planet.distance;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * planet.rotationSpeed * 6 * timeScale;
    }
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      // Sun direction relative to planet
      const sunDir = new THREE.Vector3().sub(groupRef.current.position).normalize();
      matRef.current.uniforms.uSunDir.value.copy(sunDir);
      if (atmoMatRef.current) atmoMatRef.current.uniforms.uSunDir.value.copy(sunDir);
    }
  });

  return (
    <group ref={groupRef} name={`planet-${planet.id}`}>
      <group ref={tiltRef} rotation={[0, 0, planet.axialTilt]}>
        {/* Planet sphere — Earth gets a dedicated cinematic body */}
        {planet.id === 'earth' ? (
          <EarthBody
            planet={planet}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(planet.id); document.body.style.cursor = 'pointer'; }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(null); document.body.style.cursor = 'auto'; }}
            onClick={(e) => { e.stopPropagation(); setSelected(planet.id); }}
          />
        ) : (
          <>
            <mesh
              ref={meshRef}
              onPointerOver={(e) => { e.stopPropagation(); setHovered(planet.id); document.body.style.cursor = 'pointer'; }}
              onPointerOut={(e) => { e.stopPropagation(); setHovered(null); document.body.style.cursor = 'auto'; }}
              onClick={(e) => { e.stopPropagation(); setSelected(planet.id); }}
            >
              <sphereGeometry args={[planet.radius, 64, 64]} />
              <shaderMaterial
                ref={matRef}
                vertexShader={planetVert}
                fragmentShader={planetFrag}
                uniforms={uniforms}
              />
            </mesh>

            {planet.atmosphere && (
              <mesh scale={1.06}>
                <sphereGeometry args={[planet.radius, 48, 48]} />
                <shaderMaterial
                  ref={atmoMatRef}
                  transparent
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                  side={THREE.BackSide}
                  uniforms={atmoUniforms}
                  vertexShader={atmoVert}
                  fragmentShader={atmoFrag}
                />
              </mesh>
            )}
          </>
        )}

        {/* Ring system */}
        {planet.ring && ringGeom && (
          <mesh rotation={[Math.PI / 2 + planet.ring.tilt, 0, 0]} geometry={ringGeom}>
            <shaderMaterial
              transparent
              side={THREE.DoubleSide}
              depthWrite={false}
              uniforms={{
                uColor: { value: new THREE.Color(planet.ring.color) },
                uOpacity: { value: planet.ring.opacity },
              }}
              vertexShader={/* glsl */`
                varying vec2 vUv;
                void main(){
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }
              `}
              fragmentShader={/* glsl */`
                varying vec2 vUv;
                uniform vec3 uColor;
                uniform float uOpacity;
                float hash(float x){ return fract(sin(x*43758.5453)); }
                void main(){
                  float t = vUv.x;
                  float bands = sin(t * 90.0) * 0.5 + 0.5;
                  bands *= mix(0.5, 1.0, hash(floor(t*30.0)));
                  float edge = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.94, 1.0, t));
                  float a = bands * edge * uOpacity;
                  gl_FragColor = vec4(uColor, a);
                }
              `}
            />
          </mesh>
        )}

        {/* Moons */}
        {planet.moons?.map((moon) => (
          <Moon key={moon.id} moon={moon} planetRadius={planet.radius} />
        ))}

        {/* Focus indicator */}
        {(isHovered || isFocused) && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.radius * 1.45, planet.radius * 1.5, 64]} />
            <meshBasicMaterial color={planet.color.glow} transparent opacity={isFocused ? 0.9 : 0.5} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>

      {/* Label */}
      {showLabels && view === 'explore' && (
        <Html
          center
          position={[0, planet.radius * 1.9 + 0.4, 0]}
          distanceFactor={18}
          style={{ pointerEvents: 'auto' }}
        >
          <button
            onClick={() => setSelected(planet.id)}
            onMouseEnter={() => { setLabelHover(true); setHovered(planet.id); }}
            onMouseLeave={() => { setLabelHover(false); setHovered(null); }}
            className={`group whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wider uppercase border transition-all duration-300
              ${isHovered || isFocused
                ? 'bg-white/15 border-white/40 text-white scale-110'
                : 'bg-black/30 border-white/10 text-white/80 hover:bg-white/10'}
            `}
            style={{
              boxShadow: isHovered || isFocused ? `0 0 24px ${planet.color.glow}80` : 'none',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
              style={{ background: planet.color.glow, boxShadow: `0 0 8px ${planet.color.glow}` }} />
            {planet.name}
          </button>
        </Html>
      )}
    </group>
  );
}

function Moon({ moon, planetRadius }: { moon: PlanetData['moons'][number] extends infer T ? T : never; planetRadius: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  const angleRef = useRef<number>(Math.random() * Math.PI * 2);
  const timeScale = useStore(s => s.timeScale);
  useFrame((_, delta) => {
    angleRef.current += delta * moon.speed * 0.3 * timeScale;
    const d = planetRadius + moon.distance;
    ref.current.position.x = Math.cos(angleRef.current) * d;
    ref.current.position.z = Math.sin(angleRef.current) * d;
    ref.current.rotation.y += delta * 0.5;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[moon.radius, 24, 24]} />
      <meshStandardMaterial color={moon.color} roughness={0.95} metalness={0.05} />
    </mesh>
  );
}
