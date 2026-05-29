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

const staticResult: CollisionResolutionResult = {
  pos: { x: 0, y: 0 },
  vel: { vx: 0, vy: 0 },
  resolved: false,
  axis: 'none',
};

function setStaticResult(
  x: number,
  y: number,
  vx: number,
  vy: number,
  resolved: boolean,
  axis: 'none' | 'x' | 'y'
): CollisionResolutionResult {
  staticResult.pos.x = x;
  staticResult.pos.y = y;
  staticResult.vel.vx = vx;
  staticResult.vel.vy = vy;
  staticResult.resolved = resolved;
  staticResult.axis = axis;
  return staticResult;
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
    return setStaticResult(entity.x, entity.y, velocity.vx, velocity.vy, false, 'none');
  }

  // Calculate intersection/overlap depth on both axes
  const overlapX = Math.min(entity.x + entity.width, obstacle.x + obstacle.width) - Math.max(entity.x, obstacle.x);
  const overlapY = Math.min(entity.y + entity.height, obstacle.y + obstacle.height) - Math.max(entity.y, obstacle.y);

  let posX = entity.x;
  let posY = entity.y;
  let velVx = velocity.vx;
  let velVy = velocity.vy;

  // Resolve along the axis of minimum penetration
  if (overlapX < overlapY) {
    // Horizontal resolution
    const entityCenter = entity.x + entity.width / 2;
    const obstacleCenter = obstacle.x + obstacle.width / 2;

    if (entityCenter < obstacleCenter) {
      // Push Left
      posX -= overlapX;
    } else {
      // Push Right
      posX += overlapX;
    }
    velVx = 0; // Zero horizontal velocity on impact
    return setStaticResult(posX, posY, velVx, velVy, true, 'x');
  } else {
    // Vertical resolution (using <= to prioritize landing on platforms over side-projection in exact ties)
    const entityCenter = entity.y + entity.height / 2;
    const obstacleCenter = obstacle.y + obstacle.height / 2;

    if (entityCenter < obstacleCenter) {
      // Push Up (Land on top of platform)
      posY -= overlapY;
    } else {
      // Push Down (Bonk head on ceiling)
      posY += overlapY;
    }
    velVy = 0; // Zero vertical velocity on impact
    return setStaticResult(posX, posY, velVx, velVy, true, 'y');
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
    return setStaticResult(entity.x, entity.y, velocity.vx, velocity.vy, false, 'none');
  }

  const overlapX = Math.min(entity.x + entity.width, obstacle.x + obstacle.width) - Math.max(entity.x, obstacle.x);
  let posX = entity.x;
  const posY = entity.y;
  let velVx = velocity.vx;
  const velVy = velocity.vy;

  const entityCenter = entity.x + entity.width / 2;
  const obstacleCenter = obstacle.x + obstacle.width / 2;

  if (entityCenter < obstacleCenter) {
    posX -= overlapX;
  } else {
    posX += overlapX;
  }
  velVx = 0;
  return setStaticResult(posX, posY, velVx, velVy, true, 'x');
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
    return setStaticResult(entity.x, entity.y, velocity.vx, velocity.vy, false, 'none');
  }

  const overlapY = Math.min(entity.y + entity.height, obstacle.y + obstacle.height) - Math.max(entity.y, obstacle.y);
  const posX = entity.x;
  let posY = entity.y;
  const velVx = velocity.vx;
  let velVy = velocity.vy;

  const entityCenter = entity.y + entity.height / 2;
  const obstacleCenter = obstacle.y + obstacle.height / 2;

  if (entityCenter < obstacleCenter) {
    posY -= overlapY;
  } else {
    posY += overlapY;
  }
  velVy = 0;
  return setStaticResult(posX, posY, velVx, velVy, true, 'y');
}

