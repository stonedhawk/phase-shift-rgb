import React from 'react';
import { GameCanvas } from '@/components/GameCanvas';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header section with premium neon styling */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Animated RGB logo indicator */}
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
            </div>
            <h1 className="text-xl font-bold tracking-wider font-mono bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-emerald-400 to-blue-400">
              PHASE SHIFT: RGB
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
              v1.0.0-Release
            </span>
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Production Active
            </span>
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
        <div className="w-full lg:w-2/5 flex flex-col gap-6 animate-fade-in">
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-sm shadow-xl flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold font-mono tracking-wide text-indigo-400 mb-2">
                RELEASE PORTFOLIO CONTEXT
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed font-mono">
                Welcome to <strong className="text-slate-200">Phase Shift: RGB</strong>. This custom browser arcade is engineered with a strict <strong className="text-slate-300">zero-garbage-collection</strong> performance envelope. 
              </p>
            </div>

            {/* Mechanics Overview */}
            <div className="border-t border-slate-800/60 pt-4 flex flex-col gap-4">
              <h3 className="text-xs font-bold font-mono tracking-widest text-slate-500 uppercase">
                Active System Architecture
              </h3>
              
              <div className="flex flex-col gap-3.5 text-xs text-slate-300 font-mono">
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-200">Web Audio API Synth:</strong> Procedural synthesis triggers sine sweeps & sawtooth death crashes directly using the Web Audio API with zero external file loads.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-200">Particle Pooling:</strong> Pre-allocates exactly 200 particle references, recycling dormant objects without heap allocation stutters.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-200">Decoupled Physics:</strong> Employs a 60 FPS fixed-timestep Euler integration engine with split-axis collision handling.
                  </span>
                </div>
              </div>
            </div>

            {/* Keyboard Controls Mappings */}
            <div className="border-t border-slate-800/60 pt-4">
              <h3 className="text-xs font-bold font-mono tracking-widest text-slate-500 uppercase mb-4">
                CONTROLLERS & KEYBOARD MAPS
              </h3>
              
              <div className="flex flex-col gap-3 font-mono text-xs text-slate-400">
                {/* Move Left/Right */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/30">
                  <span className="text-slate-400">Move Left / Right</span>
                  <div className="flex gap-1.5 items-center">
                    <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-200 shadow-sm">◀</kbd>
                    <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-200 shadow-sm">▶</kbd>
                    <span className="text-slate-600">or</span>
                    <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-200 shadow-sm">A</kbd>
                    <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-200 shadow-sm">D</kbd>
                  </div>
                </div>

                {/* Jump */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/30">
                  <span className="text-slate-400">Jump / Jump Cut</span>
                  <div className="flex gap-1.5 items-center">
                    <kbd className="px-4 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-200 shadow-sm">SPACE</kbd>
                    <span className="text-slate-600">or</span>
                    <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-200 shadow-sm">▲</kbd>
                    <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-200 shadow-sm">W</kbd>
                  </div>
                </div>

                {/* Phase Colors */}
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400">Shift Chromatic States</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 rounded bg-slate-950 border border-rose-950 text-[10px] font-bold text-rose-400 shadow-sm shadow-rose-950/20">1</kbd>
                    <kbd className="px-2 py-1 rounded bg-slate-950 border border-emerald-950 text-[10px] font-bold text-emerald-400 shadow-sm shadow-emerald-950/20">2</kbd>
                    <kbd className="px-2 py-1 rounded bg-slate-950 border border-blue-950 text-[10px] font-bold text-blue-400 shadow-sm shadow-blue-950/20">3</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 bg-slate-950/50">
        <div className="max-w-6xl mx-auto px-6 text-center text-[10px] font-mono text-slate-600">
          Phase Shift: RGB | Built under strict Test-Driven Development (TDD) principles with Next.js Turbopack.
        </div>
      </footer>
    </div>
  );
}
