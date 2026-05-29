import { AABB } from '../math/AABB';

export interface LevelBounds {
  width: number;
  height: number;
}

export class Camera {
  public x: number = 0;
  public y: number = 0;
  public width: number;
  public height: number;
  public levelBounds: LevelBounds;

  // Normalized tracking interpolation speed factor
  private readonly trackingSpeed = 0.006; // progress multiplier per ms

  constructor(
    width: number = 800,
    height: number = 600,
    levelBounds: LevelBounds = { width: 800, height: 600 }
  ) {
    this.width = width;
    this.height = height;
    this.levelBounds = levelBounds;
  }

  /**
   * Lerp tracking of dynamic player entities centered inside camera frames.
   * 
   * @param target Geometric dynamic coordinates AABB
   * @param dt Fixed timestep loop delta in ms
   */
  public follow(target: AABB, dt: number) {
    // Determine centering offsets
    const targetCenterX = target.x + target.width / 2;
    const targetCenterY = target.y + target.height / 2;

    const targetOffsetX = targetCenterX - this.width / 2;
    const targetOffsetY = targetCenterY - this.height / 2;

    // Apply linear interpolation (Lerp) tracking
    this.x += (targetOffsetX - this.x) * this.trackingSpeed * dt;
    this.y += (targetOffsetY - this.y) * this.trackingSpeed * dt;

    // Clamp camera frames within standard boundaries
    this.clampToBounds();
  }

  /**
   * Resets camera coordinates directly to center target without interpolation.
   */
  public snapTo(target: AABB) {
    const targetCenterX = target.x + target.width / 2;
    const targetCenterY = target.y + target.height / 2;

    this.x = targetCenterX - this.width / 2;
    this.y = targetCenterY - this.height / 2;

    this.clampToBounds();
  }

  /**
   * Clamps scrolling frames to defined stage sizes to prevent showing void regions.
   */
  public clampToBounds() {
    const maxScrollX = Math.max(0, this.levelBounds.width - this.width);
    const maxScrollY = Math.max(0, this.levelBounds.height - this.height);

    this.x = Math.max(0, Math.min(maxScrollX, this.x));
    this.y = Math.max(0, Math.min(maxScrollY, this.y));
  }
}
