import { InputManager } from '../InputManager';

describe('InputManager Controls', () => {
  let inputManager: InputManager;
  let eventListeners: { [key: string]: EventListener } = {};

  beforeEach(() => {
    eventListeners = {};
    
    // Mock global window methods
    jest.spyOn(window, 'addEventListener').mockImplementation((event, callback) => {
      eventListeners[event] = callback as EventListener;
    });

    jest.spyOn(window, 'removeEventListener').mockImplementation((event, callback) => {
      delete eventListeners[event];
    });

    inputManager = new InputManager();
    inputManager.setup();
  });

  afterEach(() => {
    inputManager.cleanup();
    jest.restoreAllMocks();
  });

  test('should attach and detach listeners correctly', () => {
    expect(eventListeners['keydown']).toBeDefined();
    expect(eventListeners['keyup']).toBeDefined();

    inputManager.cleanup();
    expect(eventListeners['keydown']).toBeUndefined();
    expect(eventListeners['keyup']).toBeUndefined();
  });

  test('should map movement controls to state correctly', () => {
    const keydown = eventListeners['keydown'];
    const keyup = eventListeners['keyup'];

    // Test Left movement
    keydown(new KeyboardEvent('keydown', { code: 'ArrowLeft', key: 'ArrowLeft' }));
    expect(inputManager.state.left).toBe(true);
    keyup(new KeyboardEvent('keyup', { code: 'ArrowLeft', key: 'ArrowLeft' }));
    expect(inputManager.state.left).toBe(false);

    // Test Right movement
    keydown(new KeyboardEvent('keydown', { code: 'KeyD', key: 'd' }));
    expect(inputManager.state.right).toBe(true);
    keyup(new KeyboardEvent('keyup', { code: 'KeyD', key: 'd' }));
    expect(inputManager.state.right).toBe(false);

    // Test Jump controls
    keydown(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }));
    expect(inputManager.state.jump).toBe(true);
    keyup(new KeyboardEvent('keyup', { code: 'Space', key: ' ' }));
    expect(inputManager.state.jump).toBe(false);
  });

  test('should map Chromatic color state selectors correctly', () => {
    const keydown = eventListeners['keydown'];

    keydown(new KeyboardEvent('keydown', { code: 'Digit1', key: '1' }));
    expect(inputManager.state.phaseRed).toBe(true);

    keydown(new KeyboardEvent('keydown', { code: 'Digit2', key: '2' }));
    expect(inputManager.state.phaseGreen).toBe(true);

    keydown(new KeyboardEvent('keydown', { code: 'Digit3', key: '3' }));
    expect(inputManager.state.phaseBlue).toBe(true);
  });

  test('should block native browser scroll events for game input keys', () => {
    const keydown = eventListeners['keydown'];
    const mockPreventDefault = jest.fn();

    // Check Space key prevents scroll
    const mockSpaceEvent = {
      code: 'Space',
      key: ' ',
      preventDefault: mockPreventDefault,
    } as unknown as KeyboardEvent;
    keydown(mockSpaceEvent);
    
    expect(mockPreventDefault).toHaveBeenCalledTimes(1);

    // Check non-game keys do NOT prevent default scroll
    mockPreventDefault.mockClear();
    const mockNonGameEvent = {
      code: 'KeyP',
      key: 'p',
      preventDefault: mockPreventDefault,
    } as unknown as KeyboardEvent;
    keydown(mockNonGameEvent);

    expect(mockPreventDefault).not.toHaveBeenCalled();
  });
});
