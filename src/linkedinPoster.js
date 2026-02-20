'use strict';

const axios = require('axios');

const LINKEDIN_API_BASE = 'https://api.linkedin.com/rest';
const LINKEDIN_VERSION = '202602';

function buildPostBody(text) {
  return {
    author: process.env.LINKEDIN_PERSON_URN,
    lifecycleState: 'PUBLISHED',
    visibility: 'PUBLIC',
    commentary: text,
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: []
    }
  };
}

async function postToLinkedIn(postText) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const personUrn = process.env.LINKEDIN_PERSON_URN;

  if (!accessToken) throw new Error('[linkedinPoster] LINKEDIN_ACCESS_TOKEN is not set.');
  if (!personUrn) throw new Error('[linkedinPoster] LINKEDIN_PERSON_URN is not set.');

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'LinkedIn-Version': LINKEDIN_VERSION,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
  };

  const body = buildPostBody(postText);

  console.log('[linkedinPoster] Posting to LinkedIn...');

  try {
    const response = await axios.post(`${LINKEDIN_API_BASE}/posts`, body, { headers });

    // LinkedIn returns 201 Created; the new post URN is in the x-restli-id header
    const postUrn = response.headers['x-restli-id'] || '(URN not returned)';
    console.log(`[linkedinPoster] Post published successfully. URN: ${postUrn}`);
    return postUrn;
  } catch (err) {
    if (err.response) {
      const { status, data } = err.response;
      const hint =
        status === 401 ? 'Access token may be expired — run: node auth.js'
        : status === 403 ? 'Missing w_member_social scope on your LinkedIn app'
        : status === 422 ? 'Malformed request body'
        : status === 429 ? 'LinkedIn rate limit hit — try again later'
        : status >= 500 ? 'LinkedIn server error — check your request format and API version compatibility'
        : '';
      console.error('[linkedinPoster] Request details:', { url: `${LINKEDIN_API_BASE}/posts`, headers, body });
      throw new Error(
        `[linkedinPoster] LinkedIn API error ${status}: ${JSON.stringify(data)}${hint ? ` — ${hint}` : ''}`
      );
    }
    throw err;
  }
}

module.exports = { postToLinkedIn };
