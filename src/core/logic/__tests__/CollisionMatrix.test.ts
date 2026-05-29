import { canCollide } from '../CollisionMatrix';
import { ColorState } from '../../types/Chromatic';

describe('Chromatic Collision Matrix', () => {
  test('assert player phases through matching colors', () => {
    expect(canCollide(ColorState.RED, ColorState.RED)).toBe(false);
    expect(canCollide(ColorState.GREEN, ColorState.GREEN)).toBe(false);
    expect(canCollide(ColorState.BLUE, ColorState.BLUE)).toBe(false);
  });

  test('assert player collides with non-matching platform colors', () => {
    // Red Player
    expect(canCollide(ColorState.RED, ColorState.GREEN)).toBe(true);
    expect(canCollide(ColorState.RED, ColorState.BLUE)).toBe(true);

    // Green Player
    expect(canCollide(ColorState.GREEN, ColorState.RED)).toBe(true);
    expect(canCollide(ColorState.GREEN, ColorState.BLUE)).toBe(true);

    // Blue Player
    expect(canCollide(ColorState.BLUE, ColorState.RED)).toBe(true);
    expect(canCollide(ColorState.BLUE, ColorState.GREEN)).toBe(true);
  });
});
