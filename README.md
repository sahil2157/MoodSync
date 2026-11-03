# MoodSync

**AI-Based Mood Detection and Personalized Wellness System**

MoodSync is a full-stack wellness platform that reads how you're feeling from
free-text input, and recommends personalized in-app activities — music,
mini-games, motivational quotes, an AI counsellor chat, and small goals — to
help you feel better. Everything happens inside MoodSync; you never need to
leave the app for music, quotes, or games.

> ⚠️ **Important:** MoodSync is a wellness and productivity tool. It does
> **not** diagnose, treat, or replace professional mental health care. If you
> or someone you know is in crisis, contact your local emergency number or a
> crisis helpline immediately (e.g. in the US, call or text **988**).

---

## 1. Features

- **Authentication** — register/login/logout, bcrypt password hashing, JWT
  auth, protected routes, editable profile & preferences.
- **Mood Detection** — free-text mood check-ins analyzed by a local NLP
  engine (or an optional LLM), returning emotion + confidence + intensity +
  a plain-language, non-clinical interpretation.
- **AI Counsellor Companion** — chat interface with 5 selectable
  personalities (Warm & Empathetic, Professional & Structured, Analytical &
  Insightful, Supportive & Encouraging, Creative & Expressive), mood-adaptive
  tone, and built-in crisis-language safety responses.
- **Recommendation Engine** — modular, rule-based logic mapping mood +
  intensity + recent history to music category, game, quote category, and a
  small suggested activity.
- **Music** — mood-based tracks via Apple's iTunes Search API (official,
  public, **zero API key required** — works immediately), with an optional
  Jamendo secondary source and a local fallback catalogue.
- **Motivational Quotes** — mood-matched quotes via API Ninjas, with a large
  local fallback bank; save favorites, get a new quote, or copy to clipboard.
- **Games** — 4 fully playable, in-app mini-games: Memory Match, Reaction
  Challenge, Word Scramble, Quick Quiz — each with scoring, timers where
  relevant, high scores, and session history.
- **Mood Journal** — free-write entries, auto-analyzed for emotion, with
  full history.
- **Dashboard** — current mood, confidence, intensity, a mood-trend line
  chart (Recharts), recommended music/game/quote/activity, goals summary,
  and recent journal entries.
- **Goals** — add/complete/delete small wellness or productivity goals with
  a progress bar.
- **Dark / Light mode**, responsive layout, loading/empty/error states, and
  toast notifications throughout.
- **Admin panel** — a protected `/admin` page (visible only to admin users)
  for managing accounts: search/filter users, view per-user activity
  (mood check-in counts), promote/demote the admin role, enable/disable
  accounts, and delete a user along with all of their data.

## What's new: multi-language, mood buttons, OpenAI counsellor

- **Multi-language UI** (English, हिन्दी, తెలుగు, தமிழ், বাংলা, Español, Français, العربية with RTL).
  Switcher is in the sidebar, on the mobile top bar, on the landing page and on login/register.
  Add a language: create `client/src/i18n/locales/xx.js`, import it in `client/src/i18n/index.jsx`.
  Missing keys fall back to English.
- **Mood picture buttons** on the Dashboard (one tap, no typing) -> `POST /api/mood/quick`, then instant
  music / game / quote / activity suggestions with a **Listen** (text-to-speech) button.
- **AI Counsellor on OpenAI** (`AI_MODEL`, default `gpt-4o`): replies in the user's own language and script,
  ~20 turns of memory, counselling-style system prompt, model-side crisis detection in any language
  plus a keyword safety net, voice typing (mic) and read-aloud.
  Set `AI_API_KEY` in `server/.env` (see `server/.env.example`). Without a key an English-only local fallback is used.

---

## 2. Architecture

```
Browser (React/Vite SPA)
        │  REST (axios, JWT bearer token)
        ▼
Express API (Node.js)
   ├── controllers/  → request handling
   ├── services/     → business logic (NLP, recommendations, music, quotes, chat)
   ├── models/       → Mongoose schemas
   ├── middleware/   → auth (JWT), validation, error handling
   └── routes/       → REST endpoints
        │
        ▼
MongoDB (Mongoose ODM)

External APIs (server-side only, keys never sent to the browser):
   - Jamendo (music)      — optional, falls back to local catalogue
   - API Ninjas (quotes)  — optional, falls back to local quote bank
   - OpenAI-compatible LLM (chat/emotion upgrade) — optional, falls back to local logic
```

The **AI/NLP layer is modular by design**: every caller goes through
`classifyEmotion(text)` and `generateReply(...)`, so the local rule-based
engine can be swapped for a hosted LLM (already wired via `AI_API_KEY`) or a
custom trained model later, with zero changes to controllers or the frontend.
See [`ml/README.md`](./ml/README.md) for details.

---

## 3. Technology stack

