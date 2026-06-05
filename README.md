# The London Circularity Map

A community directory and interactive map of sustainable initiatives, circular economy businesses, repair cafes, skills workshops, and green projects across London.

## Project Structure

```
london-circularity-map/
├── index.html          ← Main page (HTML structure only)
├── css/
│   └── style.css       ← All styles
├── js/
│   ├── db.js           ← Database config & data access layer
│   └── app.js          ← All application logic
├── setup/
│   ├── schema.sql      ← Run once in Supabase to create the table
│   └── seed.sql        ← Run once to populate the 60 starter entries
└── README.md
```

---

## Quick Start (GitHub Pages — no database)

The site works immediately without any setup. It runs in **demo mode** using the 60 built-in seed entries. New submissions appear on screen but are not saved between sessions.

1. Push this folder to a GitHub repository
2. Go to **Settings → Pages** in your repo
3. Set Source to **Deploy from a branch** → `main` → `/ (root)`
4. Your site will be live at `https://YOUR_USERNAME.github.io/REPO_NAME`

---

## Setting Up the Database (5 minutes)

To make new submissions persist, connect a free [Supabase](https://supabase.com) database.

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New Project**, choose a name and region (EU West for London)
3. Wait ~2 minutes for provisioning

### Step 2 — Create the database table

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Paste the contents of `setup/schema.sql` and click **Run**

### Step 3 — Seed the starter data

1. Still in the SQL Editor, create another new query
2. Paste the contents of `setup/seed.sql` and click **Run**
3. You should see 60 rows inserted

### Step 4 — Get your API credentials

1. Go to **Project Settings → API** in your Supabase dashboard
2. Copy the **Project URL** (looks like `https://abcdefgh.supabase.co`)
3. Copy the **anon / public** key (the long JWT string)

### Step 5 — Configure the site

Open `js/db.js` and replace the two placeholder values at the top:

```js
const DB_CONFIG = {
  url: "https://YOUR-PROJECT-ID.supabase.co",  // ← paste your Project URL
  anonKey: "eyJ..."                             // ← paste your anon key
};
```

Save, commit, and push. The yellow setup banner will disappear and new submissions will now be saved permanently.

> **Is it safe to commit the anon key?** Yes. Supabase's anon key is specifically designed to be public. The Row Level Security (RLS) policies in `schema.sql` restrict it to read + insert only — nobody can delete or modify entries through the public API.

---

## Moving to a Custom Domain

Once your site is on GitHub Pages, pointing a custom domain at it takes about 10 minutes.

### Option A — Domain bought via Namecheap, GoDaddy, etc.

1. In your GitHub repo, go to **Settings → Pages**
2. Under **Custom domain**, enter your domain (e.g. `londoncircularitymap.org`) and click Save
3. GitHub will show you 4 IP addresses — add these as **A records** in your domain registrar's DNS settings:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
4. Also add a **CNAME record**: `www` → `YOUR_USERNAME.github.io`
5. DNS changes take up to 48 hours to propagate (usually under an hour)
6. Enable **Enforce HTTPS** in GitHub Pages settings once the domain is verified

### Option B — Cloudflare (recommended for performance + free SSL)

1. Add your domain to [Cloudflare](https://cloudflare.com) (free plan)
2. Update your registrar's nameservers to Cloudflare's
3. In Cloudflare DNS, add the same 4 A records above with **Proxy status: DNS only** (grey cloud)
4. Follow the same GitHub Pages custom domain steps above

### Choosing a domain registrar

Good options for UK residents:
- **Namecheap** — cheap, straightforward DNS management
- **Gandi** — privacy-first, no upsells
- **Cloudflare Registrar** — at-cost pricing, easiest if you're already using Cloudflare
- **.org.uk** or **.co.uk** domains (~£5–10/year) are appropriate for this kind of community project

---

## Moderating Submissions

Anyone can submit entries, but you can review and delete them from the Supabase dashboard:

1. Go to **Table Editor → entries** in your Supabase dashboard
2. You can sort, filter, and delete any row directly from the UI
3. For bulk moderation, use the SQL Editor: `delete from entries where id = 123;`

---

## Local Development

Because the JS uses ES modules (`type="module"`), you need a local server — opening `index.html` directly in the browser won't work. The simplest options:

```bash
# Python (usually pre-installed on Mac/Linux)
python3 -m http.server 8000

# Node.js
npx serve .

# VS Code
# Install the "Live Server" extension and click "Go Live"
```

Then open `http://localhost:8000` in your browser.
