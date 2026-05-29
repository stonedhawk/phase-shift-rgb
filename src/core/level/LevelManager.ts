import { LevelParser, LevelData } from './LevelParser';
import { LevelBounds } from '../render/Camera';

export interface LevelPack {
  level: LevelData;
  bounds: LevelBounds;
  index: number;
}

export class LevelManager {
  private levels: string[] = [];
  private boundsList: LevelBounds[] = [];
  public currentLevelIndex = 0;

  // Level 1: original single-screen puzzle stage
  private static readonly STAGE_1_SCHEMA = JSON.stringify({
    spawnX: 100,
    spawnY: 100,
    platforms: [
      { x: 0, y: 560, width: 800, height: 40, colorState: 'RED', type: 'SOLID' },
      { x: 150, y: 440, width: 150, height: 20, colorState: 'BLUE', type: 'SOLID' },
      { x: 500, y: 440, width: 150, height: 20, colorState: 'GREEN', type: 'SOLID' },
      { x: 300, y: 320, width: 200, height: 20, colorState: 'RED', type: 'SOLID' },
      { x: 350, y: 540, width: 100, height: 20, colorState: 'RED', type: 'HAZARD' },
      { x: 720, y: 160, width: 50, height: 60, colorState: 'BLUE', type: 'GOAL' },
      { x: 700, y: 220, width: 100, height: 20, colorState: 'BLUE', type: 'SOLID' }
    ]
  });

  // Level 2: vertical-scrolling tower synchronization puzzle stage (height: 1200px)
  private static readonly STAGE_2_SCHEMA = JSON.stringify({
    spawnX: 100,
    spawnY: 1050,
    platforms: [
      // Ground foundation
      { x: 0, y: 1160, width: 800, height: 40, colorState: 'RED', type: 'SOLID' },
      { x: 300, y: 1140, width: 200, height: 20, colorState: 'RED', type: 'HAZARD' },
      
      // Rising geometric puzzle ledges
      { x: 150, y: 950, width: 150, height: 20, colorState: 'BLUE', type: 'SOLID' },
      { x: 500, y: 800, width: 150, height: 20, colorState: 'GREEN', type: 'SOLID' },
      { x: 300, y: 650, width: 200, height: 20, colorState: 'RED', type: 'SOLID' },
      { x: 100, y: 500, width: 150, height: 20, colorState: 'GREEN', type: 'SOLID' },
      { x: 550, y: 360, width: 150, height: 20, colorState: 'BLUE', type: 'SOLID' },
      
      // Goal Portal Ledge (high vertical elevation)
      { x: 350, y: 150, width: 100, height: 60, colorState: 'RED', type: 'GOAL' },
      { x: 300, y: 210, width: 200, height: 20, colorState: 'RED', type: 'SOLID' }
    ]
  });

  constructor() {
    this.levels = [LevelManager.STAGE_1_SCHEMA, LevelManager.STAGE_2_SCHEMA];
    this.boundsList = [
      { width: 800, height: 600 },
      { width: 800, height: 1200 },
    ];
  }

  /**
   * Resets active index coordinates and loads dynamic stage profiles.
   * 
   * @param index Level pack selector index
   */
  public loadLevel(index: number): LevelPack | null {
    if (index < 0 || index >= this.levels.length) {
      return null;
    }

    this.currentLevelIndex = index;
    const parsedLevel = LevelParser.parse(this.levels[index]);
    const bounds = this.boundsList[index];

    return {
      level: parsedLevel,
      bounds,
      index,
    };
  }

  /**
   * Increments active index pointer and attempts to load the next level.
   * If no stages remain, returns null.
   */
  public loadNextLevel(): LevelPack | null {
    return this.loadLevel(this.currentLevelIndex + 1);
  }

  /**
   * Helper returning level count.
   */
  public getLevelCount(): number {
    return this.levels.length;
  }
}
