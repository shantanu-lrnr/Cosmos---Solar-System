'use client';
import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/lib/store';
import type { Planet as PlanetData } from '@/lib/planets';

const earthVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const earthFrag = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform sampler2D uSpecular;
  uniform sampler2D uNormalMap;
  uniform vec3 uSunDir;
  uniform float uNormalScale;

  // Saturation boost — pushes Blue Marble blues and greens into photographic range
  vec3 saturate3(vec3 c, float s) {
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    return mix(vec3(lum), c, s);
  }

  void main() {
    vec3 day = texture2D(uDay, vUv).rgb;
    vec3 night = texture2D(uNight, vUv).rgb;
    float specMask = texture2D(uSpecular, vUv).r;

    // Punch up the day-side palette: deeper oceans, richer continents
    day = saturate3(day, 1.18);

    // Analytical tangent space for a sphere (T = east, B = north)
    vec3 Nw = normalize(vWorldNormal);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 T = normalize(cross(up, Nw) + vec3(0.0001, 0.0, 0.0));
    vec3 B = cross(Nw, T);
    mat3 TBN = mat3(T, B, Nw);
    vec3 sampledN = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
    sampledN.xy *= uNormalScale;
    vec3 N = normalize(TBN * sampledN);

    float NdotL = dot(N, uSunDir);
    float NwdotL = dot(Nw, uSunDir);
    // Soft, photographic terminator — slightly wider than a hard cutoff
    float dayMix = smoothstep(-0.08, 0.22, NwdotL);

    // Subtle specular sun glint on water
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 H = normalize(uSunDir + V);
    float specPow = pow(max(dot(N, H), 0.0), 130.0) * specMask;
    vec3 specular = vec3(1.00, 0.96, 0.85) * specPow * max(NwdotL, 0.0) * 0.30;

    // Day side: low ambient + Lambert (normal-mapped) + sun glint
    vec3 daySide = day * (0.05 + max(NdotL, 0.0) * 0.95) + specular;

    // Night side: warm city lights with a faint hint of base albedo
    vec3 nightSide = night * 1.15 + day * 0.010;

    vec3 col = mix(nightSide, daySide, dayMix);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const cloudVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cloudFrag = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  uniform sampler2D uClouds;
  uniform vec3 uSunDir;
  void main() {
    vec4 ct = texture2D(uClouds, vUv);
    // Cloud density: prefer alpha (PNG-with-mask), fall back to RGB luminance
    // for opaque cloud images. Many cloud PNGs have white RGB everywhere with
    // alpha as the actual cloud mask, so alpha-first is the right default.
    float cAlpha = ct.a;
    float cLum = dot(ct.rgb, vec3(0.299, 0.587, 0.114));
    float c = (cAlpha < 0.999) ? cAlpha : cLum;

    vec3 Nw = normalize(vWorldNormal);
    float NdotL = max(dot(Nw, uSunDir), 0.0);
    float lit = 0.12 + 0.88 * smoothstep(-0.05, 0.30, NdotL);
    vec3 col = vec3(1.0) * lit;
    // Subtle cool tint on the shadow side of clouds
    col = mix(col * vec3(0.62, 0.70, 0.90), col, smoothstep(0.10, 0.50, NdotL));

    // More confident opacity so clouds read clearly against bright oceans
    float a = c * (0.80 + 0.20 * smoothstep(-0.10, 0.35, NdotL));
    if (a < 0.02) discard;
    gl_FragColor = vec4(col, a);
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

const atmoFrag = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  uniform vec3 uSunDir;
  uniform vec3 uColor;
  void main() {
    float fres = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
    float NdotL = max(dot(normalize(vWorldNormal), uSunDir), 0.0);
    // Thin halo — visible on the lit limb, faint on the dark limb, never washes the scene
    float intensity = fres * (0.06 + NdotL * 0.30);
    float term = smoothstep(0.0, 0.20, NdotL) * (1.0 - smoothstep(0.20, 0.50, NdotL));
    vec3 c = mix(uColor, vec3(1.00, 0.55, 0.25), term * 0.30);
    gl_FragColor = vec4(c, intensity);
  }
`;

type Props = {
  planet: PlanetData;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
};

const DAY = '/textures/earth/2k_earth_daymap.jpg';
const NIGHT = '/textures/earth/2k_earth_nightmap.jpg';
const CLOUDS = '/textures/earth/fair_clouds_4k.png';
const SPECULAR = '/textures/earth/earth_specular_2048.jpg';
const NORMAL = '/textures/earth/earth_normal_2048.jpg';

export default function EarthBody({ planet, onPointerOver, onPointerOut, onClick }: Props) {
  const surfaceRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);
  const surfaceMatRef = useRef<THREE.ShaderMaterial>(null!);
  const cloudMatRef = useRef<THREE.ShaderMaterial>(null!);
  const atmoMatRef = useRef<THREE.ShaderMaterial>(null!);

  const timeScale = useStore(s => s.timeScale);

  const [dayMap, nightMap, cloudMap, specMap, normalMap] = useTexture([
    DAY, NIGHT, CLOUDS, SPECULAR, NORMAL,
  ]);

  useLayoutEffect(() => {
    const maxAniso = 16;
    const all = [dayMap, nightMap, cloudMap, specMap, normalMap];
    all.forEach(t => {
      if (!t) return;
      t.anisotropy = maxAniso;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.needsUpdate = true;
    });
    // We sRGB→linear decode manually inside the surface shader, so all textures
    // are sampled raw — keep colorSpace as NoColorSpace to disable any auto-decode
    all.forEach(t => { if (t) t.colorSpace = THREE.NoColorSpace; });
  }, [dayMap, nightMap, cloudMap, specMap, normalMap]);

  const surfaceUniforms = useMemo(() => ({
    uDay: { value: dayMap },
    uNight: { value: nightMap },
    uSpecular: { value: specMap },
    uNormalMap: { value: normalMap },
    uSunDir: { value: new THREE.Vector3(1, 0, 0) },
    uNormalScale: { value: 0.85 },
  }), [dayMap, nightMap, specMap, normalMap]);

  const cloudUniforms = useMemo(() => ({
    uClouds: { value: cloudMap },
    uSunDir: { value: new THREE.Vector3(1, 0, 0) },
  }), [cloudMap]);

  const atmoUniforms = useMemo(() => ({
    uSunDir: { value: new THREE.Vector3(1, 0, 0) },
    uColor: { value: new THREE.Color(planet.atmosphere?.color ?? '#7cb6ff') },
  }), [planet]);

  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const sunDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((_state, delta) => {
    // Surface + clouds rotate at slightly different rates for parallax
    if (surfaceRef.current) {
      surfaceRef.current.rotation.y += delta * planet.rotationSpeed * 6.0 * timeScale;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * planet.rotationSpeed * 6.8 * timeScale;
    }

    // Sun is at the world origin; direction from planet center to sun
    if (surfaceRef.current) {
      surfaceRef.current.getWorldPosition(worldPos);
      sunDir.copy(worldPos).multiplyScalar(-1).normalize();
    }

    if (surfaceMatRef.current) surfaceMatRef.current.uniforms.uSunDir.value.copy(sunDir);
    if (cloudMatRef.current) cloudMatRef.current.uniforms.uSunDir.value.copy(sunDir);
    if (atmoMatRef.current) atmoMatRef.current.uniforms.uSunDir.value.copy(sunDir);
  });

  return (
    <>
      {/* Surface — day/night blend, specular water, normal-mapped relief */}
      <mesh
        ref={surfaceRef}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <sphereGeometry args={[planet.radius, 96, 96]} />
        <shaderMaterial
          ref={surfaceMatRef}
          vertexShader={earthVert}
          fragmentShader={earthFrag}
          uniforms={surfaceUniforms}
        />
      </mesh>

      {/* Cloud shell — slightly above the surface, rotates faster */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[planet.radius * 1.012, 80, 80]} />
        <shaderMaterial
          ref={cloudMatRef}
          transparent
          depthWrite={false}
          vertexShader={cloudVert}
          fragmentShader={cloudFrag}
          uniforms={cloudUniforms}
        />
      </mesh>

      {/* Atmosphere — back-side Fresnel halo with terminator warmth */}
      <mesh scale={1.045}>
        <sphereGeometry args={[planet.radius, 48, 48]} />
        <shaderMaterial
          ref={atmoMatRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          vertexShader={atmoVert}
          fragmentShader={atmoFrag}
          uniforms={atmoUniforms}
        />
      </mesh>
    </>
  );
}
