'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Realistic deep-space background:
//  - NebulaShell: mostly-black sky with a soft Milky Way band, faint dust lanes,
//    and rare subtle nebulosities (no fantasy purple).
//  - StarLayer (x3): tiny far stars, mid stars, rare bright giants. Colors are
//    drawn from a stellar-class palette (O/B blue → M red) weighted to match
//    real population statistics, so the sky reads as authentic.
//  - DustParticles: a thin foreground veil to add parallax / motion.

export default function Background() {
  return (
    <>
      <NebulaShell />
      {/* Dense far-distance background — biased toward the galactic band */}
      <StarLayer count={5200} radius={650} sizeMin={0.05} sizeMax={0.18} bandBias={0.6} />
      {/* Mid-distance layer, evenly distributed */}
      <StarLayer count={2400} radius={420} sizeMin={0.08} sizeMax={0.45} bandBias={0.2} />
      {/* Rare near "giants" — large bright stars with halos */}
      <StarLayer count={140} radius={280} sizeMin={0.6} sizeMax={1.4} bandBias={0.0} bright />
      <DustParticles count={160} />
    </>
  );
}

// Stellar-class color palette + weights (approx. real Hipparcos distribution,
// biased a little brighter so the sky reads well in HDR/bloom).
const STAR_CLASSES: [number, number, number, number][] = [
  // [r, g, b, weight]
  [0.68, 0.80, 1.00, 0.04],   // O/B  — blue
  [0.84, 0.91, 1.00, 0.10],   // A    — blue-white
  [1.00, 0.98, 0.96, 0.18],   // F    — white
  [1.00, 0.96, 0.86, 0.28],   // G    — yellow (sun-like)
  [1.00, 0.84, 0.66, 0.25],   // K    — orange
  [1.00, 0.70, 0.55, 0.15],   // M    — red
];

function pickStarColor(rand: number): [number, number, number] {
  let acc = 0;
  for (const [r, g, b, w] of STAR_CLASSES) {
    acc += w;
    if (rand <= acc) return [r, g, b];
  }
  return [1, 1, 1];
}

function StarLayer({
  count,
  radius,
  sizeMin,
  sizeMax,
  bandBias = 0,
  bright = false,
}: {
  count: number;
  radius: number;
  sizeMin: number;
  sizeMax: number;
  bandBias?: number;
  bright?: boolean;
}) {
  const ref = useRef<THREE.Points>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  // Galactic plane axis must match the nebula shader's `gAxis`.
  const G_AXIS = useMemo(() => new THREE.Vector3(0.22, 1.0, 0.38).normalize(), []);

  const { positions, colors, sizes, twinkleSeeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const twinkleSeeds = new Float32Array(count);
    const tmp = new THREE.Vector3();

    let i = 0;
    let safety = 0;
    while (i < count && safety < count * 8) {
      safety++;
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const sinPhi = Math.sin(phi);
      tmp.set(sinPhi * Math.cos(theta), sinPhi * Math.sin(theta), Math.cos(phi));

      // Probabilistically reject samples far from the galactic band to bias
      // density toward the Milky Way (only when bandBias > 0).
      if (bandBias > 0) {
        const offAxis = 1 - Math.abs(tmp.dot(G_AXIS)); // 0 on band, 1 at poles
        if (Math.random() < offAxis * bandBias) continue;
      }

      const r = radius * (0.7 + Math.random() * 0.3);
      positions[i * 3] = tmp.x * r;
      positions[i * 3 + 1] = tmp.y * r;
      positions[i * 3 + 2] = tmp.z * r;

      const [cr, cg, cb] = pickStarColor(Math.random());
      // Tiny brightness variation per star
      const b = bright ? 1.0 + Math.random() * 0.4 : 0.55 + Math.random() * 0.5;
      colors[i * 3] = cr * b;
      colors[i * 3 + 1] = cg * b;
      colors[i * 3 + 2] = cb * b;

      // Power-law size distribution — most stars small, occasional larger ones.
      const t = Math.pow(Math.random(), bright ? 1.5 : 3.0);
      sizes[i] = sizeMin + t * (sizeMax - sizeMin);

      twinkleSeeds[i] = Math.random() * 100;
      i++;
    }
    return { positions, colors, sizes, twinkleSeeds };
  }, [count, radius, sizeMin, sizeMax, bandBias, bright, G_AXIS]);

  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.0015;
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aSeed" count={count} array={twinkleSeeds} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        vertexColors
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 }, uBright: { value: bright ? 1.0 : 0.0 } }}
        vertexShader={/* glsl */ `
          attribute float aSize;
          attribute float aSeed;
          varying vec3 vColor;
          varying float vTwinkle;
          varying float vSize;
          uniform float uTime;
          void main(){
            vColor = color;
            // Subtle, slow twinkle — every star desyncs via aSeed
            float t = sin(uTime * 1.1 + aSeed * 6.283) * 0.5 + 0.5;
            vTwinkle = 0.75 + t * 0.35;
            vSize = aSize;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (320.0 / -mv.z) * vTwinkle;
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          varying vec3 vColor;
          varying float vTwinkle;
          varying float vSize;
          uniform float uBright;
          void main(){
            vec2 c = gl_PointCoord - vec2(0.5);
            float d = length(c);
            // Core disc
            float core = smoothstep(0.5, 0.0, d);
            core = pow(core, 2.4);
            // Soft halo (only meaningful for bigger stars / bright layer)
            float halo = smoothstep(0.5, 0.15, d);
            halo = pow(halo, 4.0) * (0.25 + uBright * 0.6);
            // Diffraction cross — scales with star size so tiny stars stay clean
            float crossW = mix(0.05, 0.15, smoothstep(0.2, 1.2, vSize));
            float cx = smoothstep(0.5, 0.0, abs(c.x)) * smoothstep(0.5, 0.5 - crossW, 1.0 - abs(c.y));
            float cy = smoothstep(0.5, 0.0, abs(c.y)) * smoothstep(0.5, 0.5 - crossW, 1.0 - abs(c.x));
            float cross = max(cx, cy) * (0.10 + uBright * 0.35);
            float a = core + halo + cross;
            gl_FragColor = vec4(vColor * vTwinkle, a * vTwinkle);
          }
        `}
      />
    </points>
  );
}

