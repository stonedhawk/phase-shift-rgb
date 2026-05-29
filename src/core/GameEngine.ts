import { Player } from './entities/Player';
import { InputManager } from './input/InputManager';
import { LevelData } from './level/LevelParser';
import { LevelManager } from './level/LevelManager';
import { Renderer } from './render/Renderer';
import { Camera } from './render/Camera';
import { resolveCollisionX, resolveCollisionY } from './math/Physics';
import { isColliding } from './math/AABB';
import { canCollide } from './logic/CollisionMatrix';
import { ColorState } from './types/Chromatic';
import { GameState } from './logic/GameState';
import { ParticlePool } from './render/ParticlePool';
import { SoundManager } from './audio/SoundManager';
import { TelemetryClient } from './telemetry/TelemetryClient';

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
  public player!: Player;
  public inputManager: InputManager;
  public levelManager: LevelManager;
  public camera!: Camera;
  public particles: ParticlePool;
  public telemetry: TelemetryClient;
  
  public level!: LevelData;
  public state: GameState = GameState.START;

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

    // Instantiate game systems
    this.levelManager = new LevelManager();
    this.inputManager = new InputManager();
    this.particles = new ParticlePool(200);
    this.telemetry = new TelemetryClient();

    // Bootstrap first stage
    this.loadStage(0);
  }

  /**
   * Loads specific level configurations and resets dynamic entities and cameras.
   */
  public loadStage(index: number) {
    const stage = this.levelManager.loadLevel(index);
    if (!stage) {
      // Revert to START screen on overflow fallback
      this.state = GameState.START;
      this.loadStage(0);
      return;
    }

    this.level = stage.level;
    this.player = new Player(this.level.spawnX, this.level.spawnY);
    
    // Instantiate camera mapping level dimension bounds
    this.camera = new Camera(this.canvas.width, this.canvas.height, stage.bounds);
    this.camera.snapTo(this.player);
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
    
    // Clean keys and intervals to avoid memory leaks
    this.inputManager.cleanup();
    this.telemetry.cleanup();

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
    // A. Update particles in real time
    this.particles.update(dt);

    // 1. Manage State Machine transitions (Space/Jump bar restarts transitions)
    if (this.state !== GameState.PLAYING) {
      if (this.inputManager.state.jump) {
        if (this.state === GameState.VICTORY) {
          // Increment stage index
          const nextStage = this.levelManager.loadNextLevel();
          if (nextStage) {
            this.level = nextStage.level;
            this.player = new Player(this.level.spawnX, this.level.spawnY);
            this.camera.levelBounds = nextStage.bounds;
            this.camera.snapTo(this.player);
            this.state = GameState.PLAYING;
            console.log(`[GameEngine] Transitioned to Stage ${nextStage.index + 1}`);
          } else {
            // Loop back to main menu
            this.state = GameState.START;
            this.loadStage(0);
          }
        } else {
          // START or DEAD: reload current stage spawned positions
          this.loadStage(this.levelManager.currentLevelIndex);
          this.state = GameState.PLAYING;
          console.log('[GameEngine] Reboot respawn triggered.');
        }
      }
      return; // Skip physical updates if not actively playing
    }

    // Cache previous player color state to detect successful phase-shifting
    const prevColor = this.player.colorState;

    // 2. Perform Split-Axis Collision Resolution

    // A. Resolve Horizontal Axis (X)
    this.player.updateX(dt, this.inputManager.state);

    // If color shifted, trigger audio-visual feedback sweeps
    if (this.player.colorState !== prevColor) {
      SoundManager.playPhaseShiftSound(this.player.colorState);
      const colorHex = this.player.colorState === ColorState.RED ? '#f43f5e' :
                       this.player.colorState === ColorState.GREEN ? '#10b981' : '#3b82f6';
      this.particles.emit(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        colorHex,
        15
      );
    }

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
          this.telemetry.trackDeath({
            x: Math.round(this.player.x),
            y: Math.round(this.player.y),
            levelIndex: this.levelManager.currentLevelIndex,
            activeColor: this.player.colorState,
            timeAlive: Math.round(this.player.timeAlive),
          });
          SoundManager.playDeathSound();
          const colorHex = this.player.colorState === ColorState.RED ? '#f43f5e' :
                           this.player.colorState === ColorState.GREEN ? '#10b981' : '#3b82f6';
          this.particles.emit(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2,
            colorHex,
            50
          );
          console.log('[GameEngine] Player touched HAZARD spikes! Transitioned to DEAD.');
        } else if (platform.type === 'GOAL') {
          this.state = GameState.VICTORY;
          this.telemetry.trackLevelComplete({
            levelIndex: this.levelManager.currentLevelIndex,
            totalTime: Math.round(this.player.timeAlive),
            phaseShiftCount: this.player.phaseShiftCount,
          });
          console.log('[GameEngine] Player touched GOAL portal! Transitioned to VICTORY.');
        }
      }
    });

    // Screen wrapping bounds fallback to prevent player falling infinitely out of grid
    if (this.player.y > this.camera.levelBounds.height + 200) {
      this.state = GameState.DEAD;
      this.telemetry.trackDeath({
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        levelIndex: this.levelManager.currentLevelIndex,
        activeColor: this.player.colorState,
        timeAlive: Math.round(this.player.timeAlive),
      });
      SoundManager.playDeathSound();
      const colorHex = this.player.colorState === ColorState.RED ? '#f43f5e' :
                       this.player.colorState === ColorState.GREEN ? '#10b981' : '#3b82f6';
      this.particles.emit(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        colorHex,
        50
      );
      console.log('[GameEngine] Player fell off stage boundaries. Transitioned to DEAD.');
    }

    // 4. Update Camera Lerp tracking on player
    this.camera.follow(this.player, dt);
  }

  /**
   * Render screen updates with decoupled visual interpolation factor
   */
  private render(interpolation: number) {
    Renderer.draw(this.ctx, this.player, this.level, interpolation, this.state, this.camera, this.particles);
  }
}
