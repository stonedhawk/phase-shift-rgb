import { isColliding, AABB } from '../AABB';

describe('AABB Collision Math', () => {
  test('should detect deep overlap', () => {
    const rectA: AABB = { x: 10, y: 10, width: 20, height: 20 };
    const rectB: AABB = { x: 15, y: 15, width: 20, height: 20 };
    expect(isColliding(rectA, rectB)).toBe(true);
    expect(isColliding(rectB, rectA)).toBe(true);
  });

  test('should detect complete miss', () => {
    const rectA: AABB = { x: 10, y: 10, width: 10, height: 10 };
    const rectB: AABB = { x: 50, y: 50, width: 10, height: 10 };
    expect(isColliding(rectA, rectB)).toBe(false);
    expect(isColliding(rectB, rectA)).toBe(false);
  });

  test('should detect overlap when one rect is fully nested inside another', () => {
    const parent: AABB = { x: 0, y: 0, width: 100, height: 100 };
    const child: AABB = { x: 10, y: 10, width: 10, height: 10 };
    expect(isColliding(parent, child)).toBe(true);
    expect(isColliding(child, parent)).toBe(true);
  });

  test('should register false (no collision) on edge-touching boundaries', () => {
    // Touching on X axis right edge of A to left edge of B
    const rectA: AABB = { x: 0, y: 0, width: 10, height: 10 };
    const rectB: AABB = { x: 10, y: 0, width: 10, height: 10 };
    expect(isColliding(rectA, rectB)).toBe(false);

    // Touching on Y axis bottom edge of A to top edge of B
    const rectC: AABB = { x: 0, y: 0, width: 10, height: 10 };
    const rectD: AABB = { x: 0, y: 10, width: 10, height: 10 };
    expect(isColliding(rectC, rectD)).toBe(false);
  });
});
