'use client';
import { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
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
  const introDone = useStore(s => s.introDone);

  const [labelHover, setLabelHover] = useState(false);
  const isFocused = selectedId === planet.id;
  const isHovered = hoveredId === planet.id || labelHover;

  const labelWrapRef = useRef<HTMLDivElement>(null);
  const camera = useThree(s => s.camera);

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
      // Sun direction relative to planet — write straight into uniform, no alloc
      const sunDir = matRef.current.uniforms.uSunDir.value as THREE.Vector3;
      sunDir.copy(groupRef.current.position).multiplyScalar(-1).normalize();
      if (atmoMatRef.current) atmoMatRef.current.uniforms.uSunDir.value.copy(sunDir);
    }

    // Clamp label scale by camera distance so close zoom doesn't blow it up.
    if (labelWrapRef.current && groupRef.current) {
      const dist = camera.position.distanceTo(groupRef.current.position);
      // dist  8 → scale 1.1   (close)
      // dist 80 → scale 0.7   (far)
      const t = Math.max(0, Math.min(1, (dist - 8) / 72));
      const scale = 1.1 - t * 0.4;
      labelWrapRef.current.style.transform = `scale(${scale.toFixed(3)})`;
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
          <Moon
            key={moon.id}
            moon={moon}
            planetRadius={planet.radius}
            parentPlanetColor={planet.color.glow}
            parentGroupRef={groupRef}
          />
        ))}

        {/* Focus indicator */}
        {(isHovered || isFocused) && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.radius * 1.45, planet.radius * 1.5, 64]} />
            <meshBasicMaterial color={planet.color.glow} transparent opacity={isFocused ? 0.9 : 0.5} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>

      {/* Label — fixed-screen-size with a gentle distance-clamped scale */}
      {showLabels && view === 'explore' && introDone && (
        <Html
          center
          position={[0, planet.radius * 1.9 + 0.4, 0]}
          style={{ pointerEvents: 'auto' }}
          zIndexRange={[20, 0]}
        >
          <div
            ref={labelWrapRef}
            style={{ transformOrigin: 'center', willChange: 'transform' }}
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
          </div>
        </Html>
      )}
    </group>
  );
}

// Reusable temp vectors so per-frame moon updates allocate nothing.
const _moonWorld = new THREE.Vector3();
const _sunDirTmp = new THREE.Vector3();
const _bounceDirTmp = new THREE.Vector3();

type MoonType = 0 | 1 | 2 | 3 | 4; // 0 rocky · 1 icy · 2 volcanic · 3 hazy · 4 dual-tone

