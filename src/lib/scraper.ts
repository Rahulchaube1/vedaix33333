import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { Mutex } from 'async-mutex';

class Scraper {
  private static browser: any | undefined;
  private static IDLE_KILL_TIMEOUT = 30000;
  private static NAVIGATION_TIMEOUT = 15000;
  private static idleTimeout: NodeJS.Timeout | undefined;
  private static browserMutex = new Mutex();
  private static userCount = 0;
  private static playwrightAvailable: boolean | null = null;

  private static async initBrowser() {
    if (this.playwrightAvailable === false) return;

    await this.browserMutex.runExclusive(async () => {
      if (!this.browser) {
        try {
          const { chromium } = await import('playwright');
          this.browser = await chromium.launch({
            headless: true,
            channel: 'chromium-headless-shell',
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
              '--disable-blink-features=AutomationControlled',
            ],
          });
          this.playwrightAvailable = true;
        } catch (err) {
          console.warn('Playwright browser launch failed, using fetch fallback:', err);
          this.playwrightAvailable = false;
          this.browser = undefined;
        }
      }

      if (this.idleTimeout) clearTimeout(this.idleTimeout);
    });
  }

  private static scheduleIdleKill() {
    if (this.idleTimeout) clearTimeout(this.idleTimeout);

    this.idleTimeout = setTimeout(async () => {
      await this.browserMutex.runExclusive(async () => {
        if (this.browser && this.userCount === 0) {
          await this.browser.close().catch(() => undefined);
          this.browser = undefined;
        }
      });
    }, this.IDLE_KILL_TIMEOUT);
  }

  static async scrapeWithFetch(
    url: string,
  ): Promise<{ content: string; title: string }> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        throw new Error(`HTTP status ${res.status}`);
      }

      const html = await res.text();
      const dom = new JSDOM(html, { url });
      const parsed = new Readability(dom.window.document).parse();
      const title = dom.window.document.title || parsed?.title || 'No title';
      const textContent = parsed?.textContent?.trim() || '';

      return {
        title,
        content: `
        # ${title} - ${url}
        ${textContent || 'No content available'}
        `,
      };
    } catch (err: any) {
      console.warn(`Fetch fallback failed for ${url}:`, err.message);
      return {
        title: 'Failed to scrape',
        content: `# ${url}\n\nUnable to retrieve content.`,
      };
    }
  }

  static async scrape(
    url: string,
  ): Promise<{ content: string; title: string }> {
    try {
      await this.initBrowser();
    } catch {
      this.playwrightAvailable = false;
    }

    if (!this.browser) {
      return this.scrapeWithFetch(url);
    }

    let context: any;

    try {
      context = await this.browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      });

      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      const page = await context.newPage();
      this.userCount++;

      try {
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: this.NAVIGATION_TIMEOUT,
        });

        await page
          .waitForLoadState('load', { timeout: 4000 })
          .catch(() => undefined);
        await page.waitForTimeout(400);

        const html = await page.content();
        const dom = new JSDOM(html, { url });
        const content = new Readability(dom.window.document).parse();
        const title = await page.title();

        return {
          content: `
          # ${title ?? 'No title'} - ${url}
          ${content?.textContent?.trim() ?? 'No content available'}
          `,
          title,
        };
      } finally {
        this.userCount--;
        await context.close().catch(() => undefined);
        if (this.userCount === 0) {
          this.scheduleIdleKill();
        }
      }
    } catch (err) {
      console.warn(`Playwright scrape error on ${url}, falling back to fetch:`, err);
      return this.scrapeWithFetch(url);
    }
  }
}

export default Scraper;
