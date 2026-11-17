<h1 align="center">CITY ENERGY LAB — Website Maintenance Guide</h1>

<p align="center">
  <a href="README.ko.md">한국어</a> · <a href="README.en.md">English</a> · <a href="README.md">中文</a>
</p>

<p align="center">How to change the lab website — no coding needed</p>

> **This guide is for lab members and student assistants.** You only need a browser; nothing to install.
> Most of the work is the three tasks in §1.

| Item | Value |
| --- | --- |
| Live site | https://city-energy-lab.pages.dev/ |
| Repository | https://github.com/LiliLIN0324/cityenergylab |
| Hosting | Cloudflare Pages (project `city-energy-lab`, branch `main`) |
| Database | Cloudflare D1 `cityenergylab-db` — separate from the pages (§6.5) |
| Contact | **@LiliLIN0324** — if you get stuck, see §7 |

**Contents**: §1 three tasks · §2 which file · §3 undo a mistake · §4 check the deploy · §5 five rules · §6 admin/advanced · §7 contact

---

## 1. Three tasks cover almost everything

### 1.1 Change one line of text (in the browser, nothing to install)

1. Open the page you want to change, e.g. https://city-energy-lab.pages.dev/contact/
2. Find the sentence on the page with `Ctrl + F`. Example: `02-880-9368`
3. Open the **source file** on GitHub. The `/contact/` part of the URL is the file path →
   https://github.com/LiliLIN0324/cityenergylab/blob/main/public/contact/index.html
4. Click the **pencil icon** (Edit this file) → `Ctrl + F` the sentence from step 2.
5. Change **only the text between tags**.
   - Do: `<h3>Contact Us</h3>` → `<h3>Contact</h3>`
   - Don't touch: `class="..."`, `id="..."`, `<div>`, `</div>`, `<img ...>`
6. Scroll down → **Commit changes...** → write a one-line message (e.g. `update contact phone`) → **Commit changes**
7. Wait 1–2 minutes → verify in §4

> **Folder name = URL.** The page `/team-members/` is the file `public/team-members/index.html`.
> The full mapping is in §2.

### 1.2 Replace one photo

1. Rename the new photo **exactly like the old one** (most important — e.g. `seminar.jpg`).
2. Open the photo folder on GitHub: `public/wp-content/uploads/<year>/<month>/`
   e.g. https://github.com/LiliLIN0324/cityenergylab/tree/main/public/wp-content/uploads/2026/03
3. Top right → **Add file** → **Upload files** → drag the photo in → same name means it overwrites → **Commit changes**
4. After 1–2 minutes, hard-refresh the site with `Ctrl + F5`

- Keep photos **under 2 MB**; large images make the site slow.
- For now, use **only the "same file name" method**. If you rename the file, the HTML `src` must change too.
- If the aspect ratio is very different from the original, the photo may look cropped.

### 1.3 Add a news post

1. **Create the folder**: **Add file** → **Create new file** → type
   `2026-03-new-seminar/index.html` in the filename box; GitHub creates the folder for you.
2. Open an existing post (e.g. `public/2025-first-lab-meeting-and-farewell-dinner-with-alumni/index.html`),
   copy its full content, paste it into the new file.
3. Edit: `<title>`, the `<h1>` heading, the date line, body paragraphs, image paths (`src="..."`).
4. Add a link on the news list `public/news/index.html`: copy one existing entry block and change
   `href="/2026-03-new-seminar/"` and its text.
   ⚠️ That file is about 470 KB, so the **web editor is very slow** on it. If the browser struggles, use the
   local setup in §6.2 or ask the contact person.
5. **Commit changes** → check after 1–2 minutes.

- A post's URL is its **folder name**. Use lowercase letters, digits and hyphens only (no spaces, no Korean/Chinese).
- Step 4 is required, otherwise the post exists but nobody can find it from the news list.

---

## 2. Which file do I edit?

