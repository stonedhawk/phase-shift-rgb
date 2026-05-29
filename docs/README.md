# Phase Shift: RGB - Core Architecture Manual

This document details the high-fidelity pure-JavaScript/TypeScript modular architecture driving **Phase Shift: RGB**, built to demonstrate maximum performance in modern browser environments under a strict **zero-garbage-collection** gameplay runtime constraint.

---

## 1. High-Performance Core Architectural Layout

The gameplay core is completely decoupled from the DOM and React's fiber rendering engine. This prevents React component state sweeps or virtual DOM reconciliations from dropping frames during fast-paced movement.

```
+-------------------------------------------------------------+
|               React: GameCanvas Client Wrapper               |
|  - Mounts HTML5 <canvas> & triggers Engine.start()          |
|  - Periodic low-frequency (500ms) telemetry metrics pulling |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     GameEngine Pipeline                     |
|  - Target FPS: 60 (Fixed-timestep: 16.67ms per tick)       |
|  - Input Capture, Physics update, & Particle ticking        |
+------------------------------+------------------------------+
                               |
                               +---> [InputManager] -- Captures binary keyboard states
                               |
                               +---> [Player Entity] - Mutates position, Euler velocity
                               |
                               +---> [Physics Engine] - Resolves horizontal & vertical AABB
                               |
                               +---> [ParticlePool] -- Pre-allocated GC-free visual bursts
                               |
                               +---> [SoundManager] -- Programmatic procedural Web Audio synth
                               |
                               +---> [Camera System] - Lerp follows player with bounds clamping
                               |
                               v
+-------------------------------------------------------------+
|                      Renderer Pipeline                      |
|  - Decoupled render frame interpolation                    |
|  - Coordinate rounding to prevent sub-pixel canvas blur     |
+-------------------------------------------------------------+
```

- **`src/components/GameCanvas.tsx`**: A client-side React wrapper that mounts the `<canvas>` element and initializes `GameEngine`. Telemetry stats (FPS, particles, coordinates) are pulled at a low-frequency `500ms` interval to avoid gameplay fiber reconciliation.
- **`src/core/GameEngine.ts`**: The central system orchestrator. Maintains a fixed-timestep game clock (`16.67ms` ticks) consuming delta accumulators and managing general transitions (`START`, `PLAYING`, `DEAD`, `VICTORY`).

---

## 2. Dynamic Systems Detail

### 2.1. Zero-Allocation Particle Object Pool (`ParticlePool.ts`)
To prevent Garbage Collection (GC) sweeps from causing micro-stuttering during active play, we pre-allocate exactly **200 particle object references** upon engine startup.
- **Emission**: Iterates through the pre-allocated array, locating inactive objects to flag active, set radial explosion velocities (`cos`/`sin` math), assign color hashes, and establish custom decay lifespans (250ms - 750ms).
- **Updating**: Runs standard Euler velocity increments and automatically resets `active = false` when life reaches zero.

### 2.2. Zero-Dependency Procedural Synth (`SoundManager.ts`)
Avoids loading heavyweight external `.wav`/`.mp3` assets, ensuring a lightweight and completely self-contained footprint.
- **Sine Sweeps (Color Shifts)**: Maps standard chromatic state keys to oscillator notes (Red = 160Hz, Green = 320Hz, Blue = 480Hz) and triggers exponential linear ramp upshifts for game-feel ("juice").
- **Sawtooth Alarms (Deaths)**: Triggers a descending frequency sweep mimicking a crash alert.
- **Security Bypasses**: Exposes a safe gesture initialization handler called during portfolio button interactions to unblock standard browser audio permission policies.

### 2.3. Split-Axis Physics Solver (`Physics.ts`)
A single-pass AABB overlap resolution causes corner-snagging on tiled grid platforms. To prevent this, our solver isolates horizontal and vertical movement sweeps:
1. **Horizontal Phase**: Apply X velocities -> Evaluate all platform overlaps -> Resolve X coordinates and flush X velocities.
2. **Vertical Phase**: Apply Y velocities -> Evaluate all platform overlaps -> Resolve Y coordinates and flag grounding status.

### 2.4. Viewport Translation Camera (`Camera.ts` & `Renderer.ts`)
Tracks the player using a smooth linear interpolation (Lerp) algorithm and clamps viewport margins to the active level bounds. Drawing coordinates are converted into integers (`Math.floor`) before context translation to avoid sub-pixel canvas blurring.
