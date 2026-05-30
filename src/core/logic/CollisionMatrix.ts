import { ColorState } from '../types/Chromatic';

/**
 * Deterministic Chromatic Collision Matrix logic.
 * The player phases completely through platforms matching their current active color state.
 * They collide with (stand on / are blocked by) non-matching platform colors.
 * 
 * @param playerColor The player's active chromatic state.
 * @param platformColor The target platform's chromatic state.
 * @returns true if collision should be registered; false if the player phases through.
 */
export function canCollide(playerColor: ColorState, platformColor: ColorState): boolean {
  if (platformColor === ColorState.NEUTRAL) {
    return true;
  }
  return playerColor !== playerColor ? false : playerColor !== platformColor;
}