| What you want to change | File | Note |
| --- | --- | --- |
| Home page | `public/index.html` | the first screen visitors see |
| News **list** | `public/news/index.html` | all posts in one file (~470 KB, slow in web editor) |
| One news **post** | `public/<post-slug>/index.html` | folder name is the URL |
| Team members | `public/team-members/index.html` | one repeated block per person |
| Alumni / previous members | `public/previous-members/index.html` | |
| Publications | `public/publications/index.html` | |
| Contact | `public/contact/index.html` | phone, e-mail, address |
| Photos | `public/wp-content/uploads/<year>/<month>/` | keep the file name |
| Research / projects | `public/research/index.html`, `public/projects/index.html` | "UNDER CONSTRUCTION" on the old site too |

**URL → file rule**: `https://city-energy-lab.pages.dev/team-members/` → `public/team-members/index.html`

> The member and publication lists are **not generated from the database**. They are hand-written HTML,
> so the page only changes when you edit the HTML. (The D1 database only feeds `/api/*` — see §6.5.)

---

## 3. Undo a mistake

Good news first: **everything can be undone.** Deleted text is restored with §3.1.

### 3.1 Undo a commit you just made

**Option A — in the browser (nothing to install, the usual case)**

1. On the file's GitHub page, click **History** (top right)
2. Click the commit **before** your change → the **red deleted lines** are the old text → copy them
   (to restore the **whole** file: on that commit page click `<>` *Browse files* → open the file → **Raw** → `Ctrl + A`, `Ctrl + C`)
3. Go back to the current file (`.../blob/main/...`) → pencil icon → paste → **Commit changes**
4. After 1–2 minutes, hard-refresh with `Ctrl + F5`

**Option B — GitHub Desktop (GUI, fastest once set up)**

1. Open the repository in GitHub Desktop → **History** tab
2. Right-click the bad commit → **Revert changes in commit**
3. Click **Push origin** → check after 1–2 minutes

**Option C — terminal**

```bash
git log --oneline -5                 # find the bad commit hash, e.g. 0983f5b
git revert <commit-hash>             # creates a new commit that undoes it
git push origin main
```

Undo **a single file**:

```bash
git restore --source=<commit-hash> -- public/news/index.html
git commit -m "restore news page"
git push origin main
```

### 3.2 A photo is broken (broken-image icon)

1. Right-click the broken image → **Copy image address** → note the path: `/wp-content/uploads/2026/03/xxx.jpg`
2. Check on GitHub whether that file **exists**. If not, upload it again (§1.2) with the **exact** name.
3. If the file exists but the image is still broken, the HTML `srcset="..."` probably points at a deleted
   size variant. Delete `srcset="..."` and `sizes="..."` from that `<img>` tag so only `src` is used.
4. Still broken? Contact §7 with a screenshot and the page URL.

### 3.3 A new page returns 404

- The folder must contain **`index.html`**.
- The folder name is the URL and is **case-sensitive** (`About` ≠ `about`). Use lowercase only.

### 3.4 If nothing works

Do **not** keep editing. Leave it as it is and contact §7 with the last good commit hash
(see GitHub **Commits** or `git log`). It can be restored in a minute.

---

## 4. Check that your change is live

1. Repository → **Actions** tab → click the top run
2. **Green check** = deployed (usually 1–2 minutes)
3. On the site press `Ctrl + F5`. Still the old version? Try a private/incognito window.
4. **Red X** = deploy failed → open the run, screenshot the red step, send it to §7
5. **Yellow warning / skipped** = the repo has no `CLOUDFLARE_API_TOKEN` secret, so the deploy was skipped → tell the contact person

---

## 5. Five rules you must keep

1. **Edit only `public/`.** (`functions/`, `migrations/` are admin territory — §6)
2. **Never run `node make-project.js`.** It deletes `public/` and copies a local `site/` over it. (`site/` is not in the repository)
3. **Change text only; never remove tags, `class`, `id` or `style`.** Removing them breaks the layout.
4. **New files and folders: lowercase ASCII letters, digits, hyphens only.** No spaces, no Korean/Chinese, no capitals.
5. **Photos ≤ 2 MB, and keep the existing file name.**

---

## 6. Admin / advanced (read only when needed)

### 6.1 Repository layout

