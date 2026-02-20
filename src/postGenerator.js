'use strict';

const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = 'gemini-2.5-flash-lite';
const MAX_POST_CHARS = 3000;

const SYSTEM_PROMPT = `You are a professional LinkedIn content creator specializing in technology and AI.
Your audience is software engineers, technical leads, and AI practitioners.

Your writing style:
- Insightful and opinionated — go beyond summarizing, add a perspective or connect the dots between stories
- Conversational but professional — no corporate jargon or buzzword salad
- Structured with short paragraphs for mobile readability
- Ends with a thought-provoking question to drive comments and engagement

Rules:
- Write exactly ONE LinkedIn post per response — nothing else, no preamble, no sign-off
- Post length: 150–300 words (never exceed 3000 characters)
- Pick the 2–3 most interesting or thematically connected stories from the list
- Open with a strong hook — never start with "I" or "Today"
- Include 3–5 relevant hashtags at the very end (e.g. #AI #MachineLearning #TechNews)
- CRITICAL: Write in plain text ONLY — absolutely no markdown of any kind:
  - No asterisks (*) for bold or bullets
  - No underscores (_) for italics
  - No hyphens (-) as bullet points
  - No pound signs (#) except for hashtags at the end
  - No horizontal rules (--- or ***)
  - No code blocks or backticks
- Separate paragraphs with a blank line
- Do NOT include any URLs in the post body
- Never fabricate facts — only use information from the provided news summaries`;

function buildUserPrompt(newsItems) {
  const formatted = newsItems
    .map((item, i) => {
      const lines = [`${i + 1}. [${item.source}] ${item.title}`];
      if (item.summary) lines.push(`   ${item.summary}`);
      return lines.join('\n');
    })
    .join('\n\n');

  return `Here are today's top tech and AI news items. Write a LinkedIn post based on the most interesting 2-3 stories:\n\n${formatted}\n\nWrite a single engaging LinkedIn post now.`;
}

// Strip any markdown formatting Gemini may output despite instructions
function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')   // **bold**
    .replace(/\*(.*?)\*/g, '$1')        // *italic*
    .replace(/__(.*?)__/g, '$1')        // __bold__
    .replace(/_(.*?)_/g, '$1')          // _italic_
    .replace(/^#{1,6}\s+/gm, '')        // # headers
    .replace(/^[-*]{3,}\s*$/gm, '')     // --- or *** horizontal rules
    .replace(/`{1,3}[^`]*`{1,3}/g, '')  // `code` or ```code blocks```
    .replace(/^\s*[-*+]\s+/gm, '')      // - bullet points
    .replace(/\n{3,}/g, '\n\n')         // collapse 3+ newlines to 2
    .trim();
}

// Extract full text from Gemini response robustly (handles multi-part responses)
function extractText(response) {
  const candidate = response.candidates && response.candidates[0];
  if (!candidate) throw new Error('[postGenerator] No candidates in Gemini response.');

  const parts = candidate.content && candidate.content.parts;
  if (!parts || parts.length === 0) throw new Error('[postGenerator] No parts in Gemini response.');

  return parts.map((p) => p.text || '').join('');
}

async function generatePost(newsItems) {
  if (!newsItems || newsItems.length === 0) {
    throw new Error('[postGenerator] No news items provided.');
  }

  const userPrompt = buildUserPrompt(newsItems);

  console.log('[postGenerator] Calling Gemini API...');

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 1024,
    },
  });

  const rawText = extractText(response);
  console.log(`[postGenerator] Raw response (${rawText.length} chars):\n${rawText}\n`);

  const postText = stripMarkdown(rawText);

  if (postText.length > MAX_POST_CHARS) {
    console.warn(`[postGenerator] Post too long (${postText.length} chars), truncating.`);
    return postText.slice(0, MAX_POST_CHARS - 3) + '...';
  }

  console.log(`[postGenerator] Final post (${postText.length} chars).`);
  return postText;
}

module.exports = { generatePost };
