import { TextEncoder } from 'util';
import { TelemetryClient } from '../TelemetryClient';
import { ColorState } from '../../types/Chromatic';
import { DeathEvent } from '../TelemetryTypes';

describe('Zero-Latency Telemetry Subsystem', () => {
  let mockFetch: jest.Mock;
  let originalFetch: typeof fetch;
  let originalEnv: NodeJS.ProcessEnv;
  let originalCrypto: typeof globalThis.crypto | undefined;

  beforeAll(() => {
    originalFetch = global.fetch;
    originalEnv = process.env;
    originalCrypto = globalThis.crypto;

    if (typeof globalThis.TextEncoder === 'undefined') {
      Object.defineProperty(globalThis, 'TextEncoder', {
        value: TextEncoder,
        configurable: true,
        writable: true,
      });
    }
  });

  beforeEach(() => {
    // Setup mock Web Crypto API
    const mockCrypto = {
      subtle: {
        digest: jest.fn().mockImplementation(() => {
          // Return a fixed mocked SHA-256 buffer [1, 2, 3, 4] -> hex string "01020304"
          return Promise.resolve(new Uint8Array([1, 2, 3, 4]).buffer);
        }),
      },
      randomUUID: () => 'mocked-uuid-1234',
    };

    Object.defineProperty(globalThis, 'crypto', {
      value: mockCrypto,
      writable: true,
      configurable: true,
    });

    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'crypto', {
        value: mockCrypto,
        writable: true,
        configurable: true,
      });
    }

    // Setup a mock fetch resolver
    mockFetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as unknown as Response)
    );
    global.fetch = mockFetch;
    
    // Set a mock environment endpoint
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_TELEMETRY_ENDPOINT: 'https://api.example.com/telemetry',
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      writable: true,
      configurable: true,
    });
  });

  test('should queue death and level complete events correctly', () => {
    // Disable interval flushes by setting time extremely large or not starting JSDOM clock
    const client = new TelemetryClient(100000);

    // Track a death event
    client.trackDeath({
      x: 100,
      y: 200,
      levelIndex: 0,
      activeColor: ColorState.RED,
      timeAlive: 5000,
    });

    const queue = client.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe('DEATH');
    
    const deathEvent = queue[0] as DeathEvent;
    expect(deathEvent.x).toBe(100);
    expect(deathEvent.y).toBe(200);
    expect(deathEvent.sessionId).toBe('mocked-uuid-1234');
    expect(queue[0].timestamp).toBeLessThanOrEqual(Date.now());

    client.cleanup();
  });

  test('should flush automatically on level completion', async () => {
    const client = new TelemetryClient(100000);

    // Mock fetch resolution is instant
    client.trackLevelComplete({
      levelIndex: 1,
      totalTime: 12500,
      phaseShiftCount: 8,
    });

    // Await micro-tasks to guarantee that asynchronous signatures and fetch resolve
    await new Promise((resolve) => setTimeout(resolve, 0));

    // The queue should immediately clear after a synchronous victory transition flush
    expect(client.getQueue().length).toBe(0);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.length).toBe(1);
    expect(callBody[0].type).toBe('LEVEL_COMPLETE');
    expect(callBody[0].levelIndex).toBe(1);
    expect(callBody[0].totalTime).toBe(12500);
    expect(callBody[0].phaseShiftCount).toBe(8);
    expect(callBody[0].sessionId).toBe('mocked-uuid-1234');

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders['Content-Type']).toBe('application/json');
    expect(callHeaders['x-telemetry-signature']).toBe('01020304');

    client.cleanup();
  });

  test('should batch queue items and periodic flush on timer intervals', async () => {
    jest.useFakeTimers();
    
    // Set a brief 2-second interval flush timer
    const client = new TelemetryClient(2000);

    // Accumulate multiple death runs
    client.trackDeath({ x: 50, y: 80, levelIndex: 0, activeColor: ColorState.GREEN, timeAlive: 3000 });
    client.trackDeath({ x: 120, y: 140, levelIndex: 0, activeColor: ColorState.BLUE, timeAlive: 4500 });

    expect(client.getQueue().length).toBe(2);
    expect(mockFetch).not.toHaveBeenCalled();

    // Fast-forward timers by 2 seconds
    jest.advanceTimersByTime(2000);

    // Allow signature promise microtasks to flush
    jest.useRealTimers();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Telemetry queue is flushed to server asynchronously
    expect(client.getQueue().length).toBe(0);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.length).toBe(2);
    expect(callBody[0].type).toBe('DEATH');
    expect(callBody[1].type).toBe('DEATH');
    expect(callBody[0].sessionId).toBe('mocked-uuid-1234');
    expect(callBody[1].sessionId).toBe('mocked-uuid-1234');

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders['x-telemetry-signature']).toBe('01020304');

    client.cleanup();
  });

  test('should log simulated payloads without throwing if no telemetry endpoint is configured', async () => {
    // Delete the endpoint to simulate offline sandbox environments
    delete process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT;
    const client = new TelemetryClient(100000);

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    client.trackDeath({ x: 10, y: 20, levelIndex: 0, activeColor: ColorState.RED, timeAlive: 100 });
    
    // Synchronous simulated flush
    await client.flush();

    expect(client.getQueue().length).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();

    logSpy.mockRestore();
    client.cleanup();
  });

  test('should silently catch fetch promise rejections to prevent blocking main gameplay ticks', async () => {
    // Force a network failure rejection
    mockFetch.mockImplementation(() => Promise.reject(new Error('Network offline')));
    
    const client = new TelemetryClient(100000);
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    client.trackDeath({ x: 0, y: 0, levelIndex: 0, activeColor: ColorState.RED, timeAlive: 10 });
    
    // Asynchronous network flush
    await client.flush();

    // The call completed, swallowed error, and console captured log warning silently
    expect(client.getQueue().length).toBe(0);
    expect(errSpy).toHaveBeenCalled();

    errSpy.mockRestore();
    client.cleanup();
  });
});