| Path | What it is | Edit? |
| --- | --- | --- |
| `public/` | **The content.** One folder per page with `index.html`; this folder is deployed | ✅ only here |
| `functions/api/` | JSON API reading D1 (`/api/members`, …) | only when changing the API |
| `migrations/` | D1 schema and seed SQL | for database work |
| `wrangler.toml` | Cloudflare project config + D1 binding | rarely |
| `.github/workflows/deploy.yml` | deploys on every push to `main` | admin only |
| `make-project.js` | deletes `public/`, copies `site/`, regenerates `functions/`, `wrangler.toml`, `.gitignore` | ❌ never (re-crawl only) |
| `site/` | scratch copy made while crawling the old site; **not in the repo** (`.gitignore`) | ❌ do not commit |
| `lib/`, `crawl*.js`, `build-data.js` | one-time migration scripts | ❌ |

### 6.2 Local setup (optional)

Only for work that is painful in the web editor (large files, many photos, copying folders):

```bash
git clone https://github.com/LiliLIN0324/cityenergylab.git
cd cityenergylab
git config core.longpaths true   # Windows only — WordPress paths are very long
```

After editing:

```bash
git add -A
git commit -m "content: add 2026-03 seminar news"
git push origin main
```

### 6.3 Manual deploy (when Actions is unavailable)

```bash
npx wrangler login
npx wrangler pages deploy public --project-name city-energy-lab --branch main
```

Expected output: `✨ Deployment complete! ...`
⚠️ Do not run `node make-project.js` first — it replaces `public/` with your local `site/`.

### 6.4 How the automatic deploy works

Push to `main` → `.github/workflows/deploy.yml` → uploads the committed `public/` **with no build step** →
https://city-energy-lab.pages.dev/. In other words **what you commit is what goes live.**

Required repository secret: `CLOUDFLARE_API_TOKEN`
(Cloudflare → *My Profile* → *API Tokens* → *Create Custom Token*, permissions **Account · Cloudflare Pages · Edit** + **Account · Account Settings · Read**)

### 6.5 D1 database (does not affect the pages)

```bash
npx wrangler d1 execute cityenergylab-db --remote --command "SELECT name, role FROM members"
npx wrangler d1 execute cityenergylab-db --remote --file=migrations/0003_update.sql
npx wrangler d1 export cityenergylab-db --remote --output backup-2026-03.sql   # back up before bulk edits
```

Tables: `lab_profile`, `members`, `alumni`, `publications`, `news`, `research_areas`, `projects`, `courses`, `pages`, `contact_messages`
API example: https://city-energy-lab.pages.dev/api/members
**Note**: changing the database does **not** change the pages (they are static HTML). Edit the HTML as well.

### 6.6 Contact form messages

```bash
npx wrangler d1 execute cityenergylab-db --remote \
  --command "SELECT * FROM contact_messages ORDER BY id DESC LIMIT 20"
```

### 6.7 Re-crawl the old site (admin only, destructive)

Run this **only on the original machine that has `site/`**. `public/` is deleted and regenerated.

```bash
node crawl.js && node crawl2.js && node build-data.js && node make-project.js
```

### 6.8 Handover checklist

1. GitHub → *Settings* → *Collaborators* → add the person with *Write*
2. Cloudflare → *Manage Account* → *Members* → invite with *Pages Edit* + *D1 Edit*
3. Send them this file (`README.en.md`) and the repository URL
4. First task: let them do §1.1 (one line of text) to confirm the browser-only path works
5. Nothing else to connect — Actions already deploys; the Pages project is a *Direct Upload* project, so it cannot be Git-connected

---

## 7. Contact

- **Maintainer (repository owner): @LiliLIN0324** — GitHub Issues or direct message
  - Open an issue: https://github.com/LiliLIN0324/cityenergylab/issues
- Lab contact: `sjquan@snu.ac.kr` · `02-880-9368`
- When you ask for help, include:
  1. the **page URL** with the problem
  2. **what** is wrong (photo missing / text garbled / news not showing, …)
  3. a **screenshot**
  4. the **last thing you did** (e.g. "added a link on the news list and committed")

Known, intentional gaps (identical to the old site):

- 8 gallery images returned **404 on the original server** and are therefore absent here.
- `research` and `projects` pages still say "UNDER CONSTRUCTION" — that is how the original site was.
