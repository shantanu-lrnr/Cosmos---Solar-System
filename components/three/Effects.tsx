'use client';
import { EffectComposer, Bloom, Vignette, Noise, SMAA } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';

// Cinematic post-processing tuned for realistic deep-space.
//  - Bloom: low threshold + large kernel so the sun and bright stars halo softly,
//    without painting the whole frame in glow.
//  - Vignette: a deeper falloff for that "looking through a lens" feel.
//  - Noise: minimal film grain to soften shader banding in dark areas.
//  - SMAA: clean edges for points and orbit lines.
//  - Chromatic aberration removed — it reads as stylized, not photographic.

export default function Effects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={0.85}
        luminanceThreshold={0.62}
        luminanceSmoothing={0.32}
        mipmapBlur
        kernelSize={KernelSize.MEDIUM}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.92} />
      <Noise opacity={0.022} blendFunction={BlendFunction.OVERLAY} />
      <SMAA />
    </EffectComposer>
  );
}
