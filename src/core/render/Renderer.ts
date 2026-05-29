import { Player } from '../entities/Player';
import { LevelData, PlatformData } from '../level/LevelParser';
import { ColorState } from '../types/Chromatic';
import { GameState } from '../logic/GameState';
import { Camera } from './Camera';

export class Renderer {
  // Hex color constants for premium retro-arcade glow styling (shadows removed for massive CPU gain)
  private static readonly COLOR_MAP = {
    [ColorState.RED]: '#f43f5e',      // Rose neon
    [ColorState.GREEN]: '#10b981',    // Emerald neon
    [ColorState.BLUE]: '#3b82f6',     // Blue neon
  };

  private static readonly HAZARD_COLOR = '#ef4444'; // Bright warning red
  private static readonly GOAL_COLOR = '#f59e0b';   // Gold neon portal
  private static readonly STAGE_BACKGROUND = '#030712'; // Slate-950 ultra-dark

  /**
   * Decoupled Canvas draw pipeline utilizing linear render interpolations and scroll translations.
   * 
   * @param ctx The Target HTML5 Canvas 2D Rendering Context
   * @param player Dynamic Player Entity
   * @param level Static parsed platform list data
   * @param interpolation Linear fractional factor [0, 1] representing tick offsets
   * @param gameState Current game loop state machine status
   * @param camera Tracking camera system viewport
   */
  public static draw(
    ctx: CanvasRenderingContext2D,
    player: Player,
    level: LevelData,
    interpolation: number,
    gameState: GameState = GameState.PLAYING,
    camera?: Camera
  ) {
    const width = ctx.canvas ? ctx.canvas.width : 800;
    const height = ctx.canvas ? ctx.canvas.height : 600;

    // 1. Reset Context / Clear Canvas
    ctx.fillStyle = this.STAGE_BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    // Save context before viewport scroll translations
    ctx.save();

    if (camera) {
      // Apply integer translation to prevent sub-pixel rendering blur on entities
      ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));
    }

    // 2. Draw Platforms (Environment)
    level.platforms.forEach((platform) => {
      this.drawPlatform(ctx, platform, player.colorState);
    });

    // 3. Draw Player (Only if not dead / in victory screens, or draw faded)
    if (gameState === GameState.PLAYING || gameState === GameState.VICTORY) {
      this.drawPlayer(ctx, player, interpolation);
    }

    // Restore coordinate transformations to draw static overlays
    ctx.restore();

    // 4. Draw Overlay States for UI feedback (renders at static screen coords)
    this.drawUIOverlay(ctx, gameState, width, height);
  }

  private static drawPlatform(
    ctx: CanvasRenderingContext2D,
    platform: PlatformData,
    playerColor: ColorState
  ) {
    ctx.save();

    const isPhased = platform.colorState === playerColor && platform.type === 'SOLID';

    if (platform.type === 'HAZARD') {
      // HAZARD platform: draw warning spikes or orange warning boxes
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.HAZARD_COLOR;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; // faint hazard fill
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);

      // Warning hash lines inside hazards
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(platform.x, platform.y);
      ctx.lineTo(platform.x + platform.width, platform.y + platform.height);
      ctx.stroke();
    } else if (platform.type === 'GOAL') {
      // GOAL platform: draw glowing gold portals
      ctx.lineWidth = 3;
      ctx.strokeStyle = this.GOAL_COLOR;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);

      // Portal inner ring indicator
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.strokeRect(
        platform.x + 4,
        platform.y + 4,
        platform.width - 8,
        platform.height - 8
      );
    } else {
      // Standard SOLID platform
      const color = this.COLOR_MAP[platform.colorState];

      if (isPhased) {
        // Matched with player: phase through indicator (dashed & faded opacity)
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.05;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      } else {
        // Solid active barrier: clean high-performance double-borders
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.fillStyle = '#0f172a'; // slate-900 core
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);

        // Subtly lighter inner accent frame for premium texture
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeRect(
          platform.x + 3,
          platform.y + 3,
          platform.width - 6,
          platform.height - 6
        );
      }
    }

    ctx.restore();
  }

  private static drawPlayer(
    ctx: CanvasRenderingContext2D,
    player: Player,
    interpolation: number
  ) {
    // Apply visual decoupling: project position between physical ticks
    const renderX = (player.x - player.prevX) * interpolation + player.prevX;
    const renderY = (player.y - player.prevY) * interpolation + player.prevY;

    const color = this.COLOR_MAP[player.colorState];

    ctx.save();

    // Sleek high-performance player styling (no CPU shadows)
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.fillStyle = '#1e293b'; // slate-800 core

    ctx.fillRect(renderX, renderY, player.width, player.height);
    ctx.strokeRect(renderX, renderY, player.width, player.height);

    // Active center core glowing indicator
    ctx.fillStyle = color;
    const coreWidth = player.width * 0.4;
    const coreHeight = player.height * 0.3;
    const coreX = renderX + (player.width - coreWidth) / 2;
    const coreY = renderY + (player.height - coreHeight) / 2;
    ctx.fillRect(coreX, coreY, coreWidth, coreHeight);

    ctx.restore();
  }

  private static drawUIOverlay(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    width: number,
    height: number
  ) {
    if (state === GameState.PLAYING) return;

    ctx.save();

    // Dark semi-transparent overlay screen
    ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 24px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

    if (state === GameState.START) {
      ctx.fillStyle = '#6366f1'; // Indigo title
      ctx.fillText('PHASE SHIFT: RGB', width / 2, height / 2 - 40);
      
      ctx.fillStyle = '#94a3b8'; // Slate subtitle
      ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillText('PRESS [ENTER] OR [SPACE] TO START GAME', width / 2, height / 2 + 10);
      
      ctx.fillStyle = '#475569';
      ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillText('CONTROLS: ARROWS / ASDW TO MOVE | 1, 2, 3 TO SWITCH COLORS', width / 2, height / 2 + 50);
    } else if (state === GameState.DEAD) {
      ctx.fillStyle = '#ef4444'; // Red alarm
      ctx.fillText('ANOMALY DETECTED: SYSTEM DISSOLVED', width / 2, height / 2 - 40);
      
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillText('PRESS [ENTER] TO REBOOT & RESPAWN', width / 2, height / 2 + 10);
    } else if (state === GameState.VICTORY) {
      ctx.fillStyle = '#f59e0b'; // Gold trophy
      ctx.fillText('CHROMATIC SYNC COMPLETED!', width / 2, height / 2 - 40);
      
      ctx.fillStyle = '#10b981';
      ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillText('STAGE PORTAL CLEARED CONGRATULATIONS', width / 2, height / 2 + 10);
      
      ctx.fillStyle = '#64748b';
      ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillText('PRESS [ENTER] TO REPLAY FROM START', width / 2, height / 2 + 50);
    }

    ctx.restore();
  }
}
