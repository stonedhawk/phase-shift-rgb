export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  phaseRed: boolean;
  phaseGreen: boolean;
  phaseBlue: boolean;
}

export class InputManager {
  public state: InputState = {
    left: false,
    right: false,
    jump: false,
    phaseRed: false,
    phaseGreen: false,
    phaseBlue: false,
  };

  private activeKeys = new Set<string>();

  /**
   * Attach keyboard event listeners to the global window object.
   * Intercepts default scrolling behaviors on standard game keys (Space/Arrows).
   */
  public setup() {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  /**
   * Detach keyboard event listeners from the window to prevent leaks.
   */
  public cleanup() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Intercept scroll-blocking keys to prevent default window scrolling behavior
    const scrollBlockingKeys = ['Space', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (scrollBlockingKeys.includes(e.key) || scrollBlockingKeys.includes(e.code)) {
      e.preventDefault();
    }

    this.activeKeys.add(e.code);
    this.activeKeys.add(e.key);
    this.updateState();
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.activeKeys.delete(e.code);
    this.activeKeys.delete(e.key);
    this.updateState();
  };

  private updateState() {
    this.state.left =
      this.activeKeys.has('ArrowLeft') ||
      this.activeKeys.has('KeyA') ||
      this.activeKeys.has('a') ||
      this.activeKeys.has('A');

    this.state.right =
      this.activeKeys.has('ArrowRight') ||
      this.activeKeys.has('KeyD') ||
      this.activeKeys.has('d') ||
      this.activeKeys.has('D');

    this.state.jump =
      this.activeKeys.has('Space') ||
      this.activeKeys.has(' ') ||
      this.activeKeys.has('ArrowUp') ||
      this.activeKeys.has('KeyW') ||
      this.activeKeys.has('w') ||
      this.activeKeys.has('W');

    this.state.phaseRed = this.activeKeys.has('Digit1') || this.activeKeys.has('1');
    this.state.phaseGreen = this.activeKeys.has('Digit2') || this.activeKeys.has('2');
    this.state.phaseBlue = this.activeKeys.has('Digit3') || this.activeKeys.has('3');
  }
}
