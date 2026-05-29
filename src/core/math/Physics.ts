import { AABB, isColliding } from './AABB';

export interface Vector2D {
  vx: number;
  vy: number;
}

export interface CollisionResolutionResult {
  pos: { x: number; y: number };
  vel: Vector2D;
  resolved: boolean;
  axis: 'none' | 'x' | 'y';
}

/**
 * Resolves standard 2D AABB collision using Minimum Penetration Depth projection.
 * Zeroes out velocity on the colliding axis.
 * 
 * @param entity Dynamic entity AABB
 * @param velocity Current entity movement velocities
 * @param obstacle Static barrier/platform AABB
 * @returns Result payload containing new corrected position, updated velocity, and resolution metadata
 */
export function resolveCollision(
  entity: AABB,
  velocity: Vector2D,
  obstacle: AABB
): CollisionResolutionResult {
  // If no collision is registered, bypass resolution
  if (!isColliding(entity, obstacle)) {
    return {
      pos: { x: entity.x, y: entity.y },
      vel: { ...velocity },
      resolved: false,
      axis: 'none',
    };
  }

  // Calculate intersection/overlap depth on both axes
  const overlapX = Math.min(entity.x + entity.width, obstacle.x + obstacle.width) - Math.max(entity.x, obstacle.x);
  const overlapY = Math.min(entity.y + entity.height, obstacle.y + obstacle.height) - Math.max(entity.y, obstacle.y);

  const pos = { x: entity.x, y: entity.y };
  const vel = { ...velocity };

  // Resolve along the axis of minimum penetration
  if (overlapX < overlapY) {
    // Horizontal resolution
    const entityCenter = entity.x + entity.width / 2;
    const obstacleCenter = obstacle.x + obstacle.width / 2;

    if (entityCenter < obstacleCenter) {
      // Push Left
      pos.x -= overlapX;
    } else {
      // Push Right
      pos.x += overlapX;
    }
    vel.vx = 0; // Zero horizontal velocity on impact
    return { pos, vel, resolved: true, axis: 'x' };
  } else {
    // Vertical resolution (using <= to prioritize landing on platforms over side-projection in exact ties)
    const entityCenter = entity.y + entity.height / 2;
    const obstacleCenter = obstacle.y + obstacle.height / 2;

    if (entityCenter < obstacleCenter) {
      // Push Up (Land on top of platform)
      pos.y -= overlapY;
    } else {
      // Push Down (Bonk head on ceiling)
      pos.y += overlapY;
    }
    vel.vy = 0; // Zero vertical velocity on impact
    return { pos, vel, resolved: true, axis: 'y' };
  }
}

/**
 * Resolves standard 2D AABB collision horizontally (X axis).
 * 
 * @param entity Dynamic entity AABB
 * @param velocity Current entity movement velocities
 * @param obstacle Static barrier AABB
 */
export function resolveCollisionX(
  entity: AABB,
  velocity: Vector2D,
  obstacle: AABB
): CollisionResolutionResult {
  if (!isColliding(entity, obstacle)) {
    return {
      pos: { x: entity.x, y: entity.y },
      vel: { ...velocity },
      resolved: false,
      axis: 'none',
    };
  }

  const overlapX = Math.min(entity.x + entity.width, obstacle.x + obstacle.width) - Math.max(entity.x, obstacle.x);
  const pos = { x: entity.x, y: entity.y };
  const vel = { ...velocity };

  const entityCenter = entity.x + entity.width / 2;
  const obstacleCenter = obstacle.x + obstacle.width / 2;

  if (entityCenter < obstacleCenter) {
    pos.x -= overlapX;
  } else {
    pos.x += overlapX;
  }
  vel.vx = 0;
  return { pos, vel, resolved: true, axis: 'x' };
}

/**
 * Resolves standard 2D AABB collision vertically (Y axis).
 * 
 * @param entity Dynamic entity AABB
 * @param velocity Current entity movement velocities
 * @param obstacle Static barrier AABB
 */
export function resolveCollisionY(
  entity: AABB,
  velocity: Vector2D,
  obstacle: AABB
): CollisionResolutionResult {
  if (!isColliding(entity, obstacle)) {
    return {
      pos: { x: entity.x, y: entity.y },
      vel: { ...velocity },
      resolved: false,
      axis: 'none',
    };
  }

  const overlapY = Math.min(entity.y + entity.height, obstacle.y + obstacle.height) - Math.max(entity.y, obstacle.y);
  const pos = { x: entity.x, y: entity.y };
  const vel = { ...velocity };

  const entityCenter = entity.y + entity.height / 2;
  const obstacleCenter = obstacle.y + obstacle.height / 2;

  if (entityCenter < obstacleCenter) {
    pos.y -= overlapY;
  } else {
    pos.y += overlapY;
  }
  vel.vy = 0;
  return { pos, vel, resolved: true, axis: 'y' };
}