// Map a moon id → visual profile. Tint biases the surface; haze adds a halo shell.
function moonProfile(id: string): {
  type: MoonType;
  tint: string;
  brightness: number;
  haze?: { color: string; intensity: number };
} {
  switch (id) {
    // ── Jupiter system ─────────────────────────────────────────
    case 'io':         return { type: 2, tint: '#ffb96b', brightness: 1.05, haze: { color: '#ff8a3d', intensity: 0.25 } };
    case 'europa':     return { type: 1, tint: '#e7d6b0', brightness: 1.10, haze: { color: '#cfe9ff', intensity: 0.22 } };
    case 'ganymede':   return { type: 0, tint: '#bcab94', brightness: 1.00 };
    case 'callisto':   return { type: 0, tint: '#8d8070', brightness: 0.95 };
    case 'amalthea':   return { type: 0, tint: '#d27a5a', brightness: 1.10 };
    case 'thebe':      return { type: 0, tint: '#a09280', brightness: 0.95 };
    case 'adrastea':   return { type: 0, tint: '#c8baa8', brightness: 1.00 };
    case 'himalia':    return { type: 0, tint: '#7c726a', brightness: 0.85 };
    case 'elara':      return { type: 0, tint: '#897e72', brightness: 0.85 };
    case 'pasiphae':   return { type: 0, tint: '#564f48', brightness: 0.80 };

    // ── Saturn system ──────────────────────────────────────────
    case 'janus':      return { type: 0, tint: '#c4bcaa', brightness: 1.00 };
    case 'epimetheus': return { type: 0, tint: '#b8b09e', brightness: 0.95 };
    case 'mimas':      return { type: 1, tint: '#e8eaec', brightness: 1.10 };
    case 'enceladus':  return { type: 1, tint: '#f4faff', brightness: 1.25, haze: { color: '#e4f1ff', intensity: 0.40 } };
    case 'tethys':     return { type: 1, tint: '#eff2f5', brightness: 1.15 };
    case 'dione':      return { type: 1, tint: '#d4d8db', brightness: 1.05 };
    case 'rhea':       return { type: 1, tint: '#dde0e2', brightness: 1.05 };
    case 'titan':      return { type: 3, tint: '#d9a85d', brightness: 1.00, haze: { color: '#f0b878', intensity: 0.60 } };
    case 'hyperion':   return { type: 0, tint: '#c1a37a', brightness: 1.00 };
    case 'iapetus':    return { type: 4, tint: '#e8eef0', brightness: 1.05 }; // dual-tone
    case 'phoebe':     return { type: 0, tint: '#4d473f', brightness: 0.80 };

    // ── Uranus system ──────────────────────────────────────────
    case 'portia':     return { type: 0, tint: '#a09c97', brightness: 0.95 };
    case 'puck':       return { type: 0, tint: '#9a9692', brightness: 0.95 };
    case 'miranda':    return { type: 1, tint: '#d8e2e6', brightness: 1.05 };
    case 'ariel':      return { type: 1, tint: '#d8e2e6', brightness: 1.05 };
    case 'umbriel':    return { type: 1, tint: '#7a7d82', brightness: 0.90 };
    case 'titania':    return { type: 0, tint: '#b8a89a', brightness: 0.95 };
    case 'oberon':     return { type: 0, tint: '#988779', brightness: 0.90 };

    // ── Neptune system ─────────────────────────────────────────
    case 'despina':    return { type: 0, tint: '#8d8f93', brightness: 0.90 };
    case 'galatea':    return { type: 0, tint: '#92949a', brightness: 0.90 };
    case 'larissa':    return { type: 0, tint: '#82848a', brightness: 0.90 };
    case 'proteus':    return { type: 0, tint: '#7e828a', brightness: 0.90 };
    case 'triton':     return { type: 1, tint: '#dde6ee', brightness: 1.10, haze: { color: '#bcd8f0', intensity: 0.25 } };
    case 'nereid':     return { type: 0, tint: '#bdb9ac', brightness: 0.95 };

    // ── Inner planets ──────────────────────────────────────────
    case 'luna':       return { type: 0, tint: '#d6d0c4', brightness: 1.05 };
    case 'phobos':
    case 'deimos':     return { type: 0, tint: '#a39684', brightness: 1.00 };

    default:           return { type: 0, tint: '#bdbdbd', brightness: 1.00 };
  }
}

// Deterministic 0..1 hash from a moon id — used to give each moon a unique
// ascending-node rotation so inclined orbits don't all share a plane.
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h % 100000) / 100000;
}

