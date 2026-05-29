import { resolveCollision } from '../Physics';
import { AABB } from '../AABB';

describe('2D AABB Physics Engine Resolution', () => {
  test('should return original position and velocity if there is no collision', () => {
    const player: AABB = { x: 0, y: 0, width: 10, height: 10 };
    const obstacle: AABB = { x: 50, y: 50, width: 10, height: 10 };
    const vel = { vx: 5, vy: 5 };

    const result = resolveCollision(player, vel, obstacle);
    expect(result.resolved).toBe(false);
    expect(result.axis).toBe('none');
    expect(result.pos.x).toBe(0);
    expect(result.pos.y).toBe(0);
    expect(result.vel.vx).toBe(5);
    expect(result.vel.vy).toBe(5);
  });

  test('should resolve vertical collision push-up (landing on a platform)', () => {
    // Overlapping from above: Y overlap (2px) is smaller than X overlap (8px)
    const player: AABB = { x: 1, y: 8, width: 8, height: 4 }; // bottom is y=12
    const obstacle: AABB = { x: 0, y: 10, width: 10, height: 10 };
    const vel = { vx: 2, vy: 10 };

    const result = resolveCollision(player, vel, obstacle);
    expect(result.resolved).toBe(true);
    expect(result.axis).toBe('y');
    expect(result.pos.y).toBe(6); // corrected y: 8 - 2 = 6 (so bottom is y=10)
    expect(result.pos.x).toBe(1); // x remains unchanged
    expect(result.vel.vy).toBe(0); // vertical velocity zeroed out
    expect(result.vel.vx).toBe(2); // horizontal velocity intact
  });

  test('should resolve vertical collision push-down (bonking head on ceiling)', () => {
    // Overlapping from below: Y overlap (2px) is smaller than X overlap (8px)
    const player: AABB = { x: 1, y: 18, width: 8, height: 4 }; // top is y=18, bottom y=22
    const obstacle: AABB = { x: 0, y: 10, width: 10, height: 10 }; // bottom is y=20
    const vel = { vx: 2, vy: -10 };

    const result = resolveCollision(player, vel, obstacle);
    expect(result.resolved).toBe(true);
    expect(result.axis).toBe('y');
    expect(result.pos.y).toBe(20); // corrected y: 18 + 2 = 20 (so top is y=20)
    expect(result.vel.vy).toBe(0);
    expect(result.vel.vx).toBe(2);
  });

  test('should resolve horizontal collision push-left (hitting right wall)', () => {
    // Overlapping from left: X overlap (2px) is smaller than Y overlap (8px)
    const player: AABB = { x: 8, y: 11, width: 4, height: 8 }; // right is x=12, y=11..19
    const obstacle: AABB = { x: 10, y: 10, width: 10, height: 10 }; // left is x=10, y=10..20
    const vel = { vx: 10, vy: 1 };

    const result = resolveCollision(player, vel, obstacle);
    expect(result.resolved).toBe(true);
    expect(result.axis).toBe('x');
    expect(result.pos.x).toBe(6); // corrected x: 8 - 2 = 6 (so right is x=10)
    expect(result.vel.vx).toBe(0);
    expect(result.vel.vy).toBe(1);
  });

  test('should resolve horizontal collision push-right (hitting left wall)', () => {
    // Overlapping from right: X overlap (2px) is smaller than Y overlap (8px)
    const player: AABB = { x: 18, y: 11, width: 4, height: 8 }; // left is x=18
    const obstacle: AABB = { x: 10, y: 10, width: 10, height: 10 }; // right is x=20
    const vel = { vx: -10, vy: 1 };

    const result = resolveCollision(player, vel, obstacle);
    expect(result.resolved).toBe(true);
    expect(result.axis).toBe('x');
    expect(result.pos.x).toBe(20); // corrected x: 18 + 2 = 20 (so left is x=20)
    expect(result.vel.vx).toBe(0);
    expect(result.vel.vy).toBe(1);
  });
});
