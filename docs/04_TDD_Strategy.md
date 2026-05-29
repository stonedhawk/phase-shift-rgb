# Test-Driven Development (TDD) Strategy

## Philosophy
Test the math, not the pixels. Canvas rendering is volatile for unit tests. Isolate game logic entirely from the DOM.

## Core Test Suites
1. **AABB Math**: Test overlapping bounds, edge cases, and high-velocity tunneling scenarios.
2. **Chromatic Matrix**: 
    - Assert: `Player(Red) + Platform(Red) = false` (No collision).
    - Assert: `Player(Red) + Platform(Blue) = true` (Collision).
3. **Physics Integrator**: Assert deterministic X/Y coordinate outputs given constant velocity and gravity over *n* ticks.

## Execution
- Use Jest for pure JS logic.
- Mock the browser `window` or DOM entirely during the logic testing phase.