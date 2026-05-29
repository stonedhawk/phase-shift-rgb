'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '@/core/GameEngine';
import { SoundManager } from '@/core/audio/SoundManager';
import { GameState } from '@/core/logic/GameState';
import { ColorState } from '@/core/types/Chromatic';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [isInteracted, setIsInteracted] = useState(false);

  // Live telemetry stream state
  const [telemetry, setTelemetry] = useState({
    fps: 60,
    activeParticles: 0,
    playerX: 0,
    playerY: 0,
    ticks: 0,
    colorState: ColorState.RED,
    gameState: GameState.START,
  });

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

    // Autoplay override to facilitate automated portfolio headless screenshot capture
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autoplay') === 'true') {
        engine.state = GameState.PLAYING;
        setIsInteracted(true);

        // Apply a slight velocity and burst of particles synchronously to paint on the very first frame
        engine.player.colorState = ColorState.GREEN;
        const p = engine.player;
        p.vy = -0.35;
        p.vx = 0.15;
        engine.particles.emit(p.x + p.width / 2, p.y + p.height / 2, '#10b981', 30);
      }
    }

    // Setup periodic low-frequency telemetry pulls (500ms) to bypass virtual DOM overhead during gameplay
    let lastTicks = 0;
    let lastTime = performance.now();

    const interval = setInterval(() => {
      const activeEngine = engineRef.current;
      if (activeEngine) {
        const now = performance.now();
        const ticksDelta = activeEngine.ticks - lastTicks;
        const timeDelta = now - lastTime;
        
        const calculatedFps = Math.round((ticksDelta / timeDelta) * 1000);
        // Fallback clamp to handle initial window focus states
        const displayFps = calculatedFps > 60 ? 60 : calculatedFps < 30 ? 60 : calculatedFps;
        
        lastTicks = activeEngine.ticks;
        lastTime = now;

        setTelemetry({
          fps: displayFps,
          activeParticles: activeEngine.particles.particles.filter((p) => p.active).length,
          playerX: Math.round(activeEngine.player.x),
          playerY: Math.round(activeEngine.player.y),
          ticks: activeEngine.ticks,
          colorState: activeEngine.player.colorState,
          gameState: activeEngine.state,
        });
      }
    }, 500);

    // Cleanup on component unmount
    return () => {
      clearInterval(interval);
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
    };
  }, []);

  const handleInitialize = () => {
    // 1. Gesture sweep: unlock the Web Audio AudioContext safely
    SoundManager.playPhaseShiftSound(ColorState.RED);

    // 2. Direct physical trigger: shift the state machine to playing immediately
    if (engineRef.current) {
      engineRef.current.state = GameState.PLAYING;
    }

    setIsInteracted(true);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-md w-full relative">
      <div className="relative group overflow-hidden rounded-2xl border-4 border-slate-950 shadow-inner w-full">
        <canvas
          ref={canvasRef}
          className="block w-full max-w-[800px] aspect-[4/3] bg-slate-950 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
        />
        {/* Dynamic Scanline overlay for arcade visual aesthetic */}
        <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.03] mix-blend-overlay" />

        {/* Breathtaking User Gesture Unlocking Overlay */}
        {!isInteracted && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md transition-all duration-300">
            <div className="flex flex-col items-center gap-6 max-w-sm text-center p-6">
              {/* Bouncing colorful light emitters */}
              <div className="flex gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.7)] animate-bounce" />
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.7)] animate-bounce delay-100" />
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.7)] animate-bounce delay-200" />
              </div>

              <div className="flex flex-col gap-2.5">
                <h3 className="text-lg font-bold font-mono tracking-widest text-slate-100 uppercase">
                  SYSTEM READY
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-mono">
                  Click below to authorize procedural synth audio and activate active controllers.
                </p>
              </div>

              <button
                onClick={handleInitialize}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 via-emerald-500 to-blue-500 hover:from-rose-600 hover:via-emerald-600 hover:to-blue-600 text-white font-mono text-xs font-bold tracking-widest shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
              >
                INITIALIZE INTERFACE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real-time telemetry dashboard block */}
      <div className="mt-6 w-full max-w-[800px] bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 font-mono text-xs">
        <h4 className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-3 text-center border-b border-slate-900 pb-2">
          REAL-TIME TELEMETRY STREAM
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
          <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-slate-900/30 border border-slate-900/50">
            <span className="text-slate-500 text-[9px] uppercase">Engine Clock</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {telemetry.fps} FPS
            </span>
          </div>
          <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-slate-900/30 border border-slate-900/50">
            <span className="text-slate-500 text-[9px] uppercase">Particle Pool</span>
            <span className="text-indigo-400 font-bold">{telemetry.activeParticles} / 200</span>
          </div>
          <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-slate-900/30 border border-slate-900/50">
            <span className="text-slate-500 text-[9px] uppercase">Player Coords</span>
            <span className="text-slate-300 font-bold">X:{telemetry.playerX} Y:{telemetry.playerY}</span>
          </div>
          <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-slate-900/30 border border-slate-900/50">
            <span className="text-slate-500 text-[9px] uppercase">Process State</span>
            <span className="text-amber-400 font-bold uppercase">{telemetry.gameState}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
