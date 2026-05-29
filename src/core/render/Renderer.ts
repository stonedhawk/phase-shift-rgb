import { Player } from '../entities/Player';
import { LevelData, PlatformData } from '../level/LevelParser';
import { ColorState } from '../types/Chromatic';

export class Renderer {
  // Hex color constants for premium retro-arcade glow styling
  private static readonly COLOR_MAP = {
    [ColorState.RED]: {
      solid: '#f43f5e',      // Rose neon
      glow: 'rgba(244, 63, 94, 0.4)',
    },
    [ColorState.GREEN]: {
      solid: '#10b981',    // Emerald neon
      glow: 'rgba(16, 185, 129, 0.4)',
    },
    [ColorState.BLUE]: {
      solid: '#3b82f6',     // Blue neon
      glow: 'rgba(59, 130, 246, 0.4)',
    },
  };

  private static readonly STAGE_BACKGROUND = '#0a0f1d'; // Premium ultra-dark slate

  /**
   * Decoupled Canvas draw pipeline utilizing linear render interpolations.
   * 
   * @param ctx The Target HTML5 Canvas 2D Rendering Context
   * @param player Dynamic Player Entity
   * @param level Static parsed platform list data
   * @param interpolation Linear fractional factor [0, 1] representing tick offsets
   */
  public static draw(
    ctx: CanvasRenderingContext2D,
    player: Player,
    level: LevelData,
    interpolation: number
  ) {
    const width = ctx.canvas ? ctx.canvas.width : 800;
    const height = ctx.canvas ? ctx.canvas.height : 600;

    // 1. Reset Context / Clear Canvas
    ctx.fillStyle = this.STAGE_BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    // Save initial rendering context state
    ctx.save();

    // 2. Draw Platforms (Environment)
    level.platforms.forEach((platform) => {
      this.drawPlatform(ctx, platform, player.colorState);
    });

    // 3. Draw Player
    this.drawPlayer(ctx, player, interpolation);

    // Restore context
    ctx.restore();
  }

  private static drawPlatform(
    ctx: CanvasRenderingContext2D,
    platform: PlatformData,
    playerColor: ColorState
  ) {
    const colors = this.COLOR_MAP[platform.colorState];
    const isPhased = platform.colorState === playerColor;

    ctx.save();

    if (isPhased) {
      // Platform is matched with player state: phase through indicator (dashed & faded opacity)
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = colors.solid;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);

      // Light internal hatch lines to signal passability
      ctx.fillStyle = colors.solid;
      ctx.globalAlpha = 0.05;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    } else {
      // Solid active obstacle: render premium solid fill + glow
      ctx.shadowColor = colors.solid;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.strokeStyle = colors.solid;

      // Dark solid background fill to look premium
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    }

    ctx.restore();
  }

  private static drawPlayer(
    ctx: CanvasRenderingContext2D,
    player: Player,
    interpolation: number
  ) {
    // Apply visual decoupling: project position between the last and current physics frame
    const renderX = (player.x - player.prevX) * interpolation + player.prevX;
    const renderY = (player.y - player.prevY) * interpolation + player.prevY;

    const colors = this.COLOR_MAP[player.colorState];

    ctx.save();

    // Premium neon player outline & shadow styling
    ctx.shadowColor = colors.solid;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = colors.solid;
    ctx.lineWidth = 3;
    ctx.fillStyle = '#1e293b'; // slate-800 core

    // Render rounded bounding box or standard rectangle
    ctx.fillRect(renderX, renderY, player.width, player.height);
    ctx.strokeRect(renderX, renderY, player.width, player.height);

    // Active center core glowing indicator
    ctx.fillStyle = colors.solid;
    ctx.shadowBlur = 0;
    const coreWidth = player.width * 0.4;
    const coreHeight = player.height * 0.3;
    const coreX = renderX + (player.width - coreWidth) / 2;
    const coreY = renderY + (player.height - coreHeight) / 2;
    ctx.fillRect(coreX, coreY, coreWidth, coreHeight);

    ctx.restore();
  }
}
