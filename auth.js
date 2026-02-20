'use strict';

/**
 * auth.js — One-time LinkedIn OAuth 2.0 token acquisition
 *
 * Run once: node auth.js
 *
 * This script:
 *  1. Starts a local Express server on port 3000
 *  2. Prints an authorization URL — open it in your browser
 *  3. LinkedIn redirects back with an auth code
 *  4. Exchanges the code for an access token
 *  5. Fetches your person URN
 *  6. Prints the values to copy into your .env file
 */

require('dotenv').config();

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = 'openid profile w_member_social';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    'Error: LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET must be set in your .env file.\n' +
    'Copy .env.example to .env and fill in your LinkedIn app credentials first.'
  );
  process.exit(1);
}

const app = express();
let server;

function getAuthorizationUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

app.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    res.send(`<h2>Authorization failed</h2><p>${error}: ${error_description}</p>`);
    console.error(`\nAuthorization failed: ${error} — ${error_description}`);
    server.close();
    return;
  }

  if (!code) {
    res.send('<h2>No auth code received.</h2>');
    server.close();
    return;
  }

  try {
    // Exchange auth code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, expires_in } = tokenResponse.data;
    const expiresInDays = Math.round(expires_in / 86400);

    // Fetch person URN using the /v2/userinfo endpoint (requires openid scope)
    const userinfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { sub, name } = userinfoResponse.data;
    const personUrn = `urn:li:person:${sub}`;

    console.log('\n========================================');
    console.log('  LinkedIn OAuth — Authorization Complete');
    console.log('========================================');
    console.log(`  Name: ${name}`);
    console.log(`  Token expires in: ~${expiresInDays} days`);
    console.log('\n  Copy these values into your .env file:\n');
    console.log(`  LINKEDIN_ACCESS_TOKEN=${access_token}`);
    console.log(`  LINKEDIN_PERSON_URN=${personUrn}`);
    console.log('========================================\n');

    res.send(
      `<h2>Authorization complete!</h2>
       <p>Hello, <strong>${name}</strong>.</p>
       <p>Check your terminal for the values to copy into <code>.env</code>.</p>
       <p>You can close this tab.</p>`
    );
  } catch (err) {
    const detail = err.response ? JSON.stringify(err.response.data) : err.message;
    console.error(`\nToken exchange failed: ${detail}`);
    res.send(`<h2>Token exchange failed</h2><pre>${detail}</pre>`);
  } finally {
    server.close();
  }
});

const state = crypto.randomBytes(8).toString('hex');
const authUrl = getAuthorizationUrl(state);

server = app.listen(3000, () => {
  console.log('\n========================================');
  console.log('  LinkedIn OAuth — Authorization Flow');
  console.log('========================================');
  console.log('  Open the following URL in your browser:\n');
  console.log(`  ${authUrl}`);
  console.log('\n  Waiting for LinkedIn to redirect back...');
  console.log('========================================\n');
});
