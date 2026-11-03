/**
 * quoteService.js
 * -------------------------------------------------------------------------
 * Fetches motivational quotes from API Ninjas (https://api-ninjas.com/api/quotes)
 * when QUOTE_API_KEY is configured. Falls back to a local curated quote bank
 * (data/fallbackQuotes.js) whenever the API key is missing or the request
 * fails, so the feature always works.
 * -------------------------------------------------------------------------
 */

const fetch = require('node-fetch');
const fallbackQuotes = require('../data/fallbackQuotes');
const { QUOTE_CATEGORIES } = require('../config/constants');

// API Ninjas uses its own category vocabulary; map ours loosely onto it.
const CATEGORY_ALIAS = {
  motivation: 'motivational',
  confidence: 'courage',
  positivity: 'happiness',
  success: 'success',
  'stress relief': 'life',
  'self-belief': 'faith',
  productivity: 'work',
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchFromApi(category) {
  const apiKey = process.env.QUOTE_API_KEY;
  if (!apiKey) return null;

  const apiCategory = CATEGORY_ALIAS[category] || 'motivational';
  const url = `https://api.api-ninjas.com/v1/quotes?category=${encodeURIComponent(apiCategory)}`;

  const response = await fetch(url, { headers: { 'X-Api-Key': apiKey } });
  if (!response.ok) throw new Error(`Quotes API responded with ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data) || !data.length) return null;

  const item = data[0];
  return { text: item.quote, author: item.author || 'Unknown', category, source: 'api' };
}

async function getQuoteByMoodCategory(category) {
  const normalized = QUOTE_CATEGORIES.includes(category) ? category : 'motivation';
  try {
    const apiQuote = await fetchFromApi(normalized);
    if (apiQuote) return apiQuote;
  } catch (err) {
    console.warn('[quoteService] API request failed, using local fallback:', err.message);
  }

  const pool = fallbackQuotes.filter((q) => q.category === normalized);
  const chosen = pickRandom(pool.length ? pool : fallbackQuotes);
  return { ...chosen, source: 'local' };
}

function getRandomLocalQuote() {
  const chosen = pickRandom(fallbackQuotes);
  return { ...chosen, source: 'local' };
}

module.exports = { getQuoteByMoodCategory, getRandomLocalQuote };
