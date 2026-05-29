import { TelemetryEvent, DeathEvent, LevelCompleteEvent } from './TelemetryTypes';

export class TelemetryClient {
  private queue: TelemetryEvent[] = [];
  private flushIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly endpoint: string;
  public readonly sessionId: string;

  constructor(flushIntervalMs: number = 5000) {
    // Read the serverless backend endpoint from environment variables
    this.endpoint = process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT || '';

    // Initialize session ID with cryptographically secure values, falling back safely for SSR/Node builds
    if (typeof window !== 'undefined' && typeof window.crypto !== 'undefined') {
      if (typeof window.crypto.randomUUID === 'function') {
        this.sessionId = window.crypto.randomUUID();
      } else {
        const array = new Uint32Array(4);
        window.crypto.getRandomValues(array);
        this.sessionId = Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('-');
      }
    } else {
      this.sessionId = 'server-side-static-session';
    }

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
  public trackDeath(event: Omit<DeathEvent, 'type' | 'timestamp' | 'sessionId'>) {
    const fullEvent: DeathEvent = {
      ...event,
      type: 'DEATH',
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };
    this.queue.push(fullEvent);
  }

  /**
   * Queues an analytical player level completion event and immediately flushes the queue.
   */
  public trackLevelComplete(event: Omit<LevelCompleteEvent, 'type' | 'timestamp' | 'sessionId'>) {
    const fullEvent: LevelCompleteEvent = {
      ...event,
      type: 'LEVEL_COMPLETE',
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };
    this.queue.push(fullEvent);
    // Suppress unhandled promise inside fire-and-forget syncs
    this.flush().catch(() => {});
  }

  /**
   * Generates a cryptographic SHA-256 signature hash of the JSON payload string using Web Crypto Subtle API.
   * Safe for Server-Side Rendering (SSR) and Next.js static builds, defaulting to a mock signature.
   */
  private async generateSignature(payloadString: string): Promise<string> {
    if (
      typeof window === 'undefined' ||
      typeof window.crypto === 'undefined' ||
      typeof window.crypto.subtle === 'undefined'
    ) {
      return 'mock-signature';
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(payloadString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('[TelemetryClient] Crypto signature generation failed, using fallback:', e);
      return 'fallback-signature';
    }
  }

  /**
   * Asynchronously pushes the queued event batch to the endpoint using a fire-and-forget fetch.
   * Runs asynchronously in the browser I/O pool to secure a zero-latency gameplay loop.
   */
  public async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    if (!this.endpoint) {
      // Log silently to console for offline sandbox runs and local debugging
      console.log('[TelemetryClient] Off-grid batch flush (Simulated):\n', JSON.stringify(this.queue, null, 2));
      this.queue = [];
      return;
    }

    const batch = [...this.queue];
    this.queue = [];

    const payloadString = JSON.stringify(batch);
    const signature = await this.generateSignature(payloadString);

    // Asynchronous fire-and-forget HTTP POST request, caught silently to avoid loop blockages
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telemetry-signature': signature,
        },
        body: payloadString,
      });
      if (!response.ok) {
        console.warn(`[TelemetryClient] Server returned status ${response.status} during flush.`);
      }
    } catch (error) {
      console.error('[TelemetryClient] Asynchronous flush delivery failed:', error);
    }
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
