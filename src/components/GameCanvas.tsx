'use client';

import React, { useEffect, useRef } from 'react';
import { GameEngine } from '@/core/GameEngine';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fixed canvas size for retro resolution (800x600, 4:3 ratio)
    canvas.width = 800;
    canvas.height = 600;

    // Initialize the GameEngine
    const engine = new GameEngine({ canvas });
    engineRef.current = engine;
    engine.start();

    // Cleanup on component unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md">
      <div className="relative group overflow-hidden rounded-2xl border-4 border-slate-950 shadow-inner">
        <canvas
          ref={canvasRef}
          className="block w-full max-w-[800px] aspect-[4/3] bg-slate-950 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
        />
        {/* Dynamic Scanline overlay for arcade visual aesthetic */}
        <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.03] mix-blend-overlay" />
      </div>
      <div className="mt-4 flex items-center justify-between w-full max-w-[800px] px-2 text-xs font-mono text-slate-500">
        <div>Resolution: 800x600 (Arcade Grid)</div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Loop Status: Active (60 FPS Fixed)
        </div>
      </div>
    </div>
  );
};