function NebulaShell() {
  return (
    <mesh>
      <sphereGeometry args={[900, 32, 24]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={{}}
        vertexShader={/* glsl */ `
          varying vec3 vPos;
          void main(){
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          varying vec3 vPos;
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
            for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.05+1.7; a*=0.5; }
            return v;
          }

          void main(){
            vec3 dir = normalize(vPos);

            // Galactic plane axis (matches StarLayer.G_AXIS)
            vec3 gAxis = normalize(vec3(0.22, 1.0, 0.38));
            float bandDist = abs(dot(dir, gAxis));        // 0 on band, 1 at poles
            float bandMask = 1.0 - smoothstep(0.0, 0.55, bandDist);

            // Milky Way structure
            float mwClouds = fbm(dir * 4.5 + vec3(5.3));
            float mwDetail = fbm(dir * 11.0 - vec3(2.1));
            float mwGlow = pow(bandMask, 1.7) * (0.45 + 0.55 * mwClouds);

            // Dust lanes — darker streaks along the band
            float dustLanes = pow(bandMask, 3.0) * smoothstep(0.35, 0.75, mwDetail);

            // Faint scattered nebulosities far off the band (very rare/subtle)
            float neb = fbm(dir * 2.2 + vec3(11.0));
            float nebMask = pow(smoothstep(0.62, 0.92, neb), 2.6) * (1.0 - bandMask * 0.6);

            // Hint of warm H-alpha near the band (also subtle)
            float hAlpha = fbm(dir * 3.0 - vec3(7.7));
            float hMask  = pow(smoothstep(0.68, 0.92, hAlpha), 3.0) * bandMask;

            // --- Compose ---
            vec3 col = vec3(0.0035, 0.0045, 0.0090);           // near-black void
            col += vec3(0.022, 0.034, 0.075) * mwGlow;          // cool navy MW glow
            col += vec3(0.045, 0.055, 0.080) * pow(bandMask, 2.5) * mwDetail * 0.45;
            col -= vec3(0.020, 0.024, 0.035) * dustLanes;       // dust darkens
            col += vec3(0.025, 0.030, 0.075) * nebMask * 0.55;  // distant blue nebula
            col += vec3(0.070, 0.030, 0.025) * hMask * 0.40;    // very subtle warm tint
            col = max(col, vec3(0.0028, 0.0036, 0.0072));

            // Slight gamma to deepen blacks
            col = pow(col, vec3(1.18));

            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
}

function DustParticles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 200;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 60;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    return arr;
  }, [count]);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.006;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#7a8aa8"
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
