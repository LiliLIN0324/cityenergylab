# CITY ENERGY LAB — 웹사이트 운영 안내서

[English](README.en.md) · [한국어](README.ko.md) · [中文](README.md)

이 저장소는 연구실 웹사이트를 담고 있습니다. 기존 WordPress 사이트
(`https://cityenergylab.cafe24.com/`)를 **Cloudflare Pages** 에 정적 사이트로 그대로 옮긴 것이고,
연구실 정보는 **Cloudflare D1** 데이터베이스에 저장되어 Pages Functions 를 통해 JSON API 로 제공됩니다.

| 항목 | 값 |
| --- | --- |
| 운영 사이트 | https://city-energy-lab.pages.dev/ |
| GitHub 저장소 | https://github.com/LiliLIN0324/cityenergylab |
| 호스팅 | Cloudflare Pages, 프로젝트 `city-energy-lab`, 브랜치 `main` |
| 데이터베이스 | Cloudflare D1, `cityenergylab-db` |

이 문서는 웹 개발자가 아닌 **연구실 구성원과 조교**를 위해 작성되었습니다.
문구 수정, 사진 교체, 새 소식 추가, 데이터베이스 수정, 배포 방법을 설명합니다.

---

## 1. 필요한 권한

| 항목 | 용도 | 받는 방법 |
| --- | --- | --- |
| 저장소 **쓰기** 권한이 있는 GitHub 계정 | 콘텐츠 수정 및 push | 저장소 소유자: GitHub → Settings → Collaborators → *Add people* |
| **Pages Edit** + **D1 Edit** 권한이 있는 Cloudflare 계정 | 배포 및 데이터베이스 수정 | Cloudflare 대시보드 → Manage Account → Members → *Invite* |
| Node.js 18 이상(20 권장), Git | 빌드/배포 명령 실행 | https://nodejs.org/ |

최초 1회만 컴퓨터에서 실행하십시오.

```bash
git clone https://github.com/LiliLIN0324/cityenergylab.git
cd cityenergylab
git config core.longpaths true    # Windows 전용 — WordPress 경로가 매우 깁니다
npx wrangler login                # 브라우저가 열리면 Cloudflare 로그인
```

---

## 2. 저장소 구조

| 경로 | 설명 | 수정 여부 |
| --- | --- | --- |
| `site/` | **실제 콘텐츠.** 페이지마다 폴더 하나에 HTML/CSS/이미지 | ✅ 여기를 수정합니다 |
| `public/` | 배포되는 결과물 (자동 생성) | ❌ 절대 수정 금지 — 매번 삭제 후 재생성됩니다 |
| `functions/api/` | D1 을 읽어 JSON 을 돌려주는 API (`/api/members`, `/api/publications` …) | API 를 바꿀 때만 |
| `migrations/` | D1 스키마와 초기 데이터 SQL | 데이터베이스 작업 시 |
| `wrangler.toml` | Cloudflare 프로젝트 설정 + D1 바인딩 | 거의 수정하지 않음 |
| `make-project.js` | `site/` → `public/` 복사, `functions/` 재생성 | 수정하지 않음 |
| `lib/`, `crawl*.js`, `build-data.js` | 옛 사이트를 복제할 때 쓴 1회성 이전 스크립트 | 수정하지 않음 |

---

## 3. 가장 중요한 규칙

> **`site/` 를 수정하십시오. `public/` 은 절대 수정하지 마십시오.**

`node make-project.js` 는 `public/` 폴더를 통째로 삭제한 뒤 `site/` 를 복사합니다.
`public/` 에서 직접 고친 내용은 다음 빌드에서 모두 사라집니다.

---

## 4. 자주 하는 작업

### 4.1 기존 페이지의 문구 수정

모든 페이지는 `index.html` 을 가진 폴더입니다.

| 페이지 | 파일 |
| --- | --- |
| 소식 목록 | `site/news/index.html` |
| 구성원 | `site/team-members/index.html` |
| 졸업생/이전 구성원 | `site/previous-members/index.html` |
| 논문 목록 | `site/publications/index.html` |
| 연락처 | `site/contact/index.html` |
| 개별 소식 글 | `site/<글-주소>/index.html` |

