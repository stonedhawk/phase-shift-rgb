import { Player } from './entities/Player';
import { InputManager } from './input/InputManager';
import { LevelParser, LevelData } from './level/LevelParser';
import { Renderer } from './render/Renderer';
import { resolveCollision } from './math/Physics';
import { canCollide } from './logic/CollisionMatrix';
import { ColorState } from './types/Chromatic';

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

  // Active game systems
  public player: Player;
  public inputManager: InputManager;
  public level: LevelData;

  // Target 60 FPS (approx 16.67ms per frame)
  public readonly targetFps = 60;
  public readonly dt = 1000 / this.targetFps; 
  public totalTime = 0;
  public ticks = 0;

  // Default Stage JSON data
  private static readonly TEST_LEVEL_SCHEMA = JSON.stringify({
    spawnX: 100,
    spawnY: 100,
    platforms: [
      // Bottom border boundaries
      { x: 0, y: 560, width: 800, height: 40, colorState: 'RED' },
      
      // Floating puzzle layers
      { x: 150, y: 440, width: 150, height: 20, colorState: 'BLUE' },
      { x: 500, y: 440, width: 150, height: 20, colorState: 'GREEN' },
      { x: 300, y: 320, width: 200, height: 20, colorState: 'RED' },
      
      // Left and right neutral side ledges
      { x: 0, y: 220, width: 100, height: 20, colorState: 'GREEN' },
      { x: 700, y: 220, width: 100, height: 20, colorState: 'BLUE' }
    ]
  });

  constructor(options: GameEngineOptions) {
    this.canvas = options.canvas;
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D canvas context');
    }
    this.ctx = context;

    // Instantiate game controllers
    this.inputManager = new InputManager();
    this.level = LevelParser.parse(GameEngine.TEST_LEVEL_SCHEMA);
    this.player = new Player(this.level.spawnX, this.level.spawnY);
  }

  /**
   * Start the fixed-timestep game loop and initialize keyboard capture listeners
   */
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Bind DOM keys
    this.inputManager.setup();

    // Reset loop markers
    this.lastTime = performance.now();
    this.accumulator = 0;
    
    // Spawn animation frame request
    this.animationFrameId = requestAnimationFrame(this.loop);
    console.log('[GameEngine] Engine and input controllers successfully active.');
  }

  /**
   * Stop/pause the game loop and clean up active keyboard capture hooks
   */
  public stop() {
    this.isRunning = false;
    
    // Clean keys to avoid memory leaks
    this.inputManager.cleanup();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    console.log('[GameEngine] Engine loops and keyboard hooks successfully halted.');
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
    // 1. Update player physics integration
    this.player.update(dt, this.inputManager.state);

    // Reset grounded flag before resolving environmental obstacles
    this.player.isGrounded = false;

    // 2. Perform collision sweeps and resolution against active platform elements
    this.level.platforms.forEach((platform) => {
      // Check collision matrix rules (can collide only if player and platform color mismatch)
      if (canCollide(this.player.colorState, platform.colorState)) {
        const res = resolveCollision(this.player, this.player, platform);
        if (res.resolved) {
          // Adjust physical entity markers
          this.player.x = res.pos.x;
          this.player.y = res.pos.y;
          this.player.vx = res.vel.vx;
          this.player.vy = res.vel.vy;

          // If resolved vertically upward, player has landed on floor
          if (res.axis === 'y' && res.pos.y < platform.y) {
            this.player.isGrounded = true;
          }
        }
      }
    });

    // Screen wrapping bounds fallback to prevent player falling infinitely out of grid
    if (this.player.y > this.canvas.height + 200) {
      this.player.x = this.level.spawnX;
      this.player.y = this.level.spawnY;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.isGrounded = false;
      this.player.colorState = ColorState.RED;
      console.log('[GameEngine] Player fell off stage. Respawn triggered.');
    }
  }

  /**
   * Render screen updates with decoupled visual interpolation factor
   */
  private render(interpolation: number) {
    Renderer.draw(this.ctx, this.player, this.level, interpolation);
  }
}
