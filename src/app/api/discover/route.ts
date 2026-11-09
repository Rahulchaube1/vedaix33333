import { searchSearxng } from '@/lib/searxng';

const websitesForTopic = {
  tech: {
    query: ['technology news', 'latest tech', 'AI', 'science and innovation'],
    links: ['techcrunch.com', 'wired.com', 'theverge.com'],
  },
  finance: {
    query: ['finance news', 'economy', 'stock market', 'investing'],
    links: ['bloomberg.com', 'cnbc.com', 'marketwatch.com'],
  },
  art: {
    query: ['art news', 'culture', 'modern art', 'cultural events'],
    links: ['artnews.com', 'hyperallergic.com', 'theartnewspaper.com'],
  },
  sports: {
    query: ['sports news', 'latest sports', 'cricket football tennis'],
    links: ['espn.com', 'bbc.com/sport', 'skysports.com'],
  },
  entertainment: {
    query: ['entertainment news', 'movies', 'TV shows', 'celebrities'],
    links: ['hollywoodreporter.com', 'variety.com', 'deadline.com'],
  },
};

type Topic = keyof typeof websitesForTopic;

const decodeXml = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const stripMarkup = (value: string) =>
  decodeXml(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getFavicon = (url: string) => {
  try {
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=128`;
  } catch {
    return '';
  }
};

const normalizeArticle = (item: any) => {
  if (!item?.url || !item?.title) return null;

  return {
    ...item,
    title: stripMarkup(String(item.title)),
    content: stripMarkup(String(item.content || '')),
    thumbnail: item.thumbnail || item.thumbnail_src || getFavicon(item.url),
  };
};

const searchNewsFallback = async (query: string) => {
  const url = new URL('https://news.google.com/rss/search');
  url.searchParams.set('q', query);
  url.searchParams.set('hl', 'en-US');
  url.searchParams.set('gl', 'US');
  url.searchParams.set('ceid', 'US:en');

  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) return [];

  const xml = await response.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => {
    const item = match[1];
    const title = decodeXml(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
    const link = decodeXml(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '');

    return normalizeArticle({
      title,
      url: link,
      content: item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '',
      thumbnail: link ? getFavicon(link) : '',
    });
  });
};

const safeSearch = async (query: string) => {
  try {
    const results = (
      await searchSearxng(query, {
        engines: ['bing news'],
        pageno: 1,
        language: 'en',
      })
    ).results;
    return results.map(normalizeArticle).filter(Boolean);
  } catch (error) {
    console.error(`Discover search failed for "${query}":`, error);
    try {
      return (await searchNewsFallback(query)).filter(Boolean);
    } catch (fallbackError) {
      console.error(`Discover fallback failed for "${query}":`, fallbackError);
      return [];
    }
  }
};

export const GET = async (req: Request) => {
  try {
    const params = new URL(req.url).searchParams;

    const mode: 'normal' | 'preview' =
      (params.get('mode') as 'normal' | 'preview') || 'normal';
    const topic: Topic = (params.get('topic') as Topic) || 'tech';

    const selectedTopic = websitesForTopic[topic];

    let data = [];

    if (mode === 'normal') {
      const seenUrls = new Set();

      data = (
        await Promise.all(
          selectedTopic.links.flatMap((link) =>
            selectedTopic.query.map(async (query) => {
              return safeSearch(`site:${link} ${query}`);
            }),
          ),
        )
      )
        .flat()
        .filter((item) => {
          const url = item.url?.toLowerCase().trim();
          if (seenUrls.has(url)) return false;
          seenUrls.add(url);
          return true;
        })
        .sort(() => Math.random() - 0.5);
    } else {
      data = (
        await safeSearch(
          `site:${selectedTopic.links[Math.floor(Math.random() * selectedTopic.links.length)]} ${selectedTopic.query[Math.floor(Math.random() * selectedTopic.query.length)]}`,
        )
      );
    }

    return Response.json(
      {
        blogs: data,
        degraded: data.length === 0,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error(`An error occurred in discover route: ${err}`);
    return Response.json(
      {
        message: 'An error has occurred',
      },
      {
        status: 500,
      },
    );
  }
};