1. 텍스트 편집기(VS Code, Notepad++ 등)로 파일을 엽니다.
2. **태그 사이의 글자만** 바꿉니다. `class="…"`, `id="…"`, `style="…"` 는 디자인이므로 그대로 둡니다.
3. 저장한 뒤 §5 의 빌드·배포를 실행합니다.

### 4.2 사진 교체

1. 새 파일을 `site/wp-content/uploads/<연도>/<월>/` 에 넣습니다.
   (예: `site/wp-content/uploads/2026/03/seminar.jpg`)
2. 가장 간단한 방법은 **기존 파일과 같은 파일 이름**을 쓰는 것입니다. 그러면 HTML 을 고칠 필요가 없습니다.
3. 파일 이름을 바꾸거나 가로세로 비율이 달라지면: WordPress 페이지는 `srcset` 에 여러 크기의
   변형 파일(예: `photo-768x1024.jpg`)을 나열합니다. 같은 크기의 변형을 함께 준비하거나,
   해당 `<img>` 에서 `srcset="…"` 와 `sizes="…"` 속성을 지워 `src` 만 쓰게 하십시오.
4. 사진은 가능하면 2MB 이하로 유지하십시오. 큰 이미지는 사이트가 느려집니다.

### 4.3 새 소식 글 추가

1. 기존 글 폴더를 템플릿으로 복사합니다(PowerShell).

   ```powershell
   Copy-Item -Recurse "site\2025-first-lab-meeting-and-farewell-dinner-with-alumni" "site\2026-03-new-seminar"
   ```

2. `site/2026-03-new-seminar/index.html` 에서 `<title>`, `<h1>` 제목, 날짜 줄, 본문 문단,
   이미지 경로를 수정합니다.
3. 소식 목록 `site/news/index.html` 에 링크를 추가합니다. 기존 항목 블록 하나를 복사해
   `href="/2026-03-new-seminar/"` 와 표시 문구를 바꿉니다.
4. 빌드 후 배포합니다(§5).

> 글의 주소는 폴더 이름입니다. 새 폴더 이름은 영문 소문자, 숫자, 하이픈만 사용하십시오.
> 한글이나 공백이 들어간 폴더 이름은 피하는 것이 좋습니다.

### 4.4 구성원·논문 목록 수정

이 페이지들은 데이터베이스에서 자동 생성되지 않는 **직접 작성한 HTML** 입니다.
`site/team-members/index.html` 또는 `site/publications/index.html` 을 §4.1 방식으로 고칩니다.

### 4.5 `/api/*` 데이터 수정

데이터베이스는 **화면에 보이는 페이지를 만들지 않습니다.** JSON API 만 제공합니다.
D1 을 수정하면 `https://city-energy-lab.pages.dev/api/members` 같은 API 응답만 달라지고,
페이지 모습은 그대로입니다. 화면도 함께 바뀌어야 한다면 HTML 도 같이 수정해야 합니다.

---

## 5. 변경 사항 배포

### 5.1 일반적인 방법: 커밋 후 push

```bash
git add -A
git commit -m "content: 2026-03 세미나 소식 추가"
git push origin main
```

이것으로 끝입니다. `.github/workflows/deploy.yml` 워크플로가 `main` 브랜치에 push 될 때마다
`node make-project.js` 로 `public/` 을 다시 만들고 Cloudflare Pages 로 배포합니다.
저장소의 **Actions** 탭에서 확인할 수 있고, 초록색 체크가 뜨면 운영 사이트에 이미 반영된 것입니다(약 2분).

최초 1회, 저장소 소유자만: 워크플로에는 `CLOUDFLARE_API_TOKEN` 이라는 저장소 시크릿이 필요합니다.

1. Cloudflare 대시보드 → *My Profile* → *API Tokens* → *Create Token* → *Create Custom Token*
2. 권한: **Account · Cloudflare Pages · Edit**, **Account · Account Settings · Read**
3. *Continue to summary* → *Create Token* 후 토큰을 복사합니다(한 번만 표시됩니다)
4. GitHub 저장소 → *Settings* → *Secrets and variables* → *Actions* → *New repository secret*
   이름 `CLOUDFLARE_API_TOKEN`, 값에 토큰을 붙여넣습니다

시크릿이 없으면 워크플로는 실패하지 않고 경고를 남긴 뒤 배포만 건너뜁니다.

