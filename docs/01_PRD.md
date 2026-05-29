# Phase Shift: RGB - Product Requirement Document

## Objective
A client-side, zero-latency 2D platformer relying on chromatic state-switching for collision detection.

## Core Mechanics
- **Color States**: Red, Green, Blue. Player state toggles via numeric keys (1, 2, 3).
- **Collision Matrix**: Player passes completely through platforms matching their current active color. Collides (stands on / blocked by) non-matching colors.
- **Game Loop**: 60 FPS fixed timestep, deterministic physics integration.

## Performance KPIs
- Zero frame drops on standard browser profiles.
- Zero external API calls. Fully localized execution.
- Zero garbage collection (GC) stutters during active gameplay.