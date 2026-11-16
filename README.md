# CITY ENERGY LAB — 网站迁移（Cloudflare Pages + D1）

[English](README.en.md) · [한국어](README.ko.md) · [中文](README.md)

> 编辑、改图、发新闻、部署的详细操作步骤见 [`README.en.md`](README.en.md) / [`README.ko.md`](README.ko.md)。

首尔大学 **CITY ENERGY LAB**（城市能源实验室）原站 `https://cityenergylab.cafe24.com/` 的迁移项目：
WordPress 站点整站镜像为静态资源，部署在 Cloudflare Pages；实验室信息结构化存入 Cloudflare D1，
并通过 Pages Functions 提供 JSON API。

## 线上地址

| 用途 | 地址 |
| --- | --- |
| 站点（生产） | https://city-energy-lab.pages.dev/ |
| 健康检查 | https://city-energy-lab.pages.dev/api/health |
| 实验室概况 | https://city-energy-lab.pages.dev/api/lab-info |
| 成员列表 | https://city-energy-lab.pages.dev/api/members |

## 结构

```
public/                  整站静态镜像（与原站同一套 HTML/CSS/JS/图片，链接已改为站内相对路径）
functions/               Cloudflare Pages Functions（API + Contact Form 7 兼容端点）
migrations/
  0001_schema.sql        D1 建表
  0002_seed.sql          从原站提取的初始数据
wrangler.toml            Pages 配置与 D1 绑定
scripts                 抓取与数据提取脚本（见下）
```

### 抓取/生成脚本

| 脚本 | 作用 |
| --- | --- |
| `lib/site.js` | 带 Cafe24 `CUPID` JS Cookie 校验的抓取库（keep-alive 连接池） |
| `crawl.js` | 首轮整站抓取（sitemap → 页面 → 资源） |
| `crawl2.js` | 断点续传补齐缺失资源 |
| `build-data.js` | 从镜像页面提取实验室信息 → `migrations/0002_seed.sql` + `data-extracted.json` |
| `make-project.js` | 由 `site/` 生成 `public/`、`functions/`、`wrangler.toml` |

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

```bash
npx wrangler pages deploy public --project-name city-energy-lab --branch main
```

Pages 项目：`city-energy-lab`，D1 绑定 `DB = cityenergylab-db`
（`61a1c384-b8f1-49ef-b5ca-4ee2615240e7`）。

## 说明

- 静态镜像与原站视觉/内容一致；WordPress 后台（`wp-admin`）、搜索、评论、RSS 等动态功能不在迁移范围。
- `research`、`projects` 两个页面在原站本身就是 “UNDER CONSTRUCTION” 占位页，迁移后保持原样。
- 新闻条的日期仅原站页面显示日期时才会被提取，其余为空。
- 原站依赖的外部字体（Google Fonts、BootstrapCDN）仍走外链，以保证与原站一致。
