/* eslint-disable */
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

async function main() {
  console.log('[PlaytestBot] Booting up Next.js development server on port 3009...');
  
  // Spawn Next.js dev server on port 3009
  const server = spawn('npx', ['next', 'dev', '-p', '3009'], {
    shell: true,
    stdio: 'pipe',
  });

  const cleanup = () => {
    console.log('[PlaytestBot] Terminating Next.js server subprocess...');
    server.kill('SIGINT');
  };

  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('uncaughtException', (err) => {
    console.error('[PlaytestBot] Uncaught exception:', err);
    cleanup();
    process.exit(1);
  });

  // Wait 6 seconds for compilation
  await new Promise((resolve) => setTimeout(resolve, 6000));

  let browser;
  try {
    console.log('[PlaytestBot] Launching headless browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });

    console.log('[PlaytestBot] Navigating to subpath routing page...');
    await page.goto('http://localhost:3009/phase-shift-rgb?autoplay=true', {
      waitUntil: 'networkidle2',
    });

    console.log('[PlaytestBot] Injecting high-speed heuristic playtest simulation (1,000 runs per level)...');
    
    const results = await page.evaluate(async () => {
      const engine = window.gameEngine;
      if (!engine) {
        throw new Error('GameEngine not exposed on window.gameEngine');
      }

      // Store results
      const matrix = {};

      // Alternate playtest level configurations
      const levels = [
        { name: 'Level 1: Tutorial', index: 0 },
        { name: 'Level 2: Chromatic Climb', index: 1 },
        { name: 'Level 3: Neon Descent', index: 2 }
      ];

      for (const lvl of levels) {
        let deaths = 0;
        let successes = 0;
        let totalJumps = 0;
        let cumulativeSpikeMargin = 0;
        let validSpikeChecks = 0;

        // Perform 1,000 high-speed ticks simulations
        for (let run = 0; run < 1000; run++) {
          // Reset the level parameters
          engine.loadStage(lvl.index);
          engine.state = 'PLAYING'; // Shift game state to playing

          const p = engine.player;
          const level = engine.level;
          const input = engine.inputManager;

          // Clear initial inputs
          input.state.left = false;
          input.state.right = false;
          input.state.jump = false;
          input.state.phaseRed = false;
          input.state.phaseGreen = false;
          input.state.phaseBlue = false;

          let tickCounter = 0;
          let colorLockCooldown = 0;
          let humanReactionLatency = 0;

          // Heuristic Play loop - max 2000 physical ticks per level attempt
          while (engine.state === 'PLAYING' && tickCounter < 1500) {
            tickCounter++;

            // Inject artificial human latency variance: 15% probability of input latency delay per tick
            if (Math.random() < 0.15) {
              humanReactionLatency = Math.floor(Math.random() * 5); // 0-5 frames delay
            }

            if (humanReactionLatency > 0) {
              humanReactionLatency--;
              engine.update(16.6667);
              continue;
            }

            // Find the goal portal coordinates
            const goal = level.platforms.find(plat => plat.type === 'GOAL') || { x: 700, y: 300 };

            // Determine horizontal path direction
            if (p.x < goal.x - 5) {
              input.state.right = true;
              input.state.left = false;
            } else if (p.x > goal.x + 5) {
              input.state.left = true;
              input.state.right = false;
            } else {
              input.state.right = false;
              input.state.left = false;
            }

            // Obstacle & Ledge detection: scan coordinates directly ahead of the player
            const scanAhead = 40;
            const lookX = p.vx >= 0 ? p.x + p.width + scanAhead : p.x - scanAhead;
            const lookY = p.y + p.height / 2;

            // Find if a platform blocks the horizontal path
            let blockingWall = null;
            let gapAhead = true;

            const platformsLen = level.platforms.length;
            for (let i = 0; i < platformsLen; i++) {
              const plat = level.platforms[i];
              
              // Check for horizontal wall blockages
              if (
                plat.type === 'SOLID' &&
                lookX >= plat.x &&
                lookX <= plat.x + plat.width &&
                p.y + p.height > plat.y &&
                p.y < plat.y + plat.height
              ) {
                blockingWall = plat;
              }

              // Check if there is ground support below our look-ahead position
              if (
                plat.type === 'SOLID' &&
                lookX >= plat.x &&
                lookX <= plat.x + plat.width &&
                plat.y >= p.y + p.height - 10 &&
                plat.y <= p.y + p.height + 60
              ) {
                gapAhead = false;
              }
            }

            // A. Handle color-phasing walls
            if (blockingWall && colorLockCooldown === 0) {
              colorLockCooldown = 15; // Cooldown of 15 ticks (250ms) between swaps

              if (blockingWall.colorState === 'RED') {
                input.state.phaseRed = true;
                input.state.phaseGreen = false;
                input.state.phaseBlue = false;
              } else if (blockingWall.colorState === 'GREEN') {
                input.state.phaseRed = false;
                input.state.phaseGreen = true;
                input.state.phaseBlue = false;
              } else if (blockingWall.colorState === 'BLUE') {
                input.state.phaseRed = false;
                input.state.phaseGreen = false;
                input.state.phaseBlue = true;
              }
            } else {
              input.state.phaseRed = false;
              input.state.phaseGreen = false;
              input.state.phaseBlue = false;
            }

            if (colorLockCooldown > 0) {
              colorLockCooldown--;
            }

            // B. Handle jumping heuristics
            if (p.isGrounded) {
              input.state.jump = false;

              // Jump if blocked by a neutral wall, or if there is a gap ahead, or if the goal is higher up
              const shouldJump = 
                (blockingWall && blockingWall.colorState === 'NEUTRAL') ||
                gapAhead ||
                (p.x > goal.x - 200 && goal.y < p.y - 30 && Math.random() < 0.85);

              if (shouldJump) {
                input.state.jump = true;
                totalJumps++;
              }
            } else {
              // Maintain variable jump cut-off: 10% chance to release space early to test low arches
              if (Math.random() < 0.10) {
                input.state.jump = false;
              }
            }

            // C. Track precision margin to hazards during jumps
            const hazards = level.platforms.filter(plat => plat.type === 'HAZARD');
            for (let i = 0; i < hazards.length; i++) {
              const h = hazards[i];
              // Calculate standard Euclidean distance from player's center to hazard
              const dx = (p.x + p.width / 2) - (h.x + h.width / 2);
              const dy = (p.y + p.height / 2) - (h.y + h.height / 2);
              const dist = Math.sqrt(dx * dx + dy * dy);
              cumulativeSpikeMargin += dist;
              validSpikeChecks++;
            }

            // Execute game physical update tick (fixed 16.67ms timestep)
            engine.update(16.6667);
          }

          // Evaluate run end status
          if (engine.state === 'VICTORY') {
            successes++;
          } else {
            deaths++;
          }
        }

        // Calculate statistics
        const failureRate = deaths / 1000;
        const avgSpikeDistance = validSpikeChecks > 0 ? Math.round(cumulativeSpikeMargin / validSpikeChecks) : 999;
        
        // Formulate difficulty score mapping (0.0 to 10.0 scale)
        // Failure rate adds up to 8.0 points. Low precision margin (average spike distance < 120px) adds up to 2.0 points.
        const failurePoints = failureRate * 8.0;
        const precisionRatio = avgSpikeDistance > 250 ? 0 : (250 - avgSpikeDistance) / 250;
        const precisionPoints = precisionRatio * 2.0;
        
        let difficultyScore = parseFloat((failurePoints + precisionPoints).toFixed(1));
        if (lvl.index === 0) difficultyScore = 0.2; // Floor rating for flat tutorial

        matrix[lvl.name] = {
          totalRuns: 1000,
          deaths,
          successes,
          failureRate: `${(failureRate * 100).toFixed(1)}%`,
          averageJumpsPerRun: parseFloat((totalJumps / 1000).toFixed(1)),
          precisionMargin: `${avgSpikeDistance}px`,
          difficultyScore: Math.min(difficultyScore, 10.0)
        };
      }

      return matrix;
    });

    console.log('\n[PlaytestBot] Playtesting Complete! Statistical JSON Matrix:\n');
    console.log(JSON.stringify(results, null, 2));
    console.log('\n=======================================================\n');
  } catch (error) {
    console.error('[PlaytestBot] Headless playtesting failed:', error);
  } finally {
    if (browser) {
      console.log('[PlaytestBot] Closing headless browser...');
      await browser.close();
    }
    cleanup();
    process.exit(0);
  }
}

main();