| Layer          | Technology                                                    |
|----------------|----------------------------------------------------------------|
| Frontend       | React 18, Vite, React Router, Axios, Recharts, plain CSS       |
| Backend        | Node.js, Express.js, REST                                      |
| Database       | MongoDB, Mongoose                                               |
| Auth           | JWT (jsonwebtoken), bcryptjs                                    |
| AI / NLP       | Local lexicon-based classifier + optional LLM (OpenAI-compatible) |
| Music API      | Jamendo (official free API)                                     |
| Quotes API     | API Ninjas (with local fallback)                                 |
| Security       | helmet, express-mongo-sanitize, express-rate-limit, express-validator |
| Testing        | Jest, Supertest, mongodb-memory-server                          |

---

## 4. Folder structure

```
moodsync/
├── client/                     # React/Vite frontend
│   └── src/
│       ├── components/         # Navbar, Loading/Empty/Error states, MoodBadge, games/
│       ├── pages/               # Home, Login, Register, Dashboard, MoodCheck, Counsellor,
│       │                       #   Music, Games, GamePlay, Quotes, Journal, Goals, Profile
│       ├── services/            # axios API clients (one file per resource)
│       ├── context/             # AuthContext, ThemeContext, ToastContext
│       ├── styles/               # global.css (design tokens, dark/light theme)
│       ├── App.jsx / main.jsx
│
├── server/                     # Express backend
│   ├── controllers/             # request handlers
│   ├── routes/                  # REST route definitions
│   ├── models/                  # Mongoose schemas (User, Mood, Journal, Goal, Quote,
│   │                             #   FavoriteQuote, GameSession, Recommendation, ChatMessage)
│   ├── middleware/               # auth.js (JWT), validate.js, errorHandler.js
│   ├── services/                 # emotionService, chatService, recommendationService,
│   │                             #   musicService, quoteService
│   ├── data/                     # local fallback data (quotes, music, quiz Qs, word list)
│   ├── config/                   # db.js, constants.js
│   ├── tests/                    # Jest test suites
│   └── server.js
│
├── ml/                          # Documentation for the NLP pipeline & upgrade path
│
├── .env.example
├── package.json                 # root scripts (runs client+server together)
└── README.md
```

---

## 5. Prerequisites

- **Node.js** v18+ and npm
- **MongoDB** — either:
  - a local install (`mongodb://localhost:27017/moodsync`), or
  - a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 6. Installation

```bash
# 1. Clone / unzip the project, then from the project root:
cd moodsync

# 2. Install all dependencies (root, server, client)
npm run install:all

# 3. Create your environment file
cp .env.example server/.env
# then edit server/.env and fill in MONGO_URI, JWT_SECRET, and (optionally) the API keys below
```

### MongoDB setup

- **Local:** install MongoDB Community Edition, start it (`mongod`), and use
  `MONGO_URI=mongodb://localhost:27017/moodsync`.
- **Atlas (cloud, free tier):** create a cluster at
  https://www.mongodb.com/cloud/atlas, create a database user, allow your IP,
  and copy the connection string into `MONGO_URI`.

### Required / optional API keys

| Variable         | Required? | Where to get it                                              | If missing…                       |
|-------------------|-----------|----------------------------------------------------------------|-------------------------------------|
| `MONGO_URI`       | Yes       | Local MongoDB or MongoDB Atlas                                  | App cannot persist data             |
| `JWT_SECRET`      | Yes       | Any long random string (`openssl rand -base64 48`)              | Auth cannot function                |
| `MUSIC_API_KEY`   | No        | Not needed — iTunes Search API requires no key. Optional Jamendo Client ID at https://devportal.jamendo.com/ for an extra source | Skips Jamendo, iTunes still works   |
| `QUOTE_API_KEY`   | Optional  | Free key at https://api-ninjas.com/api/quotes                   | Quotes fall back to local bank      |
| `AI_API_KEY`      | Optional  | An OpenAI-compatible API key (e.g. OpenAI)                       | Chat & mood analysis use local NLP  |

The app is **fully functional with zero API keys** beyond `MONGO_URI` and
`JWT_SECRET` — music works immediately via iTunes with no signup, and every
other external integration has a working local fallback.

### Creating your first admin account

MoodSync has no separate admin signup — an admin is just a regular user
account with `role: "admin"`. There are two ways to create your first one:

**Option A — before you register:**
Add your email to `ADMIN_EMAILS` in `server/.env` (comma-separated if you
want more than one), e.g.:
```
ADMIN_EMAILS=you@example.com
```
Then register normally through the app — that account is automatically
created with the admin role.

**Option B — promote an account that already exists:**
```bash
cd server
node scripts/promoteAdmin.js you@example.com
```
(Requires `MONGO_URI` to already be set in `server/.env`.)

Once you're an admin, an **Admin** link appears in the sidebar/nav, leading
to `/admin`, where you can search users, promote/demote roles, enable or
disable accounts, and delete users (which also removes all of their moods,
journal entries, goals, game sessions, etc.). For safety, an admin cannot
change their own role/active status or delete their own account from the
panel — use a second admin account for that, or `promoteAdmin.js` directly
against the database.

---

## 7. Running the app

### Development (frontend + backend together)

From the project root:

```bash
npm run dev
```

This starts the Express API on **http://localhost:5000** and the Vite dev
server on **http://localhost:5173** (which proxies `/api` requests to the
backend — see `client/vite.config.js`).

