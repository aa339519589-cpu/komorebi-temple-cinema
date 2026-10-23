import { access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';

// Use installed, trusted runtimes. No browser download or remote scene service.
export async function launchRenderBrowser() {
  let pw;
  for (const specifier of [
    process.env.PLAYWRIGHT_MODULE,
    'playwright',
    '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs',
    homedir() + '/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
  ].filter(Boolean)) {
    try { pw = await import(specifier.startsWith('/') ? pathToFileURL(specifier).href : specifier); break; }
    catch (e) { if (!['ERR_MODULE_NOT_FOUND', 'MODULE_NOT_FOUND'].includes(e.code)) throw e; }
  }
  if (!pw) throw Error('Playwright is not installed. Install the package declared in package.json.');
  let executablePath = process.env.CHROME_PATH;
  if (!executablePath) for (const candidate of [
    '/usr/bin/chromium', '/usr/bin/chromium-browser',
    homedir() + '/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
  ]) { try { await access(candidate); executablePath = candidate; break; } catch {} }
  const backend = process.env.RENDER_BACKEND || (process.platform === 'darwin' ? 'metal' : 'swiftshader');
  const args = ['--enable-gpu', '--disable-dev-shm-usage', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--force-color-profile=srgb'];
  if (backend === 'metal') args.push('--use-angle=metal');
  else if (backend === 'swiftshader') args.push('--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader');
  const browser = await pw.chromium.launch({ headless: true, chromiumSandbox: process.platform === 'darwin', executablePath, args });
  return { browser, backend, executablePath: executablePath || 'Playwright managed browser' };
}
