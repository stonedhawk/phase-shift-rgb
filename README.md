# Phase Shift: RGB

A sleek, high-performance, dark-themed retro browser arcade built with **Next.js 16 (App Router)** and **Tailwind CSS**. 

This portfolio project showcases advanced game engineering principles in modern client environments, specifically demonstrating **zero-garbage-collection** active frames and pure programmatic **Web Audio API** procedural sound synthesis.

---

## 🚀 Key Highlights & Architectural Tenets

- **Zero Garbage Collection Gameplay**: All visual feedback particles (bursts, hazard trails) utilize a strictly sized pre-allocated **Object Pool** of exactly 200 particle instances. Bypasses heap allocations during game ticks to prevent frame-rate stutters.
- **Procedural Sound Synthesis**: Features custom low-pass and high-pass oscillator wave synthesizers built on browser-native `AudioContext`. Zero heavyweight `.wav`/`.mp3` assets are loaded, keeping the repository 100% zero-dependency.
- **Euler Split-Axis Physics**: Features custom AABB math calculations. Horizontally and vertically isolated collision sweeps completely prevent edge-snagging on tiled platforms.
- **Decoupled Engine Loop**: Runs gameplay logic ticks at a fixed 60 FPS clock (`16.67ms` steps) using a requestAnimationFrame accumulator, decoupled from React's fiber rendering cycle to secure massive CPU load gains.
- **Lerp scrolling Camera**: Smoothly tracks the player viewport inside map bounds, employing integer floor translations to eliminate sub-pixel rendering blur.

---

## 🛠️ Tech Stack & Structure

- **Core**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Vanilla CSS
- **Testing**: Jest (JSDOM Environment), ts-jest
- **Scaffolding**: Standard pure JavaScript/TypeScript engine modules decoupled from the browser DOM.

---

## ⚙️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to experience the retro-arcade dashboard!

### 3. Run the Test Suite (Jest TDD)
```bash
npm run test
```
Runs 51 comprehensive assertions covering physics matrices, AABB collisions, input events, stage managers, camera lerps, and object pool recycling.

### 4. Build for Production
```bash
npm run build
```
Generates a static-page optimized distribution fully pre-packaged for Vercel deployment.

---

## 📖 Architectural Manual
For an in-depth look at class schemas, coordinate matrices, and system pipelines, explore the [docs/README.md](file:///Users/rahul.shah/Documents/Antigravity/Phase_Shift_RGB_Docs/docs/README.md) directory.
