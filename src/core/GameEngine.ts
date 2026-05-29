export interface GameEngineOptions {
  canvas: HTMLCanvasElement;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  // Target 60 FPS (approx 16.67ms per frame)
  public readonly targetFps = 60;
  public readonly dt = 1000 / this.targetFps; 
  public totalTime = 0;
  public ticks = 0;

  constructor(options: GameEngineOptions) {
    this.canvas = options.canvas;
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D canvas context');
    }
    this.ctx = context;
  }

  /**
   * Start the fixed-timestep game loop
   */
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.animationFrameId = requestAnimationFrame(this.loop);
    console.log('[GameEngine] Engine started.');
  }

  /**
   * Stop/pause the game loop
   */
  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    console.log('[GameEngine] Engine stopped.');
  }

  /**
   * Core frame loop
   */
  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    // Calculate real-time frame duration (delta) in ms
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Cap delta time to prevent "spiral of death" during heavy lag or suspended tabs (max 250ms)
    if (deltaTime > 250) {
      deltaTime = 250;
    }

    this.accumulator += deltaTime;

    // Consume the accumulator with a fixed step dt
    while (this.accumulator >= this.dt) {
      this.update(this.dt);
      this.accumulator -= this.dt;
      this.totalTime += this.dt;
      this.ticks++;
    }

    // Interpolation factor represents the progress between the last update and the next expected update
    const interpolation = this.accumulator / this.dt;
    this.render(interpolation);

    // Request the next frame
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Update game logic with a deterministic fixed timestep
   */
  private update(dt: number) {
    // Output a simple console.log tick payload to verify delta time consistency
    console.log(`[GameEngine Tick] ticks: ${this.ticks} | dt: ${dt.toFixed(4)}ms | totalTime: ${this.totalTime.toFixed(2)}ms`);
  }

  /**
   * Render screen updates with interpolation factor
   */
  private render(interpolation: number) {
    // Clear the canvas and draw diagnostic text (no game graphics yet)
    this.ctx.fillStyle = '#0f172a'; // Deep background slate-900
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Premium glowing canvas diagnostics border
    this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)'; // Indigo border
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);

    // Diagnostic HUD Text
    this.ctx.fillStyle = '#38bdf8'; // Sky blue text
    this.ctx.font = 'bold 18px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    this.ctx.fillText(
      `PHASE SHIFT: RGB ENGINE`,
      this.canvas.width / 2,
      this.canvas.height / 2 - 30
    );

    this.ctx.fillStyle = '#94a3b8'; // Cool slate text
    this.ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    this.ctx.fillText(
      `Ticks: ${this.ticks} | Time: ${(this.totalTime / 1000).toFixed(2)}s | Target: 60 FPS`,
      this.canvas.width / 2,
      this.canvas.height / 2 + 10
    );

    this.ctx.fillStyle = '#22c55e'; // Green status text
    this.ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    this.ctx.fillText(
      `● FIXED TIMESTEP DETERMINISTIC LOOP ACTIVE`,
      this.canvas.width / 2,
      this.canvas.height / 2 + 45
    );
  }
}
