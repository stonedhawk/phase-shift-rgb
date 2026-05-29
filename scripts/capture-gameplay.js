/* eslint-disable */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function main() {
  console.log('[Capture] Booting up Next.js development server on port 3009...');
  
  // Spawn Next.js local server in the background
  const server = spawn('npx', ['next', 'dev', '-p', '3009'], {
    shell: true,
    stdio: 'pipe',
  });

  // Ensure server cleanup on process exit
  const cleanup = () => {
    console.log('[Capture] Terminating Next.js server subprocess...');
    server.kill('SIGINT');
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('uncaughtException', (err) => {
    console.error('[Capture] Uncaught exception:', err);
    cleanup();
    process.exit(1);
  });

  // Wait 5 seconds for Next.js to compile and bind the local port
  await new Promise((resolve) => setTimeout(resolve, 5000));

  let browser;
  try {
    console.log('[Capture] Launching headless Google Chrome via Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    // Set matching viewport resolution
    await page.setViewport({ width: 1200, height: 900 });

    console.log('[Capture] Navigating to autoplay route http://localhost:3009?autoplay=true...');
    await page.goto('http://localhost:3009?autoplay=true', {
      waitUntil: 'networkidle2',
    });

    console.log('[Capture] Injecting local gifshot library into page scope...');
    const gifshotPath = require.resolve('gifshot');
    await page.addScriptTag({
      path: gifshotPath,
    });

    console.log('[Capture] Capturing gameplay frames and compiling GIF browser-side (5 seconds at 15 FPS)...');
    
    // Execute browser-side capturing and LZW GIF encoding inside Chrome's high-speed sandbox
    const gifDataUrl = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
          return reject(new Error('Canvas element not found'));
        }

        const frames = [];
        const fps = 15;
        const durationMs = 5000;
        const frameCount = (durationMs / 1000) * fps;
        const intervalMs = 1000 / fps;

        let captured = 0;
        const interval = setInterval(() => {
          if (captured >= frameCount) {
            clearInterval(interval);
            
            console.log('[Browser] Compiling canvas frames to GIF data stream...');
            // @ts-ignore
            if (typeof gifshot === 'undefined') {
              return reject(new Error('gifshot library failed to load in page scope'));
            }

            // @ts-ignore
            gifshot.createGIF({
              images: frames,
              gifWidth: 400,  // Scale down dimensions to keep the repository asset ultra-lightweight
              gifHeight: 300,
              interval: 1 / fps,
              numWorkers: 2,
            }, (obj) => {
              if (obj.error) {
                reject(new Error(obj.errorMsg));
              } else {
                resolve(obj.image);
              }
            });
          } else {
            frames.push(canvas.toDataURL('image/png'));
            captured++;
          }
        }, intervalMs);
      });
    });

    console.log('[Capture] Decoding base64 data stream and saving file to public/assets/gameplay.gif...');
    const base64Data = gifDataUrl.replace(/^data:image\/gif;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const assetsDir = path.join(__dirname, '../public/assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    const gifPath = path.join(assetsDir, 'gameplay.gif');
    fs.writeFileSync(gifPath, buffer);
    console.log(`[Capture] Success! Gameplay recording saved at: ${gifPath}`);
  } catch (error) {
    console.error('[Capture] Capture automation failed:', error);
  } finally {
    if (browser) {
      console.log('[Capture] Closing Chrome browser session...');
      await browser.close();
    }
    cleanup();
    process.exit(0);
  }
}

main();
