import { resolveCollisionX, resolveCollisionY } from '../Physics';
import { Player } from '../../entities/Player';
import { AABB } from '../AABB';

describe('Split-Axis AABB Collision Platform Seam Sliding', () => {
  test('should slide smoothly across adjacent floor platforms without catch or zeroing vx', () => {
    // Player is a 32x48 box moving right (vx = 0.25) while sliding on top of floor platforms (isGrounded = true)
    // The player's bottom is at y = 100, which aligns perfectly with the top of two adjacent platforms.
    const player = new Player(0, 52, 32, 48); // y=52, so bottom is y=100.
    player.vx = 0.25;
    player.vy = 0;
    player.isGrounded = true;

    // Platform 1 (x: 0..100, y: 100..120)
    // Platform 2 (x: 100..200, y: 100..120) - adjacent right next to Platform 1
    const platform1: AABB = { x: 0, y: 100, width: 100, height: 20 };
    const platform2: AABB = { x: 100, y: 100, width: 100, height: 20 };

    const input = {
      left: false,
      right: true,
      jump: false,
      phaseRed: false,
      phaseGreen: false,
      phaseBlue: false,
    };

    // --- STEP 1: Simulate split-axis horizontal physics ---
    player.updateX(16.6667, input); // vx is 0.25. Pos should advance: x = 0 + 0.25 * 16.67 = 4.167px
    expect(player.x).toBeCloseTo(4.1667, 2);

    // Run X-axis overlaps
    const resX1 = resolveCollisionX(player, player, platform1);
    if (resX1.resolved) {
      player.x = resX1.pos.x;
      player.vx = resX1.vel.vx;
    }
    const resX2 = resolveCollisionX(player, player, platform2);
    if (resX2.resolved) {
      player.x = resX2.pos.x;
      player.vx = resX2.vel.vx;
    }

    // Horizontal speed must remain completely intact! (no horizontal snag on seams)
    expect(player.vx).toBe(0.25);
    expect(player.x).toBeCloseTo(4.1667, 2);

    // --- STEP 2: Simulate split-axis vertical physics ---
    player.updateY(16.6667, input); // gravity falls player down into overlaps: y = 52 + gravity * dt²...
    
    // Resolve Y overlaps
    const resY1 = resolveCollisionY(player, player, platform1);
    if (resY1.resolved) {
      player.y = resY1.pos.y;
      player.vy = resY1.vel.vy;
      player.isGrounded = true;
    }
    const resY2 = resolveCollisionY(player, player, platform2);
    if (resY2.resolved) {
      player.y = resY2.pos.y;
      player.vy = resY2.vel.vy;
      player.isGrounded = true;
    }

    // Vertical position corrected back to exactly y=52 (so bottom sits perfectly at top of platform y=100)
    expect(player.y).toBe(52);
    expect(player.isGrounded).toBe(true);
    expect(player.vy).toBe(0);
    expect(player.vx).toBe(0.25); // vx is still perfectly intact!
  });
});
