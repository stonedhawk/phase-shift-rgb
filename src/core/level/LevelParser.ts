import { ColorState } from '../types/Chromatic';

export interface PlatformData {
  x: number;
  y: number;
  width: number;
  height: number;
  colorState: ColorState;
  type: 'SOLID' | 'HAZARD' | 'GOAL';
}

export interface LevelData {
  platforms: PlatformData[];
  spawnX: number;
  spawnY: number;
}

export class LevelParser {
  /**
   * Translates a raw JSON string into typed platform and level datasets.
   * Performs high-fidelity schema validation on parsed elements.
   * 
   * @param jsonString The raw JSON string containing level design parameters
   */
  public static parse(jsonString: string): LevelData {
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid level JSON payload: root must be an object');
    }

    if (!Array.isArray(data.platforms)) {
      throw new Error('Invalid level JSON payload: platforms must be a valid array');
    }

    const platforms: PlatformData[] = data.platforms.map((p: { x: unknown; y: unknown; width: unknown; height: unknown; colorState: unknown; type?: unknown }, index: number) => {
      if (
        typeof p.x !== 'number' ||
        typeof p.y !== 'number' ||
        typeof p.width !== 'number' ||
        typeof p.height !== 'number'
      ) {
        throw new Error(`Invalid platform coordinates at index ${index}`);
      }

      const colorState = p.colorState as ColorState;
      if (!Object.values(ColorState).includes(colorState)) {
        throw new Error(`Invalid colorState '${p.colorState}' at index ${index}`);
      }

      const type = p.type ?? 'SOLID';
      if (type !== 'SOLID' && type !== 'HAZARD' && type !== 'GOAL') {
        throw new Error(`Invalid platform type '${p.type}' at index ${index}`);
      }

      return {
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        colorState,
        type: type as 'SOLID' | 'HAZARD' | 'GOAL',
      };
    });

    return {
      platforms,
      spawnX: typeof data.spawnX === 'number' ? data.spawnX : 100,
      spawnY: typeof data.spawnY === 'number' ? data.spawnY : 100,
    };
  }
}
