export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Checks for standard 2D AABB Axis-Aligned Bounding Box overlaps.
 * 
 * @param rectA Bounding box representing entity A
 * @param rectB Bounding box representing entity B
 * @returns true if overlaps occur; false otherwise.
 */
export function isColliding(rectA: AABB, rectB: AABB): boolean {
  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}
