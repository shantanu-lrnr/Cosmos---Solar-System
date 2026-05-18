'use client';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise, SMAA } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { Vector2 } from 'three';

export default function Effects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={1.05}
        luminanceThreshold={0.18}
        luminanceSmoothing={0.6}
        mipmapBlur
        kernelSize={KernelSize.LARGE}
      />
      <ChromaticAberration
        offset={new Vector2(0.0006, 0.0009)}
        radialModulation={true}
        modulationOffset={0.5}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette eskil={false} offset={0.18} darkness={0.85} />
      <Noise opacity={0.025} blendFunction={BlendFunction.OVERLAY} />
      <SMAA />
    </EffectComposer>
  );
}
