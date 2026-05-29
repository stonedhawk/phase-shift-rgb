import { GameEngine } from '../GameEngine';

describe('GameEngine', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;
  let rafCallbacks: FrameRequestCallback[] = [];
  let nextRafId = 1;

  beforeEach(() => {
    // Clear callbacks and mocks
    rafCallbacks = [];
    nextRafId = 1;

    // Mock HTMLCanvasElement and CanvasRenderingContext2D
    mockContext = {
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      setLineDash: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      translate: jest.fn(),
      fillStyle: '',
      strokeStyle: '',
      font: '',
      textAlign: '',
      textBaseline: '',
      lineWidth: 0,
      canvas: null as unknown as HTMLCanvasElement,
    } as unknown as CanvasRenderingContext2D;

    mockCanvas = {
      getContext: jest.fn().mockReturnValue(mockContext),
      width: 800,
      height: 600,
    } as unknown as HTMLCanvasElement;

    // Connect context canvas circular reference
    mockContext.canvas = mockCanvas;

    // Mock requestAnimationFrame and cancelAnimationFrame
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return nextRafId++;
    });

    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => {
      // Find callback or clear
      rafCallbacks = [];
    });

    // Mock console.log to prevent test output clutter
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should initialize context correctly', () => {
    const engine = new GameEngine({ canvas: mockCanvas });
    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    expect(engine.targetFps).toBe(60);
    expect(engine.dt).toBeCloseTo(16.6667, 4);
  });

  test('should throw error if 2D context is missing', () => {
    (mockCanvas.getContext as jest.Mock).mockReturnValue(null);
    expect(() => new GameEngine({ canvas: mockCanvas })).toThrow('Failed to get 2D canvas context');
  });

  test('should run tick loop with correct timing accumulator', () => {
    const engine = new GameEngine({ canvas: mockCanvas });
    
    // Mock performance.now to control elapsed time
    let mockTime = 1000;
    jest.spyOn(performance, 'now').mockImplementation(() => mockTime);

    engine.start();
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(rafCallbacks.length).toBe(1);

    // Initial tick, no elapsed time yet
    const loopFn = rafCallbacks[0];
    loopFn(1000); // currentTime = 1000ms

    expect(engine.ticks).toBe(0);

    // Let's advance time by 51ms (currentTime = 1051ms)
    // 51ms guarantees 3 ticks (3 * 16.6667ms = 50.0ms) without floating-point threshold edge case
    mockTime = 1051;
    loopFn(1051);

    expect(engine.ticks).toBe(3);
    expect(engine.totalTime).toBeCloseTo(3 * 16.6667, 2);

    // Stop engine
    engine.stop();
  });
});
