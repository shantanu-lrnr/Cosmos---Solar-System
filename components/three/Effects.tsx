'use client';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise, SMAA } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { Vector2 } from 'three';

export default function Effects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={0.45}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.4}
        mipmapBlur
        kernelSize={KernelSize.MEDIUM}
      />
      <ChromaticAberration
        offset={new Vector2(0.0003, 0.0005)}
        radialModulation={true}
        modulationOffset={0.5}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette eskil={false} offset={0.20} darkness={0.75} />
      <Noise opacity={0.015} blendFunction={BlendFunction.OVERLAY} />
      <SMAA />
    </EffectComposer>
  );
}
