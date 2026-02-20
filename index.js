'use strict';

require('dotenv').config();

const { fetchNews } = require('./src/newsFetcher');
const { generatePost } = require('./src/postGenerator');
const { postToLinkedIn } = require('./src/linkedinPoster');
const { scheduleJob } = require('./src/scheduler');

async function runAgent() {
  console.log(`\n=== LinkedIn Agent Run: ${new Date().toISOString()} ===`);

  const newsItems = await fetchNews();

  if (newsItems.length === 0) {
    console.warn('[agent] No news items fetched — skipping this run.');
    return;
  }

  const postText = await generatePost(newsItems);

  console.log('\n--- Generated Post Preview ---');
  console.log(postText);
  console.log('------------------------------\n');

  const postUrn = await postToLinkedIn(postText);

  console.log(`=== Run complete. Post URN: ${postUrn} ===\n`);
}

if (process.env.RUN_NOW === 'true') {
  runAgent().catch((err) => {
    console.error('Fatal error:', err.message);
    process.exit(1);
  });
} else {
  scheduleJob(runAgent);
}

module.exports = { runAgent };
