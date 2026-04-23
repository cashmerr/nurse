# Nurse on the Beach 🌴

Lisa's bilingual nursing-on-the-beach webapp for the Riviera Romagnola — Gatteo a Mare, Cesenatico, Milano Marittima.

Static frontend hosted on Cloudflare, bookings and slot availability synced across devices via Firebase Realtime Database. When a client books, it's saved to Firebase and opens WhatsApp with a pre-filled message.

---

## 📁 Project structure

```
nurse-on-the-beach/
├── public/                      ← everything Cloudflare serves
│   ├── index.html               ← main page
│   ├── _headers                 ← Cloudflare cache + security headers
│   └── assets/
│       ├── styles.css
│       ├── app.js               ← all logic (i18n, calendar, Firebase, admin)
│       ├── favicon.svg
│       ├── lisa-hero.jpg
│       └── lisa-about.jpg
├── wrangler.toml                ← Cloudflare config
├── package.json
├── FIREBASE_SETUP.md            ← 5-min Firebase setup guide
├── README.md
└── .gitignore
```

---

## ⚙️ First-time setup (15 minutes total)

### 1. Create the Firebase project (5 min)

Follow **`FIREBASE_SETUP.md`** step by step. You'll end up with a database URL like:

```
https://nurse-on-the-beach-default-rtdb.europe-west1.firebasedatabase.app
```

### 2. Edit `public/assets/app.js`

Near the top of the file:

```js
const LISA_WHATSAPP   = '393000000000';    // ← Lisa's WhatsApp number (digits only, no +)
const ADMIN_PIN       = '1234';             // ← change the admin PIN
const FIREBASE_DB_URL = '';                 // ← paste the Firebase URL from step 1
```

**If you leave `FIREBASE_DB_URL` empty**, the app falls back to localStorage (single-device, useful for local dev). The moment you paste a URL in, it switches to multi-device mode automatically.

### 3. Deploy to Cloudflare

```bash
npm install
npx wrangler login                    # one-time, opens browser
npm run deploy:pages                  # same flow as Fetch
```

First run will ask you to create a Pages project called `nurse-on-the-beach`. After that, every `npm run deploy:pages` pushes an update. You'll get a `*.pages.dev` URL — map a custom domain through the Cloudflare dashboard if you want.

---

## 🌐 What the app does

### For clients
- **Bilingual** — IT/EN toggle, remembered, auto-detects browser language on first visit
- **Six services** with solid-colour icons (wound care, injections, IV, sunburn, vitals, post-op)
- **Calendar with dots** — a small teal dot appears on any day Lisa has set available times
- **Time slot picker** — only shows times Lisa has actually added
- **Booking form** — saves to Firebase, then opens WhatsApp with a pre-filled message

### For Lisa (admin)
- `Lisa: manage →` link bottom-right of the booking card
- Enter PIN → panel opens with two tabs:
  1. **Bookings** — every booking across all devices in real time, delete as needed
  2. **Available slots** — for each of the next 14 days, add/remove available times
- Changes sync immediately to every device
- Small toast notification confirms each save

---

## 🧪 Develop locally

```bash
# Option A: no Firebase, just localStorage (quickest)
cd public && python3 -m http.server 8000

# Option B: full Cloudflare Workers dev server with hot reload
npm install
npm run dev
```

Local dev works with or without Firebase — with no URL set, it falls back to localStorage automatically. For testing the Firebase wiring, set the URL in `app.js` and just reload.

---

## 🚀 Deploy paths

### Cloudflare Pages (recommended — same as Fetch)

```bash
npm run deploy:pages
```

### Cloudflare Workers static assets (Cloudflare's newer path)

```bash
npm run deploy
```

### Git-based auto-deploy

Push to GitHub, then Cloudflare dashboard → Workers & Pages → Create → connect repo:
- **Build command**: leave empty (or `exit 0`)
- **Build output directory**: `public`

Every `git push` will deploy.

---

## 🔒 Security model

This is a deliberately simple setup:
- Firebase database is publicly readable and writable
- Admin UI is gated behind a client-side PIN
- No sensitive data stored (names, phone numbers, times — nothing medical, nothing financial)

Tradeoff: a motivated attacker who finds the Firebase URL could spam or wipe the database. For a small beach-season booking app, this is an acceptable tradeoff. If it ever becomes an issue, the upgrade path is a Cloudflare Worker proxy in front of Firebase — happy to add that later.

See `FIREBASE_SETUP.md` for more detail on the tradeoffs.

---

## 📊 Data structure in Firebase

```
nurse-on-the-beach-default-rtdb
├── slots
│   ├── 2026-07-15: ["09:00", "11:00", "14:00"]
│   └── 2026-07-16: ["10:00", "15:00"]
└── bookings
    ├── 1713880123456: {
    │     id, name, phone, service, area, where, notes,
    │     date, time, createdAt, lang
    │   }
    └── 1713880456789: { ... }
```

You can manually edit or delete entries in the Firebase console (Data tab) if ever needed — handy for testing or cleanup.

---

## 📝 Future v3 ideas (not built)

- Telegram notification to Lisa when a booking comes in (reuse Fetch's bot pattern)
- Cloudflare Worker proxy in front of Firebase for tighter security
- Firebase Anonymous Auth so writes require the PIN to actually work at the DB level
- SMS confirmation to the client
- Calendar integration (ICS download) so bookings appear in Lisa's phone calendar

Just say the word.
