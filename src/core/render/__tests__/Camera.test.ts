import { Camera } from '../Camera';
import { AABB } from '../../math/AABB';

describe('Lerp Camera Scrolling System', () => {
  test('should initialize default properties and boundaries correctly', () => {
    const camera = new Camera(800, 600, { width: 1600, height: 1200 });
    expect(camera.width).toBe(800);
    expect(camera.height).toBe(600);
    expect(camera.levelBounds).toEqual({ width: 1600, height: 1200 });
    expect(camera.x).toBe(0);
    expect(camera.y).toBe(0);
  });

  test('should track target toward center with smooth linear interpolation', () => {
    // Camera is 800x600, level is 1600x1200.
    const camera = new Camera(800, 600, { width: 1600, height: 1200 });
    const target: AABB = { x: 500, y: 400, width: 32, height: 48 };

    // targetCenter is at:
    // X = 500 + 16 = 516
    // Y = 400 + 24 = 424
    // Target offset to center camera on target:
    // offsetX = 516 - 400 = 116
    // offsetY = 424 - 300 = 124

    // Run 1 tick (16.67ms) of follow
    camera.follow(target, 16.6667);

    // Damping formula: camera.x += (targetOffsetX - camera.x) * trackingSpeed * dt
    // For x: 0 + (116 - 0) * 0.006 * 16.67 = 116 * 0.1 = 11.6
    expect(camera.x).toBeCloseTo(11.6, 1);
    expect(camera.y).toBeCloseTo(12.4, 1);
  });

  test('should override tracking and clamp viewport boundaries on map edges', () => {
    const camera = new Camera(800, 600, { width: 1000, height: 800 });
    
    // 1. Check Left boundary clamping (x must not drop below 0)
    const leftTarget: AABB = { x: -200, y: 100, width: 32, height: 48 };
    camera.snapTo(leftTarget);
    expect(camera.x).toBe(0);

    // 2. Check Top boundary clamping (y must not drop below 0)
    const topTarget: AABB = { x: 100, y: -200, width: 32, height: 48 };
    camera.snapTo(topTarget);
    expect(camera.y).toBe(0);

    // 3. Check Right boundary clamping (x must not exceed levelBounds.width - width = 200)
    const rightTarget: AABB = { x: 1500, y: 100, width: 32, height: 48 };
    camera.snapTo(rightTarget);
    expect(camera.x).toBe(200);

    // 4. Check Bottom boundary clamping (y must not exceed levelBounds.height - height = 200)
    const bottomTarget: AABB = { x: 100, y: 1500, width: 32, height: 48 };
    camera.snapTo(bottomTarget);
    expect(camera.y).toBe(200);
  });
});