const moonVert = /* glsl */`
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

// Cinematic moon shader: type-aware surface + Lambert sun + parent bounce + rim.
const moonFrag = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vWorldNormal;
  uniform float uTime;
  uniform vec3 uColor;        // base albedo
  uniform vec3 uTint;         // type-specific tint
  uniform float uType;        // 0 rocky, 1 icy, 2 volcanic, 3 hazy
  uniform float uBrightness;
  uniform vec3 uSunDir;       // world dir from moon to sun (normalized)
  uniform vec3 uBounceDir;    // world dir from moon to parent planet (normalized)
  uniform vec3 uBounceColor;  // parent planet glow color

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
    for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.05+1.3; a*=0.5; }
    return v;
  }

  void main() {
    vec3 p = normalize(vPos);
    float n;
    float hot = 0.0;
    if (uType < 0.5) {
      // rocky — craters (low-freq dark spots) + small detail
      float craters = fbm(p * 3.2);
      float detail  = fbm(p * 11.0);
      n = mix(0.45, 1.0, craters) * 0.75 + detail * 0.25;
    } else if (uType < 1.5) {
      // icy — smoother, with crack-like striations
      float ice = fbm(p * 2.6);
      float cracks = smoothstep(0.45, 0.55, sin(p.y * 8.0 + fbm(p*4.0)*6.0)*0.5+0.5);
      n = ice * 0.75 + cracks * 0.15 + 0.15;
    } else if (uType < 2.5) {
      // volcanic — high-contrast surface + hotspots
      float base = fbm(p * 3.5);
      n = base * 0.7 + 0.3;
      hot = smoothstep(0.62, 0.92, fbm(p * 5.5 + vec3(uTime * 0.04)));
    } else if (uType < 3.5) {
      // hazy — soft, low-contrast surface
      n = fbm(p * 2.0) * 0.45 + 0.55;
    } else {
      // dual-tone hemisphere (Iapetus — leading dark, trailing icy bright)
      float boundary = smoothstep(-0.22, 0.22, p.x + fbm(p * 2.0) * 0.20);
      float dark = fbm(p * 3.5) * 0.20 + 0.04;
      float bright = fbm(p * 3.0) * 0.40 + 0.55;
      n = mix(dark, bright, boundary);
    }
    n = clamp(n, 0.0, 1.0);

    vec3 albedo;
    if (uType > 3.5) {
      // Dual-tone: hard contrast between uColor (dark) and uTint (icy bright)
      albedo = mix(uColor * 0.45, uTint * 1.10, n);
    } else {
      albedo = mix(uColor * 0.55, mix(uColor, uTint, 0.5) * 1.15, n);
    }
    if (uType > 1.5 && uType < 2.5) {
      // Io-style hot lava glow
      albedo += vec3(1.0, 0.45, 0.10) * hot * 0.85;
    }

    vec3 N = normalize(vWorldNormal);

    // Primary sunlight — Lambert with a small terminator softening
    float NdotL = dot(N, uSunDir);
    float diff = max(NdotL, 0.0);
    // Soften the terminator so the dark side eases in instead of cliffing to black
    float term = smoothstep(-0.25, 0.35, NdotL);

    // Bounce light from parent planet — soft and tinted
    float bN = max(dot(N, uBounceDir), 0.0);
    vec3 bounce = uBounceColor * bN * 0.28;

    // Tiny ambient floor so the moon never reads as pure black against space
    vec3 ambient = vec3(0.045, 0.052, 0.075);

    vec3 lit = albedo * (ambient + diff * 1.05 + bounce);
    // re-add bounce as light too (slight extra without coloring the albedo too much)
    lit += bounce * 0.35;

    // Cinematic rim — strongest on the lit side, faint on the dark side for readability
    float fres = pow(1.0 - max(dot(vNormal, vec3(0.0,0.0,1.0)), 0.0), 2.2);
    vec3 rimColor = mix(uColor, vec3(1.0), 0.5);
    lit += rimColor * fres * (0.18 + term * 0.55);
    // Faint dark-side rim from bounce so the silhouette never disappears
    lit += uBounceColor * fres * (1.0 - term) * 0.12;

    // Visibility lift — gentle gamma so mid-tones stay readable
    lit *= uBrightness;
    lit = pow(lit, vec3(0.92));

    gl_FragColor = vec4(lit, 1.0);
  }
`;

const moonHazeFrag = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform vec3 uSunDir;
  void main() {
    float fres = pow(1.0 - max(dot(vNormal, vec3(0.0,0.0,1.0)), 0.0), 2.0);
    float lit = max(dot(normalize(vWorldNormal), uSunDir), 0.0);
    float a = fres * (0.35 + lit * 0.75) * uIntensity;
    gl_FragColor = vec4(uColor, a);
  }
