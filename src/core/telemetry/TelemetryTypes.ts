export interface DeathEvent {
  type: 'DEATH';
  x: number;
  y: number;
  levelIndex: number;
  activeColor: string;
  timeAlive: number; // in milliseconds
  timestamp: number;
}

export interface LevelCompleteEvent {
  type: 'LEVEL_COMPLETE';
  levelIndex: number;
  totalTime: number; // in milliseconds
  phaseShiftCount: number;
  timestamp: number;
}

export type TelemetryEvent = DeathEvent | LevelCompleteEvent;
