import { getSearxngURL } from './config/serverRegistry';
import configManager from './config';
import { JSDOM } from 'jsdom';

export interface SearxngSearchOptions {
  categories?: string[];
  engines?: string[];
  language?: string;
  pageno?: number;
}

export interface SearxngSearchResult {
  title: string;
  url: string;
  img_src?: string;
  thumbnail_src?: string;
  thumbnail?: string;
  content?: string;
  author?: string;
  iframe_src?: string;
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

const getVqdToken = async (query: string): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iar=images`,
      {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(6000),
      },
    );
    const html = await res.text();
    const match = html.match(/vqd=([\"']?)([\d-]+)\1/);
    return match ? match[2] : null;
  } catch (err) {
    return null;
  }
};

export const searchDuckDuckGo = async (
  query: string,
): Promise<{ results: SearxngSearchResult[]; suggestions: string[] }> => {
  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!res.ok) {
      throw new Error(`DuckDuckGo response status ${res.status}`);
    }

    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const results: SearxngSearchResult[] = [];

    const elements = doc.querySelectorAll('.result');
    elements.forEach((el) => {
      const a = el.querySelector('.result__title a');
      const snippetEl = el.querySelector('.result__snippet');
      if (!a) return;

      const rawHref = a.getAttribute('href') || '';
      let finalUrl = rawHref;
      if (rawHref.includes('uddg=')) {
        try {
          const u = new URL(rawHref.startsWith('http') ? rawHref : `https:${rawHref}`);
          finalUrl = decodeURIComponent(u.searchParams.get('uddg') || rawHref);
        } catch {
          finalUrl = rawHref;
        }
      }

      const title = a.textContent?.trim() || '';
      const content = snippetEl?.textContent?.trim() || '';

      if (title && finalUrl && !finalUrl.includes('duckduckgo.com/y.js')) {
        results.push({
          title,
          url: finalUrl,
          content,
        });
      }
    });

    const suggestions = await getDuckDuckGoSuggestions(query);
    return { results, suggestions };
  } catch (err) {
    console.warn('DuckDuckGo HTML search fallback failed:', err);
    return { results: [], suggestions: [] };
  }
};

export const getDuckDuckGoSuggestions = async (
  query: string,
): Promise<string[]> => {
  try {
    const res = await fetch(
      `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`,
      {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(4000),
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return data[1] as string[];
    }
    return [];
  } catch {
    return [];
  }
};

export const searchDuckDuckGoImages = async (
  query: string,
): Promise<SearxngSearchResult[]> => {
  try {
    const vqd = await getVqdToken(query);
    if (!vqd) return [];

    const res = await fetch(
      `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}`,
      {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!res.ok) return [];
    const data = await res.json();
    const images: SearxngSearchResult[] = [];

    if (Array.isArray(data.results)) {
      data.results.forEach((item: any) => {
        if (item.image && item.url) {
          images.push({
            title: item.title || query,
            url: item.url,
            img_src: item.image,
            thumbnail_src: item.thumbnail || item.image,
            thumbnail: item.thumbnail || item.image,
          });
        }
      });
    }

    return images;
  } catch (err) {
    console.warn('DuckDuckGo images search failed:', err);
    return [];
  }
};

export const searchDuckDuckGoVideos = async (
  query: string,
): Promise<SearxngSearchResult[]> => {
  try {
    const vqd = await getVqdToken(query);
    if (!vqd) return [];

    const res = await fetch(
      `https://duckduckgo.com/v.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}`,
      {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!res.ok) return [];
    const data = await res.json();
    const videos: SearxngSearchResult[] = [];

    if (Array.isArray(data.results)) {
      data.results.forEach((item: any) => {
        const videoUrl = item.content || item.url || '';
        let iframeSrc = '';
        const ytMatch = videoUrl.match(/(?:watch\?v=|youtu\.be\/|embed\/)([\w-]{11})/);
        if (ytMatch) {
          iframeSrc = `https://www.youtube.com/embed/${ytMatch[1]}`;
        }

        if (videoUrl && item.title) {
          videos.push({
            title: item.title,
            url: videoUrl,
            img_src: item.images?.medium || item.images?.small || item.image || '',
            thumbnail: item.images?.medium || item.images?.small || item.image || '',
            thumbnail_src: item.images?.small || item.image || '',
            iframe_src: iframeSrc || videoUrl,
            content: item.description || '',
          });
        }
      });
    }

    return videos;
  } catch (err) {
    console.warn('DuckDuckGo videos search failed:', err);
    return [];
  }
};

