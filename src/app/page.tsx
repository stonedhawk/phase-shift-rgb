import React from 'react';
import { GameCanvas } from '@/components/GameCanvas';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header section with branding */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Animated RGB logo indicator */}
            <div className="flex gap-1">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse delay-100" />
              <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse delay-200" />
            </div>
            <h1 className="text-xl font-bold tracking-wider font-mono bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-emerald-400 to-indigo-400">
              PHASE SHIFT: RGB
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
              v0.1.0-alpha
            </span>
            <span className="text-emerald-400">● Core Scaffold Active</span>
          </div>
        </div>
      </header>

      {/* Main gameplay and dashboard viewport */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-12 flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">
        {/* Game Canvas Container */}
        <div className="w-full lg:w-3/5 flex flex-col gap-4">
          <GameCanvas />
        </div>

        {/* Info & Control Panel */}
        <div className="w-full lg:w-2/5 flex flex-col gap-6">
          <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-3xl backdrop-blur-sm shadow-xl flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold font-mono tracking-wide text-indigo-400 mb-2">
                PROJECT STATUS: ACTIVE
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                You are running the initial high-performance game loop scaffold for 
                <strong className="text-slate-200"> Phase Shift: RGB</strong>. This build exercises the 
                fixed-timestep system clock, input hooks, and canvas mounting lifecycle entirely outside 
                the React fiber rendering tree to prevent garbage collection stutters.
              </p>
            </div>

            {/* Mechanics Overview */}
            <div className="border-t border-slate-800/60 pt-4">
              <h3 className="text-xs font-bold font-mono tracking-widest text-slate-500 uppercase mb-3">
                Core Mechanics (PRD Phase 1)
              </h3>
              <ul className="flex flex-col gap-2.5 text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  <span>
                    <strong className="text-indigo-300">Fixed-Timestep Core:</strong> Runs updates at exactly 60 FPS (16.67ms increments) for absolute deterministic mechanics.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  <span>
                    <strong className="text-indigo-300">Chromatic Matrix:</strong> Switch collision states on-the-fly (Red, Green, Blue) to phase through matching environmental obstacles.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  <span>
                    <strong className="text-indigo-300">DOM Isolation:</strong> The game loops and logic trigger no state changes or virtual DOM reconciliations.
                  </span>
                </li>
              </ul>
            </div>

            {/* Verification Checklist */}
            <div className="border-t border-slate-800/60 pt-4">
              <h3 className="text-xs font-bold font-mono tracking-widest text-slate-500 uppercase mb-3">
                Telemetry & Teleportation
              </h3>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-400 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span>Delta Time Normalization</span>
                  <span className="text-emerald-400">16.6667ms (Stable)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Renderer Loop Type</span>
                  <span className="text-emerald-400">requestAnimationFrame</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Browser Context</span>
                  <span className="text-indigo-400">HTML5 Canvas (2D)</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 border-t border-slate-900 pt-2 text-center leading-normal">
                  Open dev console to audit real-time engine tick payload logging.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 bg-slate-950/50">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs font-mono text-slate-600">
          Phase Shift: RGB | Developed under strict Test-Driven Development (TDD) principles.
        </div>
      </footer>
    </div>
  );
}
