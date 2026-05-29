export const PhysicsConfig = {
  // Forces per millisecond (for deterministic delta-time integration)
  GRAVITY: 0.0015,             // px/ms²
  JUMP_IMPULSE: -0.45,         // px/ms
  MOVE_ACCELERATION: 0.0012,   // px/ms²
  
  // Deceleration multipliers (applied per 16.67ms tick equivalent)
  GROUND_FRICTION: 0.85,
  AIR_DRAG: 0.95,
  
  // Speed clamping thresholds
  TERMINAL_VELOCITY_X: 0.25,   // px/ms
  TERMINAL_VELOCITY_Y: 0.60,   // px/ms
};
