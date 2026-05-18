# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server (default port 3000).
- `npm run build` — production build. Use this to typecheck; there is no separate `tsc` script and `tsconfig.json` has `noEmit`. Type errors fail the build.
- `npm start` — serve the production build.
- `npm run lint` — Next.js ESLint.

There is no test runner configured.

## Architecture

Single-page Next.js 14 App Router app that renders an interactive 3D solar system. There is exactly one route (`app/page.tsx`), and it dynamically imports `components/Experience.tsx` with `ssr: false` because the entire experience is WebGL/three.js and depends on browser APIs.

### The three layers

`Experience.tsx` mounts three overlapping layers that all read from the same Zustand store:

1. **R3F Canvas** (`@react-three/fiber`) — the 3D scene: `Background` (procedural nebula sphere + two star fields + dust particles), `Sun`, `Orbits`, one `Planet` per entry in `ORBITING`, then `OrbitControls`, `CameraRig`, and `Effects` (post-processing chain).
2. **UI overlays** (`components/ui/*`) — React DOM rendered on top of the canvas: `Intro`, `TopBar`, `PlanetDock`, `PlanetPanel`, `BottomControls`, `HintBar`, `CompareView`, `TimelineView`, plus the `Ambience` web-audio component.
3. **Zustand store** (`lib/store.ts`) — the only cross-component state. Both the 3D scene and the DOM UI read/write the same store, which is what keeps them in sync (e.g., clicking a `Planet` mesh → `setSelected(id)` → `PlanetPanel` slides in and `CameraRig` flies the camera).

### Camera system

`CameraRig.tsx` is the non-obvious piece. It runs every frame and does three things:

- When `selectedId` changes, it captures the current camera/target as `fromPos`/`fromTarget` and computes a tentative end point, then cubic-eases between them over ~1.8s.
- During the transition it **looks up the live planet position** each frame via `scene.getObjectByName('planet-${id}')` (every `Planet` group is named with this convention). This is what makes the camera track a moving target instead of flying to a stale position.
- After the transition ends, it keeps lerping the target toward the planet so the camera follows orbital motion while still letting the user freely orbit with `OrbitControls`.

Auto-tour: when `tourMode` is true, the rig immediately jumps to `PLANETS[0]` and advances every ~2.2s of idle time.

### View state and overlay layering

The top nav has four modes (`view`: `'explore' | 'compare' | 'timeline'` + the `tourMode` flag). When `view !== 'explore'`:

- `PlanetDock` early-returns `null`.
- Each `Planet`'s drei `<Html>` label is gated off.

This matters because drei's `<Html>` portals into the DOM and would otherwise bleed through the Compare/Timeline overlays. Those overlays live at `z-[60]`; the rest of the UI is `z-30`.

### Procedural shaders, no textures

All celestial surfaces are written as inline GLSL shader materials in their component files. There are no texture assets — surfaces, atmospheres, rings, the sun's plasma, nebula background, and twinkling stars are all generated from noise functions in the shaders.

- `Sun.tsx` — simplex-noise plasma with two additive glow shells and two point lights (the primary scene lighting).
- `Planet.tsx` — fbm-noise surface that branches on `uType` (rocky / gas-banded / ice) and Lambert-lights against `uSunDir`, which is recomputed each frame as the vector from the planet to the origin.
- `Background.tsx` — fbm nebula on a back-side sphere; star fields are `THREE.Points` with a custom vertex/fragment shader for twinkle and cross-flare.

If you add a new planet, append it to `PLANETS` in `lib/planets.ts`; the scene picks it up automatically because `Experience` maps over `ORBITING` (everything after the Sun).

### Framer Motion easing

Framer Motion v12 is strict about `ease` array typing. Use the shared `EASE` / `EASE_OUT` tuples from `lib/motion.ts` — passing a raw `[0.2, 0.8, 0.2, 1]` literal will fail typecheck.

### Path aliases

`@/*` maps to the repo root (see `tsconfig.json`), so imports look like `@/lib/store` and `@/components/three/Planet`.
