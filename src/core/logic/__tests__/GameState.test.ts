import { GameEngine } from '../../GameEngine';
import { GameState } from '../GameState';
import { ColorState } from '../../types/Chromatic';

describe('GameState Machine Logic', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    mockContext = {
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      setLineDash: jest.fn(),
      fillStyle: '',
      strokeStyle: '',
      font: '',
      textAlign: '',
      textBaseline: '',
      lineWidth: 0,
    } as unknown as CanvasRenderingContext2D;

    mockCanvas = {
      getContext: jest.fn().mockReturnValue(mockContext),
      width: 800,
      height: 600,
    } as unknown as HTMLCanvasElement;

    mockContext.canvas = mockCanvas;

    // Mock console.log
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should start in GameState.START', () => {
    const engine = new GameEngine({ canvas: mockCanvas });
    expect(engine.state).toBe(GameState.START);
  });

  test('should transition from START to PLAYING upon jump input', () => {
    const engine = new GameEngine({ canvas: mockCanvas });
    engine.inputManager.state.jump = true;

    // Trigger update tick
    engine['update'](16.6667);

    expect(engine.state).toBe(GameState.PLAYING);
    expect(engine.player.x).toBe(engine.level.spawnX);
    expect(engine.player.y).toBe(engine.level.spawnY);
  });

  test('should transition to DEAD when player hits a HAZARD', () => {
    const engine = new GameEngine({ canvas: mockCanvas });
    engine.state = GameState.PLAYING;

    // Manually overlap player with a hazard spikes platform
    engine.level.platforms.push({ x: 350, y: 540, width: 100, height: 20, colorState: ColorState.RED, type: 'HAZARD' });
    engine.player.x = 360;
    engine.player.y = 530; // overlaps spikes

    engine['update'](16.6667);

    expect(engine.state).toBe(GameState.DEAD);
  });

  test('should transition to VICTORY when player hits a GOAL', () => {
    const engine = new GameEngine({ canvas: mockCanvas });
    engine.state = GameState.PLAYING;

    // Manually overlap player with a goal portal platform
    engine.level.platforms.push({ x: 720, y: 160, width: 50, height: 60, colorState: ColorState.BLUE, type: 'GOAL' });
    engine.player.x = 730;
    engine.player.y = 170; // overlaps goal

    engine['update'](16.6667);

    expect(engine.state).toBe(GameState.VICTORY);
  });

  test('should reboot back to PLAYING from DEAD/VICTORY states', () => {
    const engine = new GameEngine({ canvas: mockCanvas });
    
    // 1. Reboot from DEAD
    engine.state = GameState.DEAD;
    engine.inputManager.state.jump = true;
    engine['update'](16.6667);
    expect(engine.state).toBe(GameState.PLAYING);

    // 2. Reboot from VICTORY
    engine.state = GameState.VICTORY;
    engine.inputManager.state.jump = true;
    engine['update'](16.6667);
    expect(engine.state).toBe(GameState.PLAYING);
  });
});
