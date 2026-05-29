import { LevelParser } from '../LevelParser';
import { ColorState } from '../../types/Chromatic';

describe('LevelParser Schema Loading', () => {
  test('should parse valid level JSON correctly', () => {
    const json = JSON.stringify({
      spawnX: 150,
      spawnY: 200,
      platforms: [
        { x: 0, y: 100, width: 200, height: 20, colorState: 'RED' },
        { x: 300, y: 150, width: 100, height: 20, colorState: 'GREEN' },
      ],
    });

    const level = LevelParser.parse(json);
    expect(level.spawnX).toBe(150);
    expect(level.spawnY).toBe(200);
    expect(level.platforms.length).toBe(2);

    expect(level.platforms[0]).toEqual({
      x: 0,
      y: 100,
      width: 200,
      height: 20,
      colorState: ColorState.RED,
      type: 'SOLID',
    });
  });

  test('should default spawn positions if omitted', () => {
    const json = JSON.stringify({
      platforms: [],
    });
    const level = LevelParser.parse(json);
    expect(level.spawnX).toBe(100);
    expect(level.spawnY).toBe(100);
  });

  test('should throw error for invalid JSON format', () => {
    expect(() => LevelParser.parse('{invalid-json}')).toThrow();
  });

  test('should throw error if platforms array is missing', () => {
    const json = JSON.stringify({ spawnX: 100 });
    expect(() => LevelParser.parse(json)).toThrow('Invalid level JSON payload: platforms must be a valid array');
  });

  test('should throw error if platform is missing geometric bounds', () => {
    const json = JSON.stringify({
      platforms: [{ x: 0, width: 100, height: 20, colorState: 'RED' }], // missing y
    });
    expect(() => LevelParser.parse(json)).toThrow('Invalid platform coordinates at index 0');
  });

  test('should throw error for invalid colorState mapping', () => {
    const json = JSON.stringify({
      platforms: [{ x: 0, y: 0, width: 100, height: 20, colorState: 'PURPLE' }],
    });
    expect(() => LevelParser.parse(json)).toThrow("Invalid colorState 'PURPLE' at index 0");
  });
});
