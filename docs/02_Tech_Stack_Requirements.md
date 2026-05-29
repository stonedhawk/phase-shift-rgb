# Tech Stack & Technical Requirements

## Stack
- **Core Engine**: Vanilla JS / HTML5 Canvas API (Context2D).
- **Wrapper**: React / Next.js (for portfolio integration and UI overlays only).
- **State Management**: Data-Oriented Entity Component System (ECS) or strict object state machine.
- **Testing**: Jest.

## Technical Requirements
- **React Isolation**: Game state MUST mutate outside the React lifecycle. Do not use `useState` or `useEffect` for frame-by-frame updates.
- **Input Handling**: Prevent default browser behaviors on spacebar/arrow keys to stop window scrolling.
- **Memory Management**: Implement Object Pooling for particles, projectiles, and transient state to prevent GC spikes.