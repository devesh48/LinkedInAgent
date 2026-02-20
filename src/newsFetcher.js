'use strict';

const Parser = require('rss-parser');

const parser = new Parser();

const RSS_FEEDS = [
  { name: 'TechCrunch',   url: 'https://techcrunch.com/feed/' },
  { name: "O'Reilly",     url: 'https://feeds.feedburner.com/oreilly/radar' },
  { name: 'AI News',      url: 'https://www.artificialintelligence-news.com/feed/' },
  { name: 'Hacker News',  url: 'https://feeds.feedburner.com/TheHackersNews' },
  { name: 'The Rundown AI', url: 'https://rss.beehiiv.com/feeds/TNKFQKnpbx.xml' },
];

const ITEMS_PER_FEED = 5;
const TOP_ITEMS_TOTAL = 10;

async function fetchSingleFeed(feedConfig) {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    return feed.items.slice(0, ITEMS_PER_FEED).map((item) => ({
      source: feedConfig.name,
      title: (item.title || '').trim(),
      summary: (item.contentSnippet || item.content || '').slice(0, 300).trim(),
      link: item.link || '',
      pubDate: new Date(item.pubDate || item.isoDate || Date.now()),
    }));
  } catch (err) {
    console.warn(`[newsFetcher] Feed failed (${feedConfig.name}): ${err.message}`);
    return [];
  }
}

async function fetchNews() {
  const results = await Promise.allSettled(RSS_FEEDS.map(fetchSingleFeed));

  const allItems = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .filter((item) => item.title); // drop empty items

  allItems.sort((a, b) => b.pubDate - a.pubDate);

  const topItems = allItems.slice(0, TOP_ITEMS_TOTAL);

  console.log(`[newsFetcher] Fetched ${topItems.length} news items from ${RSS_FEEDS.length} feeds.`);
  return topItems;
}

module.exports = { fetchNews };
