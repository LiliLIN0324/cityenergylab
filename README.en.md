# CITY ENERGY LAB — Website Operations Guide

[English](README.en.md) · [한국어](README.ko.md) · [中文](README.md)

This repository contains the lab website: a static mirror of the original WordPress site
(`https://cityenergylab.cafe24.com/`) deployed on **Cloudflare Pages**, plus lab data stored in
**Cloudflare D1** and served as JSON through Pages Functions.

| Item | Value |
| --- | --- |
| Live site | https://city-energy-lab.pages.dev/ |
| GitHub repository | https://github.com/LiliLIN0324/cityenergylab |
| Hosting | Cloudflare Pages, project `city-energy-lab`, branch `main` |
| Database | Cloudflare D1, `cityenergylab-db` |

This guide is written for lab members and student assistants who are **not** web developers.
It explains how to change text, replace a photo, add a news post, update the database, and publish.

---

## 1. Access you need

| What | Why | How to get it |
| --- | --- | --- |
| GitHub account with **write** access to the repo | edit and push content | repo owner: GitHub → Settings → Collaborators → *Add people* |
| Cloudflare account with **Pages Edit** + **D1 Edit** | deploy and change the database | Cloudflare dashboard → Manage Account → Members → *Invite* |
| Node.js 18 or newer (20 recommended), Git | run the build/deploy commands | https://nodejs.org/ |

One-time setup on your computer:

```bash
git clone https://github.com/LiliLIN0324/cityenergylab.git
cd cityenergylab
git config core.longpaths true    # Windows only — WordPress paths are very long
npx wrangler login                # opens a browser, sign in to Cloudflare
```

---

## 2. Repository layout

| Path | What it is | Do you edit it? |
| --- | --- | --- |
| `site/` | **The real content.** Plain HTML/CSS/images, one folder per page | ✅ yes, edit here |
| `public/` | Generated output that gets deployed | ❌ never — it is deleted and rebuilt |
| `functions/api/` | JSON API (`/api/members`, `/api/publications`, …) reading D1 | only if you change the API |
| `migrations/` | SQL schema and seed data for D1 | for database changes |
| `wrangler.toml` | Cloudflare project config + D1 binding | rarely |
| `make-project.js` | Copies `site/` → `public/` and regenerates `functions/` | no |
| `lib/`, `crawl*.js`, `build-data.js` | One-time migration scripts used to copy the old site | no |

---

## 3. The one rule

> **Edit `site/`. Never edit `public/`.**

`node make-project.js` deletes `public/` completely and copies `site/` into it.
Anything you typed directly into `public/` is lost the next time the project is rebuilt.

---

## 4. Everyday tasks

### 4.1 Change text on an existing page

Every page is a folder with an `index.html` inside:

| Page | File |
| --- | --- |
| News list | `site/news/index.html` |
| Team members | `site/team-members/index.html` |
| Previous members | `site/previous-members/index.html` |
| Publications | `site/publications/index.html` |
| Contact | `site/contact/index.html` |
| A single news post | `site/<post-slug>/index.html` |

1. Open the file in any text editor (VS Code, Notepad++, …).
2. Change **only the text between tags**. Leave `class="…"`, `id="…"` and `style="…"` untouched —
   they carry the layout.
3. Save, then rebuild and deploy (§5).

### 4.2 Replace a photo

1. Put the new file under `site/wp-content/uploads/<year>/<month>/`
   (for example `site/wp-content/uploads/2026/03/seminar.jpg`).
2. Easiest: keep the **same file name** as the old photo. Nothing else has to change.
3. If you use a new name or a different aspect ratio: WordPress pages list several resized
   variants in `srcset` (e.g. `photo-768x1024.jpg`). Either supply matching variants, or delete the
   `srcset="…"` and `sizes="…"` attributes from that `<img>` so browsers use `src` only.
4. Keep photos under ~2 MB when possible — large images slow the site down.

### 4.3 Add a news post

1. Copy an existing post folder as a template (PowerShell):

   ```powershell
   Copy-Item -Recurse "site\2025-first-lab-meeting-and-farewell-dinner-with-alumni" "site\2026-03-new-seminar"
   ```

2. Edit `site/2026-03-new-seminar/index.html`: the `<title>`, the `<h1>` heading, the date line,
   the body paragraphs, and any image paths.
