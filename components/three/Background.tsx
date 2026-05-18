'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural star field (points) + distant nebula color sphere

export default function Background() {
  return (
    <>
      <NebulaShell />
      <StarField count={4000} radius={300} sizeMin={0.05} sizeMax={0.35} />
      <StarField count={1200} radius={520} sizeMin={0.04} sizeMax={0.2} hueShift={0.5} />
      <DustParticles count={300} />
    </>
  );
}

function StarField({
  count,
  radius,
  sizeMin,
  sizeMax,
  hueShift = 0,
}: { count: number; radius: number; sizeMin: number; sizeMax: number; hueShift?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Distribute on sphere with bias toward outer shell
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = radius * (0.6 + Math.random() * 0.4);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const h = (0.55 + hueShift + (Math.random() - 0.5) * 0.15) % 1;
      const s = 0.1 + Math.random() * 0.6;
      const l = 0.55 + Math.random() * 0.45;
      color.setHSL(h, s, l);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      sizes[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
    }
    return { positions, colors, sizes };
  }, [count, radius, sizeMin, sizeMax, hueShift]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.0025;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        vertexColors
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={/* glsl */`
          attribute float aSize;
          varying vec3 vColor;
          varying float vTwinkle;
          uniform float uTime;
          void main(){
            vColor = color;
            float t = sin(uTime * 1.4 + position.x * 0.5 + position.y * 0.3) * 0.5 + 0.5;
            vTwinkle = 0.6 + t * 0.6;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (300.0 / -mv.z) * vTwinkle;
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */`
          varying vec3 vColor;
          varying float vTwinkle;
          void main(){
            vec2 c = gl_PointCoord - vec2(0.5);
            float d = length(c);
            float a = smoothstep(0.5, 0.0, d);
            a = pow(a, 2.0);
            // small cross flare
            float cross = max(
              smoothstep(0.5, 0.0, abs(c.x)) * smoothstep(0.5, 0.4, abs(c.y)),
              smoothstep(0.5, 0.0, abs(c.y)) * smoothstep(0.5, 0.4, abs(c.x))
            ) * 0.3;
            gl_FragColor = vec4(vColor * vTwinkle, (a + cross) * vTwinkle);
          }
        `}
      />
    </points>
  );
}

function NebulaShell() {
  return (
    <mesh>
      <sphereGeometry args={[800, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={{}}
        vertexShader={/* glsl */`
          varying vec3 vPos;
          void main(){
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */`
          varying vec3 vPos;
          float hash(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
          float noise(vec3 x){
            vec3 p=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
            return mix(mix(mix(hash(p+vec3(0,0,0)),hash(p+vec3(1,0,0)),f.x),
                           mix(hash(p+vec3(0,1,0)),hash(p+vec3(1,1,0)),f.x),f.y),
                       mix(mix(hash(p+vec3(0,0,1)),hash(p+vec3(1,0,1)),f.x),
                           mix(hash(p+vec3(0,1,1)),hash(p+vec3(1,1,1)),f.x),f.y),f.z);
          }
          float fbm(vec3 p){ float v=0.0; float a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.05; a*=0.5; } return v; }
          void main(){
            vec3 dir = normalize(vPos);
            float n1 = fbm(dir * 2.0);
            float n2 = fbm(dir * 4.0 + 7.0);
            float n3 = fbm(dir * 1.0 - 3.0);
            vec3 col1 = vec3(0.06, 0.05, 0.18) * (n1 * 1.6);   // deep blue
            vec3 col2 = vec3(0.35, 0.10, 0.45) * (n2 * 0.6);   // magenta
            vec3 col3 = vec3(0.05, 0.18, 0.35) * (n3 * 0.8);   // cyan
            vec3 c = col1 + col2 + col3;
            c = pow(c, vec3(1.3));
            // base near black
            c += vec3(0.005, 0.006, 0.015);
            gl_FragColor = vec4(c, 1.0);
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
      arr[i * 3] = (Math.random() - 0.5) * 180;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 50;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 180;
    }
    return arr;
  }, [count]);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.01;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color="#9bb4ff" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