### Running them separately

```bash
# Backend only
cd server
npm install
npm run dev        # nodemon, auto-restarts on changes
# or: npm start     # plain node

# Frontend only (in a second terminal)
cd client
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

### Running the ML documentation module

The emotion-classification logic runs inside the Node server (no separate
process needed). `ml/README.md` documents the pipeline and how to upgrade it
to a hosted/trained model later — there is nothing separate to "run".

---

## 8. Building for production

```bash
# Build the frontend static assets
cd client
npm run build         # outputs to client/dist

# Serve client/dist with any static host (Netlify, Vercel, nginx, etc.),
# and deploy server/ to any Node host (Render, Railway, EC2, etc.) with
# your real environment variables set (never commit server/.env).
```

If you deploy the frontend and backend on different origins, set
`VITE_API_URL` (e.g. `https://api.yourdomain.com/api`) when building the
client, and set `CLIENT_URL` on the server to your deployed frontend origin
so CORS is configured correctly.

---

## 9. API reference

All routes are prefixed with `/api`. Routes marked 🔒 require an
`Authorization: Bearer <token>` header.

```
POST   /auth/register
POST   /auth/login
GET    /auth/me                       🔒
PUT    /auth/me                       🔒

POST   /mood/analyze                  🔒
GET    /mood/history                  🔒
GET    /mood/latest                   🔒

POST   /journal                       🔒
GET    /journal                       🔒
DELETE /journal/:id                   🔒

GET    /music/recommendations         🔒
GET    /music/search                  🔒

GET    /quotes/random
GET    /quotes/mood/:mood
POST   /quotes/favorite               🔒
GET    /quotes/favorites              🔒
DELETE /quotes/favorite/:id           🔒

GET    /games                         🔒
GET    /games/assets/:type            🔒
POST   /games/session                 🔒
GET    /games/history                 🔒

POST   /chat                          🔒
GET    /chat/history                  🔒

GET    /recommendations               🔒
PUT    /recommendations/:id/feedback  🔒

POST   /goals                         🔒
GET    /goals                         🔒
PUT    /goals/:id                     🔒
DELETE /goals/:id                     🔒

GET    /admin/stats                   🔒 (admin only)
GET    /admin/users                   🔒 (admin only)
GET    /admin/users/:id               🔒 (admin only)
PUT    /admin/users/:id               🔒 (admin only)
DELETE /admin/users/:id               🔒 (admin only)

GET    /health                        (no prefix beyond /api)
```

---

## 10. Testing

```bash
cd server
npm test
```

This runs the Jest suite covering:
- Local NLP emotion classifier (`emotion.test.js`)
- Recommendation engine logic (`recommendation.test.js`)
- Auth flow — register/login/protected routes (`auth.test.js`, uses an
  in-memory MongoDB via `mongodb-memory-server`)
- Mood analysis API (`mood.test.js`, uses in-memory MongoDB)

> Note: `auth.test.js` and `mood.test.js` use `mongodb-memory-server`, which
> downloads a MongoDB binary the first time it runs. If your network blocks
> that download, run `npx jest emotion.test.js recommendation.test.js` to
> exercise the pure-logic suites, which have no external dependency.

---

## 11. Troubleshooting

- **"MongoDB connection error" in server logs** — check `MONGO_URI` in
  `server/.env`, confirm MongoDB is running (local) or your IP is allow-listed
  (Atlas). The API will still boot, but any DB-backed route will return an
  error until this is fixed.
- **401 responses on every request** — your JWT token expired or
  `JWT_SECRET` was changed after the token was issued; log out and back in.
- **Music/Quotes showing local/fallback data** — this is expected without
  `MUSIC_API_KEY` / `QUOTE_API_KEY`; add them to `server/.env` and restart the
  server for live data.
- **CORS errors in the browser console** — confirm `CLIENT_URL` in
  `server/.env` matches the exact origin your frontend is served from.
- **Port already in use** — change `PORT` in `server/.env` (backend) or pass
  `--port` to `vite` (frontend), and update the Vite proxy / `VITE_API_URL`
  accordingly.

---

## 12. Future scope

- Replace the lexicon-based NLP classifier with a fine-tuned transformer
  model (see `ml/README.md` for the upgrade path already designed in).
- Add a real-time notifications/reminders system for goals and check-ins.
- Collaborative filtering or contextual-bandit based recommendations using
  the `Recommendation.feedback` field already being collected.
- Voice-based mood check-ins (speech-to-text → same NLP pipeline).
- Native mobile app sharing the same REST API.

---

## 13. Security notes

- Passwords are hashed with bcrypt (never stored in plain text).
- All user-specific routes are protected by JWT middleware
  (`server/middleware/auth.js`).
- Input is validated (`express-validator`) and sanitized
  (`express-mongo-sanitize`) against NoSQL injection.
- Rate limiting is applied to all `/api` routes.
- `helmet` sets protective HTTP headers.
- **No API keys are ever sent to or stored in the frontend** — all
  third-party calls (Jamendo, API Ninjas, LLM) happen only in
  `server/services/*.js`.