export const searchTavily = async (
  query: string,
  apiKey: string,
): Promise<{ results: SearxngSearchResult[]; suggestions: string[] }> => {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        include_answer: false,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`Tavily error: ${res.statusText}`);
    const data = await res.json();

    const results: SearxngSearchResult[] = (data.results || []).map((item: any) => ({
      title: item.title || '',
      url: item.url || '',
      content: item.content || '',
    }));

    return { results, suggestions: [] };
  } catch (err) {
    console.warn('Tavily search failed:', err);
    return { results: [], suggestions: [] };
  }
};

export const searchBrave = async (
  query: string,
  apiKey: string,
): Promise<{ results: SearxngSearchResult[]; suggestions: string[] }> => {
  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': apiKey,
        },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!res.ok) throw new Error(`Brave error: ${res.statusText}`);
    const data = await res.json();

    const results: SearxngSearchResult[] = (data.web?.results || []).map((item: any) => ({
      title: item.title || '',
      url: item.url || '',
      content: item.description || '',
    }));

    return { results, suggestions: [] };
  } catch (err) {
    console.warn('Brave search failed:', err);
    return { results: [], suggestions: [] };
  }
};

export const searchSearxng = async (
  query: string,
  opts?: SearxngSearchOptions,
): Promise<{ results: SearxngSearchResult[]; suggestions: string[] }> => {
  const isVideoSearch =
    opts?.engines?.includes('youtube') ||
    opts?.categories?.includes('videos');

  const isImageSearch =
    opts?.engines?.some((e) => /image/i.test(e)) ||
    opts?.categories?.includes('images');

  const preferredProvider =
    configManager.getConfig('search.provider', process.env.SEARCH_PROVIDER || 'auto');
  const tavilyApiKey =
    configManager.getConfig('search.tavilyApiKey', process.env.TAVILY_API_KEY || '');
  const braveApiKey =
    configManager.getConfig('search.braveApiKey', process.env.BRAVE_API_KEY || '');

  if (preferredProvider === 'tavily' && tavilyApiKey && !isVideoSearch && !isImageSearch) {
    const tavilyRes = await searchTavily(query, tavilyApiKey);
    if (tavilyRes.results.length > 0) return tavilyRes;
  }

  if (preferredProvider === 'brave' && braveApiKey && !isVideoSearch && !isImageSearch) {
    const braveRes = await searchBrave(query, braveApiKey);
    if (braveRes.results.length > 0) return braveRes;
  }

  if (preferredProvider === 'duckduckgo') {
    if (isVideoSearch) {
      const vids = await searchDuckDuckGoVideos(query);
      return { results: vids, suggestions: [] };
    }
    if (isImageSearch) {
      const imgs = await searchDuckDuckGoImages(query);
      return { results: imgs, suggestions: [] };
    }
    return searchDuckDuckGo(query);
  }

  const searxngURL = getSearxngURL().replace(/\/$/, '');
  const isSearxngConfigured = /^https?:\/\//i.test(searxngURL);

  if (isSearxngConfigured) {
    const url = new URL('/search?format=json', searxngURL);
    url.searchParams.append('q', query);

    if (opts) {
      Object.keys(opts).forEach((key) => {
        const value = opts[key as keyof SearxngSearchOptions];
        if (Array.isArray(value)) {
          url.searchParams.append(key, value.join(','));
          return;
        }
        url.searchParams.append(key, value as string);
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        const results: SearxngSearchResult[] = data.results || [];
        const suggestions: string[] = data.suggestions || [];

        if (results.length > 0) {
          return { results, suggestions };
        }
      }
    } catch (err: any) {
      console.warn(`SearXNG request to ${searxngURL} failed (${err.message}), falling back to open search...`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (tavilyApiKey && !isVideoSearch && !isImageSearch) {
    const tavilyRes = await searchTavily(query, tavilyApiKey);
    if (tavilyRes.results.length > 0) return tavilyRes;
  }

  if (braveApiKey && !isVideoSearch && !isImageSearch) {
    const braveRes = await searchBrave(query, braveApiKey);
    if (braveRes.results.length > 0) return braveRes;
  }

  if (isVideoSearch) {
    const videos = await searchDuckDuckGoVideos(query);
    return { results: videos, suggestions: [] };
  }

  if (isImageSearch) {
    const images = await searchDuckDuckGoImages(query);
    return { results: images, suggestions: [] };
  }

  return searchDuckDuckGo(query);
};
