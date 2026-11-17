<h1 align="center">CITY ENERGY LAB — 网站迁移（Cloudflare Pages + D1）</h1>

<p align="center">
  <a href="README.en.md">English</a> · <a href="README.ko.md">한국어</a> · <a href="README.md">中文</a>
</p>

<p align="center">首尔大学 CITY ENERGY LAB 官网 · WordPress 整站静态镜像 + Cloudflare D1 数据 API</p>

> **要改网站内容？** 请读面向维护人员（学弟学妹）的分步指南：[`README.ko.md`](README.ko.md)（韩语，主文档）· [`README.en.md`](README.en.md)（英语）。
> 本文档（中文）保留迁移与实现细节：目录结构、D1、API、部署、脚本。
>
> 维护负责人：**@LiliLIN0324**（GitHub）· 实验室 `sjquan@snu.ac.kr` · `02-880-9368`

首尔大学 **CITY ENERGY LAB**（城市能源实验室）原站 `https://cityenergylab.cafe24.com/` 的迁移项目：
WordPress 站点整站镜像为静态资源，部署在 Cloudflare Pages；实验室信息结构化存入 Cloudflare D1，
并通过 Pages Functions 提供 JSON API。

## 怎么改

日常维护只有一条主线：**在 `public/` 里改 HTML 和图片 → 提交推送到 `main` → 自动上线。**

| 想改什么 | 改哪个文件 | 怎么生效 |
| --- | --- | --- |
| 某页的文字、标题、日期 | 该页面目录下的 `index.html`，**目录名就是网址**，如 `public/conference-city-energy-lab-at-the-2026-acsp-annual-conference/index.html` | 推送到 `main` |
| 首页版式、大图 | `public/index.html` + `public/wp-content/themes/` 下的 CSS | 同上 |
| 换照片、加照片 | 图片放 `public/wp-content/uploads/<年>/<月>/`（见下一节） | 同上 |
| 新闻列表（全部新闻在这一页） | `public/news/index.html`（约 470 KB 的单页，网页端编辑器会很卡） | 同上 |
| 单条新闻详情 | `public/<新闻 slug>/index.html` | 同上 |
| 团队成员 / 毕业生 / 论文列表 | `public/team-members/index.html`、`public/previous-members/index.html`、`public/publications/index.html` | 同上 |
| 页面上的联系方式、页脚信息 | `public/contact/index.html` 及各页 HTML 里的页脚 | 同上 |
| `/api/*` 返回的结构化数据 | D1 表 `members`、`publications`、`news`、`lab_profile`（见「数据库」） | 执行 SQL 后立即生效；**页面是静态 HTML，不会跟着变** |

### 改一张照片

1. 新图放进对应年月目录，例如 `public/wp-content/uploads/2026/11/`。
2. WordPress 会为一张图生成多个尺寸：`xxx.jpg`、`xxx-1024x768.jpg`、`xxx-768x576.jpg`、`xxx-300x225.jpg`。
   HTML 用 `src` + `srcset` 引用其中几张，所以**沿用旧文件名同名覆盖最省事**；改了文件名就要把各尺寸都放进去，并同步改 HTML 里的引用。
3. 在页面里搜旧文件名，确认路径是相对形式 `wp-content/uploads/2026/11/xxx.jpg`（页面本身在子目录里，写相对路径才和原站一致）。
4. 本地预览：`npx wrangler pages dev public`，浏览器打开 http://localhost:8788 看效果。
5. 提交：`git add -A && git commit -m "update photos" && git push`。

### `site/` 和 `public/` 是什么关系

- `public/`：仓库里的正式内容，也是 Cloudflare Pages 的发布目录（对应 `wrangler.toml` 的 `pages_build_output_dir`）。**要改就改这里。**
- `site/`：当初抓取原站时的本地工作副本，已写进 `.gitignore`，**不在仓库里**，新克隆的目录中不存在。
- `make-project.js` 会**先删掉整个 `public/`**，再把 `site/` 复制过去，并重写 `functions/`、`wrangler.toml`、`.gitignore`。日常改内容不要跑它，否则会用你本地的旧副本覆盖 `public/`。

## 线上地址

| 用途 | 地址 |
| --- | --- |
| 站点（生产） | https://city-energy-lab.pages.dev/ |
| 健康检查 | https://city-energy-lab.pages.dev/api/health |
| 实验室概况 | https://city-energy-lab.pages.dev/api/lab-info |
| 成员列表 | https://city-energy-lab.pages.dev/api/members |

## 结构

```
public/                  整站静态镜像（与原站同一套 HTML/CSS/JS/图片，链接已改为站内相对路径）——要改内容就改这里
functions/               Cloudflare Pages Functions（API + Contact Form 7 兼容端点）
migrations/
  0001_schema.sql        D1 建表
  0002_seed.sql          从原站提取的初始数据
wrangler.toml            Pages 配置与 D1 绑定
.github/workflows/       deploy.yml：push 到 main 自动部署
site/                    抓取时的本地副本，.gitignore 里不入库（详见「怎么改」）
```

