import { Player } from './entities/Player';
import { InputManager } from './input/InputManager';
import { LevelParser, LevelData } from './level/LevelParser';
import { Renderer } from './render/Renderer';
import { resolveCollisionX, resolveCollisionY } from './math/Physics';
import { isColliding } from './math/AABB';
import { canCollide } from './logic/CollisionMatrix';
import { ColorState } from './types/Chromatic';
import { GameState } from './logic/GameState';

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
  public state: GameState = GameState.START;

  // Target 60 FPS (approx 16.67ms per frame)
  public readonly targetFps = 60;
  public readonly dt = 1000 / this.targetFps; 
  public totalTime = 0;
  public ticks = 0;

  // Stage JSON data containing SOLIDS, HAZARDS, and GOAL
  private static readonly TEST_LEVEL_SCHEMA = JSON.stringify({
    spawnX: 100,
    spawnY: 100,
    platforms: [
      // Bottom border boundaries (RED)
      { x: 0, y: 560, width: 800, height: 40, colorState: 'RED', type: 'SOLID' },
      
      // Floating solid platform chunks
      { x: 150, y: 440, width: 150, height: 20, colorState: 'BLUE', type: 'SOLID' },
      { x: 500, y: 440, width: 150, height: 20, colorState: 'GREEN', type: 'SOLID' },
      { x: 300, y: 320, width: 200, height: 20, colorState: 'RED', type: 'SOLID' },
      
      // Hazardous spike layers (RED) - player will dissolve on touch
      { x: 350, y: 540, width: 100, height: 20, colorState: 'RED', type: 'HAZARD' },
      
      // Goal Portal and supporting ledge (BLUE)
      { x: 720, y: 160, width: 50, height: 60, colorState: 'BLUE', type: 'GOAL' },
      { x: 700, y: 220, width: 100, height: 20, colorState: 'BLUE', type: 'SOLID' }
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
    // 1. Manage State Machine transitions (Space/Jump bar restarts transitions)
    if (this.state !== GameState.PLAYING) {
      if (this.inputManager.state.jump) {
        // Reset player state to defaults on transition to PLAYING
        this.player.x = this.level.spawnX;
        this.player.y = this.level.spawnY;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.isGrounded = false;
        this.player.colorState = ColorState.RED;
        this.player.prevX = this.level.spawnX;
        this.player.prevY = this.level.spawnY;
        this.state = GameState.PLAYING;
        console.log('[GameEngine] Transitioned to PLAYING state.');
      }
      return; // Skip physical movement loops if not in PLAYING state
    }

    // 2. Perform Split-Axis Collision Resolution

    // A. Resolve Horizontal Axis (X)
    this.player.updateX(dt, this.inputManager.state);

    this.level.platforms.forEach((platform) => {
      if (platform.type === 'SOLID' && canCollide(this.player.colorState, platform.colorState)) {
        const res = resolveCollisionX(this.player, this.player, platform);
        if (res.resolved) {
          this.player.x = res.pos.x;
          this.player.vx = res.vel.vx;
        }
      }
    });

    // B. Resolve Vertical Axis (Y)
    this.player.updateY(dt, this.inputManager.state);
    
    // Reset grounded flag before vertical sweep
    this.player.isGrounded = false;

    this.level.platforms.forEach((platform) => {
      if (platform.type === 'SOLID' && canCollide(this.player.colorState, platform.colorState)) {
        const res = resolveCollisionY(this.player, this.player, platform);
        if (res.resolved) {
          this.player.y = res.pos.y;
          this.player.vy = res.vel.vy;

          // If pushed upward, the player has landed on top of this platform
          if (res.pos.y < platform.y) {
            this.player.isGrounded = true;
          }
        }
      }
    });

    // 3. Perform Hazard / Goal Overlap Checks
    this.level.platforms.forEach((platform) => {
      if (isColliding(this.player, platform)) {
        if (platform.type === 'HAZARD') {
          this.state = GameState.DEAD;
          console.log('[GameEngine] Player touched HAZARD spike! Transitioned to DEAD.');
        } else if (platform.type === 'GOAL') {
          this.state = GameState.VICTORY;
          console.log('[GameEngine] Player touched GOAL portal! Transitioned to VICTORY.');
        }
      }
    });

    // Screen wrapping bounds fallback to prevent player falling infinitely out of grid
    if (this.player.y > this.canvas.height + 200) {
      this.state = GameState.DEAD;
      console.log('[GameEngine] Player fell off stage boundaries. Transitioned to DEAD.');
    }
  }

  /**
   * Render screen updates with decoupled visual interpolation factor
   */
  private render(interpolation: number) {
    Renderer.draw(this.ctx, this.player, this.level, interpolation, this.state);
  }
}
