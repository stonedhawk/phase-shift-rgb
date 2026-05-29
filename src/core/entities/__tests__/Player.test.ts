import { Player } from '../Player';
import { ColorState } from '../../types/Chromatic';
import { InputState } from '../../input/InputManager';
import { PhysicsConfig } from '../../config/PhysicsConfig';

describe('Player Dynamics & Input Controllers', () => {
  let player: Player;
  let blankInput: InputState;

  beforeEach(() => {
    player = new Player(0, 0, 32, 48);
    blankInput = {
      left: false,
      right: false,
      jump: false,
      phaseRed: false,
      phaseGreen: false,
      phaseBlue: false,
    };
  });

  test('should accumulate gravity and fall', () => {
    // Player starts stationary at (0,0)
    expect(player.vy).toBe(0);

    // Run 1 tick equivalent (16.67ms)
    player.update(16.6667, blankInput);

    // Gravity should increase vy
    const expectedVy = PhysicsConfig.GRAVITY * 16.6667;
    expect(player.vy).toBeCloseTo(expectedVy, 4);
    expect(player.y).toBeCloseTo(expectedVy * 16.6667, 4);
  });

  test('should clamp horizontal velocity to terminal threshold speed limits', () => {
    const rightInput = { ...blankInput, right: true };

    // Apply multiple large ticks to force speed accumulation
    for (let i = 0; i < 20; i++) {
      player.update(50, rightInput);
    }

    expect(player.vx).toBe(PhysicsConfig.TERMINAL_VELOCITY_X);
  });

  test('should clamp falling speed to terminal velocity', () => {
    // Apply multiple large gravity ticks
    for (let i = 0; i < 20; i++) {
      player.update(100, blankInput);
    }

    expect(player.vy).toBe(PhysicsConfig.TERMINAL_VELOCITY_Y);
  });

  test('should jump only when player is grounded', () => {
    const jumpInput = { ...blankInput, jump: true };

    // 1. In Air: Cannot jump
    player.isGrounded = false;
    player.vy = 0;
    player.update(16.6667, jumpInput);

    // vy should only accumulate gravity, not the jump impulse
    expect(player.vy).toBeGreaterThan(0);
    expect(player.vy).toBeCloseTo(PhysicsConfig.GRAVITY * 16.6667, 4);

    // 2. Grounded: Jump impulse is applied!
    player.isGrounded = true;
    player.vy = 0;
    player.update(16.6667, jumpInput);

    // vy should equal exactly the jump impulse override
    const expectedJumpVy = PhysicsConfig.JUMP_IMPULSE;
    expect(player.vy).toBe(expectedJumpVy);
    expect(player.isGrounded).toBe(false); // Player is launched in the air
  });

  test('should immediately mutate chromatic states upon selecting phase key numbers', () => {
    expect(player.colorState).toBe(ColorState.RED); // Initial

    // Toggle 2 (Green)
    player.update(16.6667, { ...blankInput, phaseGreen: true });
    expect(player.colorState).toBe(ColorState.GREEN);

    // Toggle 3 (Blue)
    player.update(16.6667, { ...blankInput, phaseBlue: true });
    expect(player.colorState).toBe(ColorState.BLUE);

    // Toggle 1 (Red)
    player.update(16.6667, { ...blankInput, phaseRed: true });
    expect(player.colorState).toBe(ColorState.RED);
  });

  test('should damp upward velocity when jump input is released while ascending', () => {
    // 1. Grounded & trigger jump
    player.isGrounded = true;
    player.update(16.6667, { ...blankInput, jump: true });
    expect(player.vy).toBe(PhysicsConfig.JUMP_IMPULSE); // vy = -0.45

    // 2. Release jump button during ascent (vy < 0)
    // Next update, jump button is released (blankInput)
    player.update(16.6667, blankInput);

    // Expected vy: (-0.45 + gravity * 16.67) * 0.5
    const accumulatedGravityVy = PhysicsConfig.JUMP_IMPULSE + PhysicsConfig.GRAVITY * 16.6667;
    const expectedDampedVy = accumulatedGravityVy * 0.5;

    expect(player.vy).toBeCloseTo(expectedDampedVy, 4);
    expect(player.hasJumpBeenCut).toBe(true);

    // 3. Ensure jump is only cut once per jump cycle
    const currentVy = player.vy;
    player.update(16.6667, blankInput);

    // Second tick: vy should accumulate gravity normally, NOT cut by another 50%
    const expectedVyTick3 = currentVy + PhysicsConfig.GRAVITY * 16.6667;
    expect(player.vy).toBeCloseTo(expectedVyTick3, 4);
  });
});
