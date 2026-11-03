/**
 * musicService.js
 * -------------------------------------------------------------------------
 * Reusable backend music service with FOUR layers, tried in order, so a
 * single provider having a bad day never takes the feature down:
 *
 * 1. iTunes Search API (https://itunes.apple.com/search) — Apple's official,
 *    public, read-only catalog search. Requires NO API key/signup.
 *    Returns real, legally licensed 30-second preview audio.
 *
 * 2. Deezer API (https://api.deezer.com/search) — also official, public,
 *    and requires NO API key/signup. Independent catalog and infrastructure
 *    from Apple's, so if one is rate-limited or briefly down, the other
 *    usually isn't. Also returns real 30-second preview audio.
 *
 * 3. Jamendo (https://developer.jamendo.com) — optional. If MUSIC_API_KEY
 *    (a free Jamendo Client ID) is set, used as a third source for
 *    independent/Creative-Commons tracks with full-length streams.
 *
 * 4. Local fallback catalogue (server/data/fallbackMusic.js) — used only if
 *    every network call fails (e.g. fully offline), so the feature never
 *    completely breaks.
 *
 * No API key is ever sent to or required by the frontend — all calls
 * happen here on the server.
 * -------------------------------------------------------------------------
 */

const fetch = require('node-fetch');
const fallbackCatalogue = require('../data/fallbackMusic');
const { MUSIC_CATEGORIES } = require('../config/constants');

// Short, high-hit-rate search terms. Both iTunes and Deezer do keyword
// matching across track/artist/album metadata — short, common genre words
// reliably return results; long descriptive phrases often return nothing.
const CATEGORY_TO_TERM = {
  relax: 'relaxing',
  happy: 'feel good hits',
  focus: 'study beats',
  energy: 'workout',
  motivation: 'motivation',
  sleep: 'sleep music',
  chill: 'chill',
};

const CATEGORY_TO_JAMENDO_TAG = {
  relax: 'relaxation',
  happy: 'happy',
  focus: 'chillout',
  energy: 'energetic',
  motivation: 'uplifting',
  sleep: 'ambient',
  chill: 'chill',
};

const FETCH_TIMEOUT_MS = 6000;

// node-fetch v2 doesn't support AbortSignal.timeout(), so wire up a manual
// timeout to make sure a slow/hanging provider can't stall the request.
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function upscaleItunesArtwork(url) {
  if (!url) return null;
  return url.replace('100x100bb', '300x300bb');
}

// --- Provider 1: iTunes Search API (no key) ---
async function fetchFromItunes(term, limit = 12) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit}&country=US`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`iTunes Search API responded with ${response.status}`);
  const data = await response.json();
  if (!data.results || !data.results.length) return null;

  const tracks = data.results
    .filter((t) => t.previewUrl)
    .map((t) => ({
      id: `itunes-${t.trackId}`,
      title: t.trackName,
      artist: t.artistName,
      category: 'itunes',
      artwork: upscaleItunesArtwork(t.artworkUrl100),
      previewUrl: t.previewUrl,
      externalUrl: t.trackViewUrl || null,
      durationSeconds: t.trackTimeMillis ? Math.round(t.trackTimeMillis / 1000) : null,
      source: 'itunes',
    }));
  return tracks.length ? tracks : null;
}

// --- Provider 2: Deezer API (no key) ---
async function fetchFromDeezer(term, limit = 12) {
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(term)}&limit=${limit}`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`Deezer API responded with ${response.status}`);
  const data = await response.json();
  if (!data.data || !data.data.length) return null;

  const tracks = data.data
    .filter((t) => t.preview)
    .map((t) => ({
      id: `deezer-${t.id}`,
      title: t.title,
      artist: t.artist?.name || 'Unknown artist',
      category: 'deezer',
      artwork: t.album?.cover_medium || t.album?.cover || null,
      previewUrl: t.preview, // official 30-second preview mp3, no key required
      externalUrl: t.link || null,
      durationSeconds: t.duration || null,
      source: 'deezer',
    }));
  return tracks.length ? tracks : null;
}

// --- Provider 3: Jamendo (optional, needs MUSIC_API_KEY) ---
async function fetchFromJamendo(category, limit = 10) {
  const clientId = process.env.MUSIC_API_KEY;
  if (!clientId) return null;

  const tag = CATEGORY_TO_JAMENDO_TAG[category] || category;
  const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${encodeURIComponent(clientId)}&format=json&limit=${limit}&tags=${encodeURIComponent(tag)}&include=musicinfo&audioformat=mp32`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`Jamendo API responded with ${response.status}`);
  const data = await response.json();
  if (!data.results || !data.results.length) return null;

  return data.results.map((track) => ({
    id: `jamendo-${track.id}`,
    title: track.name,
    artist: track.artist_name,
    category,
    artwork: track.album_image || track.image || null,
    previewUrl: track.audio || track.audiodownload || null,
    externalUrl: track.shareurl || null,
    durationSeconds: track.duration || null,
    source: 'jamendo',
  }));
}

/** Try each provider in order, returning the first that yields real tracks. */
async function tryProvidersForTerm(term, category, limit) {
  const attempts = [
    { name: 'itunes', run: () => fetchFromItunes(term, limit) },
    { name: 'deezer', run: () => fetchFromDeezer(term, limit) },
    { name: 'jamendo', run: () => fetchFromJamendo(category, limit) },
  ];

  for (const attempt of attempts) {
    try {
      const tracks = await attempt.run();
      if (tracks && tracks.length) return { source: attempt.name, tracks };
    } catch (err) {
      console.warn(`[musicService] ${attempt.name} failed, trying next provider:`, err.message);
    }
  }
  return null;
}

async function getMusicByMood(category, limit = 12) {
  const normalized = MUSIC_CATEGORIES.includes(category) ? category : 'chill';
  const term = CATEGORY_TO_TERM[normalized] || normalized;

  const result = await tryProvidersForTerm(term, normalized, limit);
  if (result) return result;

  // Every network provider failed (e.g. fully offline) — use local catalogue
  const localTracks = (fallbackCatalogue[normalized] || fallbackCatalogue.chill).map((t, idx) => ({
    id: `local-${normalized}-${idx}`,
    ...t,
    externalUrl: null,
    durationSeconds: null,
    source: 'local',
  }));
  return { source: 'local', tracks: localTracks };
}

async function searchMusic(query, limit = 12) {
  if (!query || !query.trim()) return { source: 'itunes', tracks: [] };

  const result = await tryProvidersForTerm(query, 'search', limit);
  if (result) return result;

  return { source: 'itunes', tracks: [] };
}

module.exports = { getMusicByMood, searchMusic, CATEGORY_TO_TERM };
