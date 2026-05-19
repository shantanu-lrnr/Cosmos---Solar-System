'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/lib/store';
import { SUN } from '@/lib/planets';

const sunVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const sunFrag = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  // Smooth noise
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);
    const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;
    vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
    m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main() {
    vec3 p = normalize(vPos);
    float n = snoise(p * 2.5 + vec3(uTime * 0.06));
    float n2 = snoise(p * 6.0 + vec3(uTime * 0.12));
    float h = n * 0.65 + n2 * 0.35;
    h = smoothstep(-0.4, 0.9, h);
    vec3 col = mix(uColorB, uColorA, h);
    // hot bright spots
    col += vec3(1.0, 0.7, 0.3) * pow(h, 5.0) * 0.6;
    // limb darkening / brightening
    float fres = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 1.5);
    col += vec3(1.0, 0.55, 0.18) * fres * 0.7;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function Sun() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color(SUN.color.primary) },
    uColorB: { value: new THREE.Color(SUN.color.secondary) },
  }), []);

  const setHovered = useStore(s => s.setHovered);
  const setSelected = useStore(s => s.setSelected);

  useFrame((state, delta) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.05;
    if (glowRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.012;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      {/* Core */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered('sun'); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(null); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); setSelected('sun'); }}
      >
        <sphereGeometry args={[SUN.radius, 64, 64]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={sunVert}
          fragmentShader={sunFrag}
          uniforms={uniforms}
        />
      </mesh>

      {/* Light source */}
      <pointLight position={[0, 0, 0]} intensity={3.5} distance={400} decay={1.4} color="#ffd5a0" />
      <pointLight position={[0, 0, 0]} intensity={1.6} distance={120} decay={2} color="#ffe6b3" />

      {/* Soft glow shell */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[SUN.radius * 1.35, 40, 40]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{ uColor: { value: new THREE.Color(SUN.color.glow) } }}
          vertexShader={/* glsl */`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={/* glsl */`
            varying vec3 vNormal;
            uniform vec3 uColor;
            void main() {
              float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
              gl_FragColor = vec4(uColor, 1.0) * intensity;
            }
          `}
        />
      </mesh>

      {/* Outer corona */}
      <mesh>
        <sphereGeometry args={[SUN.radius * 2.4, 32, 32]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{ uColor: { value: new THREE.Color('#ff8a3d') } }}
          vertexShader={/* glsl */`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={/* glsl */`
            varying vec3 vNormal;
            uniform vec3 uColor;
            void main() {
              float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
              gl_FragColor = vec4(uColor, 1.0) * intensity * 0.6;
            }
          `}
        />
      </mesh>
    </group>
  );
}
