# Implementation Plan

## Phase 1: Engine Scaffold
- Initialize Next.js project.
- Create a generic `<GameCanvas />` component using `useRef`.
- Implement a fixed-timestep game loop (`requestAnimationFrame` with delta time normalization).

## Phase 2: Physics & Math
- Implement pure AABB (Axis-Aligned Bounding Box) collision detection.
- Implement the Chromatic Collision Matrix.

## Phase 3: Player Controller
- Velocity, gravity, jump impulse, and terminal velocity constraints.
- State toggle logic (RGB switching).

## Phase 4: Level Parsing & Rendering
- JSON-based tilemap rendering.
- Canvas draw calls optimization.