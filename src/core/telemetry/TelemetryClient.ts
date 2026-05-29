import { TelemetryEvent, DeathEvent, LevelCompleteEvent } from './TelemetryTypes';

export class TelemetryClient {
  private queue: TelemetryEvent[] = [];
  private flushIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly endpoint: string;

  constructor(flushIntervalMs: number = 5000) {
    // Read the serverless backend endpoint from environment variables
    this.endpoint = process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT || '';

    if (typeof window !== 'undefined') {
      this.flushIntervalId = setInterval(() => {
        // Suppress unresolved promises returned from interval triggers
        this.flush().catch(() => {});
      }, flushIntervalMs);
    }
  }

  /**
   * Exposes raw queued events strictly for unit test assertions.
   */
  public getQueue(): TelemetryEvent[] {
    return this.queue;
  }

  /**
   * Queues an analytical player death event.
   */
  public trackDeath(event: Omit<DeathEvent, 'type' | 'timestamp'>) {
    const fullEvent: DeathEvent = {
      ...event,
      type: 'DEATH',
      timestamp: Date.now(),
    };
    this.queue.push(fullEvent);
  }

  /**
   * Queues an analytical player level completion event and immediately flushes the queue.
   */
  public trackLevelComplete(event: Omit<LevelCompleteEvent, 'type' | 'timestamp'>) {
    const fullEvent: LevelCompleteEvent = {
      ...event,
      type: 'LEVEL_COMPLETE',
      timestamp: Date.now(),
    };
    this.queue.push(fullEvent);
    // Suppress unhandled promise inside fire-and-forget syncs
    this.flush().catch(() => {});
  }

  /**
   * Asynchronously pushes the queued event batch to the endpoint using a fire-and-forget fetch.
   * Runs asynchronously in the browser I/O pool to secure a zero-latency gameplay loop.
   */
  public flush(): Promise<void> {
    if (this.queue.length === 0) {
      return Promise.resolve();
    }

    if (!this.endpoint) {
      // Log silently to console for offline sandbox runs and local debugging
      console.log('[TelemetryClient] Off-grid batch flush (Simulated):\n', JSON.stringify(this.queue, null, 2));
      this.queue = [];
      return Promise.resolve();
    }

    const batch = [...this.queue];
    this.queue = [];

    // Asynchronous fire-and-forget HTTP POST request, caught silently to avoid loop blockages
    return fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    })
      .then((response) => {
        if (!response.ok) {
          console.warn(`[TelemetryClient] Server returned status ${response.status} during flush.`);
        }
      })
      .catch((error) => {
        console.error('[TelemetryClient] Asynchronous flush delivery failed:', error);
      });
  }

  /**
   * Flushes any remaining queue items and halts periodic timers to avoid memory leaks.
   */
  public cleanup() {
    this.flush().catch(() => {});
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
      this.flushIntervalId = null;
    }
  }
}