### 5.2 수동 배포(대체 방법)

Actions 를 쓸 수 없을 때는 컴퓨터에서 직접 배포합니다.

```bash
node make-project.js
npx wrangler pages deploy public --project-name city-energy-lab --branch main
```

정상 출력 예시:

```
public/ 已生成
functions/ 已生成: 12 个文件
✨ Deployment complete! Take a peek over at https://<hash>.city-energy-lab.pages.dev
```

운영 주소는 항상 **https://city-energy-lab.pages.dev/** 입니다.

> ℹ️ 이 Pages 프로젝트는 *Direct Upload* 방식으로 만들어져 Cloudflare 가 나중에 Git 저장소와
> 연결할 수 없습니다. 그래서 Cloudflare 자체 Git 연동 대신 GitHub Actions 로 배포합니다.

---

## 6. 배포 확인

```bash
curl.exe -sI https://city-energy-lab.pages.dev/                        # 기대값: HTTP/2 200
curl.exe -s  https://city-energy-lab.pages.dev/api/health              # 기대값: {"ok":true,...}
curl.exe -sI https://city-energy-lab.pages.dev/wp-content/uploads/2026/03/seminar.jpg
```

그다음 브라우저에서 수정한 페이지를 열고 `Ctrl + F5` 로 새로고침하여 확인합니다.

---

## 7. 데이터베이스 (선택, 고급)

```bash
# 조회
npx wrangler d1 execute cityenergylab-db --remote --command "SELECT name, role FROM members"

# 수정 (SQL 은 파일로 먼저 작성)
npx wrangler d1 execute cityenergylab-db --remote --file=migrations/0003_update.sql

# 대량 수정 전 백업
npx wrangler d1 export cityenergylab-db --remote --output backup-2026-03.sql
```

테이블: `lab_profile`, `members`, `alumni`, `publications`, `news`, `research_areas`, `projects`,
`courses`, `pages`, `contact_messages`.

---

## 8. 문의 양식 메시지 확인

문의 양식은 Contact Form 7 과 호환되며, 접수 내용이 데이터베이스에 저장됩니다.

```bash
npx wrangler d1 execute cityenergylab-db --remote \
  --command "SELECT * FROM contact_messages ORDER BY id DESC LIMIT 20"
```

---

## 9. 문제 해결

| 증상 | 원인 / 해결 |
| --- | --- |
| 새 페이지가 404 | 폴더 안에 `index.html` 이 있어야 하고, URL 은 폴더 이름이며 대소문자를 구분합니다 |
| 수정 후 이미지가 깨짐 | `uploads/` 경로 오타, 또는 `srcset` 이 삭제된 변형 파일을 가리킴 → `srcset`/`sizes` 삭제 |
| 수정 내용이 사라짐 | `public/` 을 고쳤습니다. `site/` 에서 수정하고 다시 빌드하십시오 |
| Windows 에서 `Filename too long` | `git config core.longpaths true` |
| 배포가 오래 걸림 | 실제로는 변경된 파일만 업로드됩니다. 느리면 대용량 이미지가 원인일 수 있습니다 |
| 한글/중국어 파일 이름이 이상 동작 | 새로 추가하는 파일은 영문 이름을 권장합니다(기존 파일은 옛 서버 그대로 이전됨) |

원래 사이트와 동일한, 의도된 빈 부분:

- 갤러리 이미지 8장은 **원래 서버에서도 404** 였으므로 이 사이트에도 없습니다.
- `research`, `projects` 페이지는 원래 사이트와 마찬가지로 “UNDER CONSTRUCTION” 상태입니다.

---

## 10. 담당자 인수인계

1. **GitHub** → *Settings* → *Collaborators* 에서 해당 인원을 *Write* 권한으로 추가합니다.
2. **Cloudflare** → *Manage Account* → *Members* 에서 *Pages Edit*, *D1 Edit* 권한으로 초대합니다.
3. 본인 컴퓨터에서 한 번만 실행하도록 안내합니다: `git clone …`, `git config core.longpaths true`, `npx wrangler login`.
4. 이 문서(`README.ko.md`)를 함께 전달합니다.
5. 권장 사항: Pages 프로젝트를 GitHub 와 연결하면 `git push` 만으로 자동 배포됩니다.