### 抓取/生成脚本

| 脚本 | 作用 |
| --- | --- |
| `lib/site.js` | 带 Cafe24 `CUPID` JS Cookie 校验的抓取库（keep-alive 连接池） |
| `crawl.js` | 首轮整站抓取（sitemap → 页面 → 资源） |
| `crawl2.js` | 断点续传补齐缺失资源 |
| `build-data.js` | 从镜像页面提取实验室信息 → `migrations/0002_seed.sql` + `data-extracted.json` |
| `make-project.js` | 由 `site/` 重建 `public/`、`functions/`、`wrangler.toml`（仅重新抓站时用） |

重新抓取并生成：

```bash
node crawl.js        # 首轮抓取
node crawl2.js       # 补齐资源（可重复执行）
node build-data.js   # 重新提取数据并生成 seed
node make-project.js # 生成 public/ 与 functions/
```

## 数据库（Cloudflare D1）

数据库名 `cityenergylab-db`，绑定名 `DB`。

| 表 | 内容 |
| --- | --- |
| `lab_profile` | 实验室名称、邮箱、电话、地址等键值信息 |
| `members` | 成员（姓名、类别 POSTDOC/PHD/MASTER'S、专业、学历背景、研究方向、照片） |
| `publications` | 论文（分区、完整引用、期刊、年份） |
| `news` | 新闻（slug、标题、日期、摘要、路径） |
| `research_areas` / `projects` / `courses` | 研究、项目、课程条目 |
| `pages` | 全站页面文本（slug、标题、URL、正文） |
| `contact_messages` | 联系表单留言 |

初始化：

```bash
npx wrangler d1 execute cityenergylab-db --remote --file=migrations/0001_schema.sql -y
npx wrangler d1 execute cityenergylab-db --remote --file=migrations/0002_seed.sql -y
```

查询示例：

```bash
npx wrangler d1 execute cityenergylab-db --remote --command \
  "SELECT category, COUNT(*) n FROM members GROUP BY category"
```

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/lab-info` | 实验室概况 + 各项数据条数 |
| GET | `/api/members?category=PHD` | 成员列表，可按类别过滤 |
| GET | `/api/publications?year=2025&q=energy&limit=50` | 论文，可按年份/关键词过滤 |
| GET | `/api/news?limit=20` | 新闻 |
| GET | `/api/research` `/api/projects` `/api/courses` | 对应条目 |
| GET | `/api/pages?slug=team-members` | 页面文本；不带 slug 返回页面索引 |
| POST | `/api/contact` | 留言写入 `contact_messages`，JSON 或表单均可 |

联系表单：原站使用 Contact Form 7，页面仍指向
`/wp-json/contact-form-7/v1/contact-forms/{id}/feedback`；`functions/wp-json/...` 提供了兼容端点，
把提交内容写入 D1 的 `contact_messages` 表，因此前台表单无需改动即可使用。

查看留言：

```bash
npx wrangler d1 execute cityenergylab-db --remote --command \
  "SELECT id, name, email, subject, created_at FROM contact_messages ORDER BY id DESC LIMIT 20"
```

## 部署

推送到 `main` 即触发 `.github/workflows/deploy.yml` 自动部署：直接上传仓库里的 `public/`，没有构建步骤（需在仓库 Secrets 配好 `CLOUDFLARE_API_TOKEN`）。
需要手动发布时：

```bash
npx wrangler pages deploy public --project-name city-energy-lab --branch main
```

Pages 项目：`city-energy-lab`，D1 绑定 `DB = cityenergylab-db`
（`61a1c384-b8f1-49ef-b5ca-4ee2615240e7`）。

> 手动发布前不要跑 `node make-project.js`，它会把 `public/` 换成你本地的 `site/` 副本。

## 维护与联系

| 角色 | 联系 | 负责什么 |
| --- | --- | --- |
| 维护负责人 | **@LiliLIN0324**（GitHub，可开 Issue） | 账号权限、部署失败、内容改错后的恢复 |
| 实验室 | `sjquan@snu.ac.kr` · `02-880-9368` | 对外联络信息 |

文档分工：

| 文档 | 读者 | 内容 |
| --- | --- | --- |
| [`README.ko.md`](README.ko.md) | 日常维护者（主文档） | 速查三件事 → 常见修改 → 出错恢复 → 规则 → 管理员章节 |
| [`README.en.md`](README.en.md) | 英文维护者 | 与韩语版同结构 |
| `README.md`（本文） | 接手技术工作的人 | 目录结构、D1、API、部署细节 |

## 说明

- 静态镜像与原站视觉/内容一致；WordPress 后台（`wp-admin`）、搜索、评论、RSS 等动态功能不在迁移范围。
- `research`、`projects` 两个页面在原站本身就是 “UNDER CONSTRUCTION” 占位页，迁移后保持原样。
- 新闻条的日期仅原站页面显示日期时才会被提取，其余为空。
- 原站依赖的外部字体（Google Fonts、BootstrapCDN）仍走外链，以保证与原站一致。
