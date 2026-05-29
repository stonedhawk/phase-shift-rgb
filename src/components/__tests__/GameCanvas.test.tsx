import React from 'react';
import { render } from '@testing-library/react';
import { GameCanvas } from '../GameCanvas';
import { GameEngine } from '@/core/GameEngine';

// Mock GameEngine to avoid canvas context issues and inspect lifecycle calls
jest.mock('@/core/GameEngine', () => {
  return {
    GameEngine: jest.fn().mockImplementation(() => {
      return {
        start: jest.fn(),
        stop: jest.fn(),
      };
    }),
  };
});

describe('GameCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders canvas element and initializes GameEngine', () => {
    const { container } = render(<GameCanvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    
    // Assert GameEngine was instantiated and started
    expect(GameEngine).toHaveBeenCalledTimes(1);
    const mockEngineInstance = (GameEngine as jest.Mock).mock.results[0].value;
    expect(mockEngineInstance.start).toHaveBeenCalledTimes(1);
  });

  test('cleans up and stops GameEngine on unmount', () => {
    const { unmount } = render(<GameCanvas />);
    expect(GameEngine).toHaveBeenCalledTimes(1);
    const mockEngineInstance = (GameEngine as jest.Mock).mock.results[0].value;
    
    unmount();
    expect(mockEngineInstance.stop).toHaveBeenCalledTimes(1);
  });
});
