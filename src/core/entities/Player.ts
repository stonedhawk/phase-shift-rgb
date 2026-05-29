import { AABB } from '../math/AABB';
import { ColorState } from '../types/Chromatic';
import { PhysicsConfig } from '../config/PhysicsConfig';
import { InputState } from '../input/InputManager';

export class Player implements AABB {
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  public vx: number = 0;
  public vy: number = 0;
  public isGrounded: boolean = false;
  public colorState: ColorState = ColorState.RED;

  constructor(x: number, y: number, width: number = 32, height: number = 48) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Euler integration logic driven by the fixed-timestep loop delta.
   * Mutates player position, velocity, and chromatic states based on input captures.
   * 
   * @param dt Normalization timestep delta in ms (typically 16.67ms)
   * @param inputState Binary active inputs mapping
   */
  public update(dt: number, inputState: InputState) {
    // 1. Color State Toggles (immediate state mutation)
    if (inputState.phaseRed) {
      this.colorState = ColorState.RED;
    } else if (inputState.phaseGreen) {
      this.colorState = ColorState.GREEN;
    } else if (inputState.phaseBlue) {
      this.colorState = ColorState.BLUE;
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

    // 3. Vertical movement logic
    // Apply gravity force
    this.vy += PhysicsConfig.GRAVITY * dt;

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
    }

    // 4. Update coordinates using integrated velocities
    this.x += this.vx * dt;
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