`;

function Moon({
  moon,
  planetRadius,
  parentPlanetColor,
  parentGroupRef,
}: {
  moon: NonNullable<PlanetData['moons']>[number];
  planetRadius: number;
  parentPlanetColor: string;
  parentGroupRef: React.RefObject<THREE.Group>;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const hazeMatRef = useRef<THREE.ShaderMaterial>(null!);
  const angleRef = useRef<number>(Math.random() * Math.PI * 2);
  const timeScale = useStore(s => s.timeScale);

  const profile = useMemo(() => moonProfile(moon.id), [moon.id]);

  // Each moon's orbital plane: unique ascending-node rotation around Y so
  // inclined orbits don't all share the same plane.
  const ascendingNode = useMemo(() => hashStr(moon.id) * Math.PI * 2, [moon.id]);
  const inclination = moon.inclination ?? 0;

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(moon.color) },
    uTint: { value: new THREE.Color(profile.tint) },
    uType: { value: profile.type as number },
    uBrightness: { value: profile.brightness },
    uSunDir: { value: new THREE.Vector3(1, 0, 0) },
    uBounceDir: { value: new THREE.Vector3(-1, 0, 0) },
    uBounceColor: { value: new THREE.Color(parentPlanetColor).multiplyScalar(0.35) },
  }), [moon.color, profile, parentPlanetColor]);

  const hazeUniforms = useMemo(() => profile.haze ? ({
    uColor: { value: new THREE.Color(profile.haze.color) },
    uIntensity: { value: profile.haze.intensity },
    uSunDir: { value: uniforms.uSunDir.value },
  }) : null, [profile, uniforms.uSunDir]);

  // Tessellation: small moons need less than larger ones
  const segs = moon.radius >= 0.18 ? 32 : 20;

  useFrame((state, delta) => {
    angleRef.current += delta * moon.speed * 0.3 * timeScale;
    const d = planetRadius + moon.distance;
    const m = ref.current;
    if (!m) return;
    m.position.x = Math.cos(angleRef.current) * d;
    m.position.z = Math.sin(angleRef.current) * d;
    m.rotation.y += delta * 0.5;

    if (matRef.current && parentGroupRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;

      // World position of the moon (after the parent group + tilt rotations).
      m.updateMatrixWorld();
      m.getWorldPosition(_moonWorld);

      // Sun is at world origin → sunDir = (origin - moon).normalize()
      _sunDirTmp.copy(_moonWorld).multiplyScalar(-1).normalize();
      matRef.current.uniforms.uSunDir.value.copy(_sunDirTmp);

      // Bounce dir from moon → parent planet center
      _bounceDirTmp.copy(parentGroupRef.current.position).sub(_moonWorld).normalize();
      matRef.current.uniforms.uBounceDir.value.copy(_bounceDirTmp);
    }
  });

  return (
    // Outer group: ascending-node rotation around Y (so two inclined moons
    // don't share the exact same orbital plane).
    <group rotation={[0, ascendingNode, 0]}>
      {/* Inner group: inclination tilt around X (the orbital plane itself). */}
      <group rotation={[inclination, 0, 0]}>
        <mesh ref={ref}>
          <sphereGeometry args={[moon.radius, segs, segs]} />
          <shaderMaterial
            ref={matRef}
            vertexShader={moonVert}
            fragmentShader={moonFrag}
            uniforms={uniforms}
          />
          {profile.haze && hazeUniforms && (
            <mesh scale={1.18}>
              <sphereGeometry args={[moon.radius, Math.max(16, segs - 8), Math.max(16, segs - 8)]} />
              <shaderMaterial
                ref={hazeMatRef}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                side={THREE.BackSide}
                uniforms={hazeUniforms}
                vertexShader={moonVert}
                fragmentShader={moonHazeFrag}
              />
            </mesh>
          )}
        </mesh>
      </group>
    </group>
  );
}
