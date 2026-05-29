import { AABB } from '../math/AABB';
import { ColorState } from '../types/Chromatic';
import { PhysicsConfig } from '../config/PhysicsConfig';
import { InputState } from '../input/InputManager';

export class Player implements AABB {
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  // Inter-frame visual interpolation trackers
  public prevX: number;
  public prevY: number;

  public vx: number = 0;
  public vy: number = 0;
  public isGrounded: boolean = false;
  public hasJumpBeenCut: boolean = false;
  public colorState: ColorState = ColorState.RED;

  // Trackers for asynchronous telemetry pipelines
  public timeAlive: number = 0;
  public phaseShiftCount: number = 0;

  constructor(x: number, y: number, width: number = 32, height: number = 48) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.prevX = x;
    this.prevY = y;
  }

  /**
   * Euler integration logic driven by the fixed-timestep loop delta.
   * Mutates player position, velocity, and chromatic states based on input captures.
   * 
   * @param dt Normalization timestep delta in ms (typically 16.67ms)
   * @param inputState Binary active inputs mapping
   */
  public update(dt: number, inputState: InputState) {
    this.timeAlive += dt;
    this.updateX(dt, inputState);
    this.updateY(dt, inputState);
  }

  /**
   * Run X-axis Euler integration, cache inter-frame position, and handle state switches.
   */
  public updateX(dt: number, inputState: InputState) {
    // Cache current physical coordinates before updates for visual interpolation
    this.prevX = this.x;

    // Reset jump cut-off flag when grounded
    if (this.isGrounded) {
      this.hasJumpBeenCut = false;
    }

    // 1. Color State Toggles (immediate state mutation)
    const targetColor = inputState.phaseRed ? ColorState.RED :
                        inputState.phaseGreen ? ColorState.GREEN :
                        inputState.phaseBlue ? ColorState.BLUE : null;

    if (targetColor !== null && targetColor !== this.colorState) {
      this.colorState = targetColor;
      this.phaseShiftCount++;
    }

    // 2. Horizontal movement logic
    if (inputState.left && !inputState.right) {
      this.vx -= PhysicsConfig.MOVE_ACCELERATION * dt;
    } else if (inputState.right && !inputState.left) {
      this.vx += PhysicsConfig.MOVE_ACCELERATION * dt;
    } else {
      // Apply multiplicative dampening decay
      const friction = this.isGrounded ? PhysicsConfig.GROUND_FRICTION : PhysicsConfig.AIR_DRAG;
      // Normalizing decay over standard fixed timestep (approx 16.67ms equivalent)
      this.vx *= Math.pow(friction, dt / 16.6667);
    }

    // Clamp horizontal velocity to terminal threshold limits
    if (this.vx > PhysicsConfig.TERMINAL_VELOCITY_X) {
      this.vx = PhysicsConfig.TERMINAL_VELOCITY_X;
    } else if (this.vx < -PhysicsConfig.TERMINAL_VELOCITY_X) {
      this.vx = -PhysicsConfig.TERMINAL_VELOCITY_X;
    }

    // Apply horizontal integration
    this.x += this.vx * dt;
  }

  /**
   * Run Y-axis Euler integration, cache inter-frame position, apply gravity and jump physics.
   */
  public updateY(dt: number, inputState: InputState) {
    // Cache Y for decoupled visual interpolation
    this.prevY = this.y;

    // 3. Vertical movement logic
    // Apply gravity force
    this.vy += PhysicsConfig.GRAVITY * dt;

    // Variable jump cut-off (if user releases Jump button during ascent, cut jump short by 50%)
    if (!inputState.jump && this.vy < 0 && !this.hasJumpBeenCut) {
      this.vy *= 0.5;
      this.hasJumpBeenCut = true;
    }

    // Clamp vertical velocity to terminal limits (prevents clipping through thin platforms during fast falls)
    if (this.vy > PhysicsConfig.TERMINAL_VELOCITY_Y) {
      this.vy = PhysicsConfig.TERMINAL_VELOCITY_Y;
    } else if (this.vy < -PhysicsConfig.TERMINAL_VELOCITY_Y) {
      this.vy = -PhysicsConfig.TERMINAL_VELOCITY_Y;
    }

    // Perform jump impulse check
    if (inputState.jump && this.isGrounded) {
      this.vy = PhysicsConfig.JUMP_IMPULSE;
      this.isGrounded = false;
      this.hasJumpBeenCut = false;
    }

    // Apply vertical integration
    this.y += this.vy * dt;
  }

  /**
   * Helper exposing player geometrical AABB dimensions for collision systems.
   */
  public getAABB(): AABB {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}
