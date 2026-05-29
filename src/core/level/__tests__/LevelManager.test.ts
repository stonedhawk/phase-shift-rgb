import { LevelManager } from '../LevelManager';

describe('LevelManager Stage Progression', () => {
  let levelManager: LevelManager;

  beforeEach(() => {
    levelManager = new LevelManager();
  });

  test('should load first level configuration correctly', () => {
    const stage = levelManager.loadLevel(0);
    expect(stage).not.toBeNull();
    expect(stage!.index).toBe(0);
    expect(stage!.bounds).toEqual({ width: 800, height: 600 });
    expect(stage!.level.platforms.length).toBeGreaterThan(0);
    expect(levelManager.currentLevelIndex).toBe(0);
  });

  test('should increment index and load second level on progression', () => {
    // Load first level
    levelManager.loadLevel(0);

    // Progression
    const stage = levelManager.loadNextLevel();
    expect(stage).not.toBeNull();
    expect(stage!.index).toBe(1);
    expect(stage!.bounds).toEqual({ width: 800, height: 1200 }); // Stage 2 vertical climb stage
    expect(levelManager.currentLevelIndex).toBe(1);
  });

  test('should return null when indexing exceeds final level packs', () => {
    // Load last stage
    const totalLevels = levelManager.getLevelCount();
    levelManager.loadLevel(totalLevels - 1);

    // Progress beyond total
    const stage = levelManager.loadNextLevel();
    expect(stage).toBeNull();
  });

  test('should return null for negative level indices', () => {
    const stage = levelManager.loadLevel(-1);
    expect(stage).toBeNull();
  });
});