3. Add a link on the news list `site/news/index.html`: copy one existing entry block and change
   its `href="/2026-03-new-seminar/"` and its text.
4. Rebuild and deploy (§5).

> The URL of a post is simply its folder name. Use lowercase letters, digits and hyphens only —
> avoid Korean, Chinese or spaces in new folder names.

### 4.4 Update the members or publications list

These pages are hand-written HTML tables/cards, not generated from the database:
edit `site/team-members/index.html` or `site/publications/index.html` directly (§4.1).

### 4.5 Update the data behind `/api/*`

The database **does not** drive the visible pages — it only feeds the JSON API.
Changing D1 updates `https://city-energy-lab.pages.dev/api/members` etc., but the page will look
exactly the same. If a change must appear on the site, edit the HTML as well.

---

## 5. Build and deploy

```bash
node make-project.js
npx wrangler pages deploy public --project-name city-energy-lab --branch main
```

Expected output:

```
public/ 已生成
functions/ 已生成: 12 个文件
✨ Deployment complete! Take a peek over at https://<hash>.city-energy-lab.pages.dev
```

The production address stays **https://city-energy-lab.pages.dev/**.

> ⚠️ **This Pages project is not connected to GitHub** (Git Provider: No).
> `git push` does **not** update the live site. You must run the deploy command above.
> (You may connect it later in Cloudflare → Pages → `city-energy-lab` → Settings → Build &
> deployments; then set *Build output directory* to `public` and leave the build command empty.)

Finally, commit your work so the next person starts from the current version:

```bash
git add -A
git commit -m "content: add 2026-03 seminar news"
git push origin main
```

---

## 6. Verify a deployment

```bash
curl.exe -sI https://city-energy-lab.pages.dev/                        # expect: HTTP/2 200
curl.exe -s  https://city-energy-lab.pages.dev/api/health              # expect: {"ok":true,...}
curl.exe -sI https://city-energy-lab.pages.dev/wp-content/uploads/2026/03/seminar.jpg
```

Then open the page you changed in a browser and hard-refresh with `Ctrl + F5`.

---

## 7. Database (optional, advanced)

```bash
# read
npx wrangler d1 execute cityenergylab-db --remote --command "SELECT name, role FROM members"

# write (put the SQL in a file first)
npx wrangler d1 execute cityenergylab-db --remote --file=migrations/0003_update.sql

# back up before any bulk change
npx wrangler d1 export cityenergylab-db --remote --output backup-2026-03.sql
```

Tables: `lab_profile`, `members`, `alumni`, `publications`, `news`, `research_areas`, `projects`,
`courses`, `pages`, `contact_messages`.

---

## 8. Contact form messages

The contact form is compatible with Contact Form 7 and stores submissions in the database:

```bash
npx wrangler d1 execute cityenergylab-db --remote \
  --command "SELECT * FROM contact_messages ORDER BY id DESC LIMIT 20"
```

---

## 9. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| New page returns 404 | the folder must contain `index.html`; the URL is the folder name and is case-sensitive |
| Image is broken after an edit | path typo under `uploads/`, or `srcset` still points at deleted variants → remove `srcset`/`sizes` |
| My edits disappeared | you edited `public/`; make the change in `site/` and rebuild |
| `Filename too long` on Windows | `git config core.longpaths true` |
| Deployment seems to upload everything | only changed files are actually uploaded; a slow upload is usually a large image |
| Korean/Chinese file names behave oddly | prefer ASCII file names for anything new; existing files were migrated as-is from the old server |

Known, intentional gaps (identical to the old site):

- 8 gallery images returned **404 on the original server** and are therefore absent here.
- `research` and `projects` pages still say “UNDER CONSTRUCTION” — that is how the original site was.

---

## 10. Handing the site to someone else

1. **GitHub** → *Settings* → *Collaborators* → add the person with *Write*.
2. **Cloudflare** → *Manage Account* → *Members* → invite with *Pages Edit* and *D1 Edit*.
3. Ask them to run once: `git clone …`, `git config core.longpaths true`, `npx wrangler login`.
4. Send them this file (`README.en.md` / `README.ko.md`).
5. Optional but recommended: connect the Pages project to GitHub so `git push` deploys by itself.
