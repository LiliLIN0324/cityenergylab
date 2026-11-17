<h1 align="center">CITY ENERGY LAB — 웹사이트 유지보수 안내</h1>

<p align="center">
  <a href="README.ko.md">한국어</a> · <a href="README.en.md">English</a> · <a href="README.md">中文</a>
</p>

<p align="center">연구실 홈페이지 고치는 방법 — 코딩을 몰라도 됩니다</p>

> **이 문서는 연구실 구성원과 조교를 위한 것입니다.** 브라우저만 있으면 되고, 프로그램을 설치할 필요도 없습니다.
> 실제로 하는 일의 대부분은 §1의 세 가지입니다.

| 항목 | 값 |
| --- | --- |
| 운영 사이트 | https://city-energy-lab.pages.dev/ |
| 저장소 | https://github.com/LiliLIN0324/cityenergylab |
| 호스팅 | Cloudflare Pages (프로젝트 `city-energy-lab`, 브랜치 `main`) |
| 데이터베이스 | Cloudflare D1 `cityenergylab-db` — 화면과는 별개 (§6.5) |
| 담당자 | **@LiliLIN0324** — 막히면 §7 로 연락 |

**목차**: §1 세 가지만 알면 됩니다 · §2 어느 파일을 고치나 · §3 잘못 고쳤을 때 · §4 배포 확인 · §5 꼭 지킬 규칙 · §6 관리자/고급 · §7 문의

---

## 1. 세 가지만 하면 됩니다

### 1.1 문구 한 줄 바꾸기 (설치 없이, 브라우저에서)

1. 고칠 페이지를 연다. 예: https://city-energy-lab.pages.dev/contact/
2. 바꾸고 싶은 문장을 `Ctrl + F` 로 페이지에서 찾는다. 예: `02-880-9368`
3. 같은 페이지의 **소스 파일**을 GitHub에서 연다. 주소의 `/contact/` 부분이 파일 경로가 된다 →
   https://github.com/LiliLIN0324/cityenergylab/blob/main/public/contact/index.html
4. 오른쪽 위 **연필 아이콘**(Edit this file) → `Ctrl + F` 로 2에서 찾은 문장을 찾는다.
5. **태그 사이의 글자만** 바꾼다.
   - 이렇게: `<h3>Contact Us</h3>` → `<h3>Contact</h3>`
   - 이건 건드리지 않는다: `class="..."`, `id="..."`, `<div>`, `</div>`, `<img ...>`
6. 아래 **Commit changes...** → 메시지에 무엇을 바꿨는지 한국어로 한 줄(예: `연락처 전화번호 수정`) → **Commit changes**
7. 1~2분 뒤 → §4 에서 확인

> **폴더 이름 = 주소.** `/team-members/` 페이지의 파일은 `public/team-members/index.html` 입니다.
> 대응표는 §2 에 있습니다.

### 1.2 사진 한 장 바꾸기

1. 새 사진 파일 이름을 **기존 사진과 똑같이** 바꾼다. (가장 중요 — 예: `seminar.jpg`)
2. GitHub에서 사진 폴더를 연다: `public/wp-content/uploads/<연도>/<월>/`
   예) https://github.com/LiliLIN0324/cityenergylab/tree/main/public/wp-content/uploads/2026/03
3. 오른쪽 위 **Add file** → **Upload files** → 사진을 끌어다 놓는다 → 이름이 같으면 덮어쓰기 된다 → **Commit changes**
4. 1~2분 뒤 사이트에서 `Ctrl + F5` (강력 새로고침)

- 사진은 **2MB 이하**를 권장합니다. 큰 사진은 사이트가 느려집니다.
- 처음에는 **이름을 그대로 유지하는 방법만** 쓰세요. 이름을 바꾸면 HTML의 `src` 까지 고쳐야 합니다.
- 원본과 가로세로 비율이 많이 다르면 잘려 보일 수 있습니다.

### 1.3 새 소식 올리기

1. **글 폴더 만들기**: 저장소에서 **Add file** → **Create new file** →
   파일 이름 칸에 `2026-03-new-seminar/index.html` 처럼 **폴더/파일** 형태로 입력하면 폴더가 함께 만들어진다.
2. 기존 글 하나를 열어(예: `public/2025-first-lab-meeting-and-farewell-dinner-with-alumni/index.html`)
   전체 내용을 복사해 새 파일에 붙여넣는다.
3. 고칠 곳: `<title>`, `<h1>` 제목, 날짜 줄, 본문 문단, 사진 경로(`src="..."`).
4. 소식 목록 `public/news/index.html` 에 링크를 추가한다. 기존 항목 블록 하나를 복사해
   `href="/2026-03-new-seminar/"` 와 표시 글자를 바꾼다.
   ⚠️ 이 파일은 약 470KB라 **웹 편집기에서 매우 느립니다.** 브라우저가 버벅이면 §6.2 로컬 편집을 쓰거나 담당자에게 부탁하세요.
5. **Commit changes** → 1~2분 뒤 확인.

- 글의 주소는 **폴더 이름**입니다. 영문 소문자·숫자·하이픈만 사용하세요(한글·공백 금지).
- 소식 목록 페이지에도 글이 보이게 하려면 4번(링크 추가)을 꼭 해야 합니다.

---

## 2. 어느 파일을 고쳐야 하나

| 바꾸고 싶은 것 | 파일 | 비고 |
| --- | --- | --- |
| 첫 화면(홈) | `public/index.html` | 첫 방문자가 보는 화면 |
| 소식 **목록** | `public/news/index.html` | 모든 소식이 한 파일에 (약 470KB, 웹 편집 느림) |
| 소식 **개별 글** | `public/<글-주소>/index.html` | 폴더 이름이 곧 주소 |
| 구성원 | `public/team-members/index.html` | 사람별 카드가 반복됨 |
| 졸업생·이전 구성원 | `public/previous-members/index.html` | |
| 논문 목록 | `public/publications/index.html` | |
| 연락처 | `public/contact/index.html` | 전화·이메일·주소 |
| 사진 파일 | `public/wp-content/uploads/<연도>/<월>/` | 파일 이름 유지가 핵심 |
| 연구 / 프로젝트 | `public/research/index.html`, `public/projects/index.html` | 원래 사이트도 "UNDER CONSTRUCTION" 상태 |

**주소 → 파일 규칙**: `https://city-energy-lab.pages.dev/team-members/` → `public/team-members/index.html`

> 구성원·논문 목록은 **데이터베이스에서 자동 생성되지 않습니다.** 직접 쓴 HTML이므로 HTML을 고쳐야 화면이 바뀝니다.
> (D1 데이터베이스는 `/api/*` 응답만 담당합니다 — §6.5)

---

## 3. 잘못 고쳤을 때 되돌리기

먼저 마음 편히: **되돌릴 수 있습니다.** 실수로 지운 것은 §3.1 로 복구합니다.

### 3.1 방금 한 커밋 되돌리기

**방법 A — 브라우저에서 (설치 없이, 가장 흔한 경우)**

1. 그 파일의 GitHub 페이지 → 오른쪽 위 **History** 클릭
2. 고치기 **전** 커밋을 클릭 → 화면에 **빨간색으로 표시된 삭제된 줄**이 원래 내용이다 → 그 줄을 복사
   (파일 **전체**를 되돌려야 하면: 그 커밋 페이지 오른쪽 위 `<>`(Browse files) → 파일 클릭 → **Raw** → `Ctrl + A`, `Ctrl + C`)
3. 최신 파일로 돌아가(`.../blob/main/...`) 연필 아이콘 → 해당 부분에 붙여넣기 → **Commit changes**
4. 1~2분 뒤 사이트에서 `Ctrl + F5`

**방법 B — GitHub Desktop (GUI, 익숙해지면 가장 빠름)**

1. GitHub Desktop으로 저장소를 연다 → **History** 탭
2. 잘못한 커밋을 **오른쪽 클릭** → **Revert changes in commit**
3. **Push origin** 클릭 → 1~2분 뒤 확인

**방법 C — 터미널**

```bash
git log --oneline -5                 # 잘못한 커밋 해시 확인 (예: 0983f5b)
git revert <커밋해시>                 # 그 커밋만 취소하는 새 커밋 생성
git push origin main
```

파일 **하나만** 예전으로 되돌리기:

```bash
git restore --source=<커밋해시> -- public/news/index.html
git commit -m "restore news page"
git push origin main
```

### 3.2 사진이 깨졌을 때 (깨진 이미지 아이콘이 보임)

1. 깨진 이미지를 오른쪽 클릭 → **이미지 주소 복사** → 경로 확인: `/wp-content/uploads/2026/03/xxx.jpg`
2. GitHub에서 그 경로에 파일이 **있는지** 확인한다. 없으면 §1.2 방식으로 **정확한 이름**으로 다시 업로드.
3. 파일은 있는데도 깨진다면, HTML의 `srcset="..."` 이 삭제된 다른 크기 파일을 가리키고 있는 경우다.
   해당 `<img>` 태그에서 `srcset="..."` 와 `sizes="..."` 부분을 지우면 `src` 한 장만 쓰게 된다.
4. 그래도 안 되면 §7 로 연락(스크린샷 + 페이지 주소).

### 3.3 새 페이지가 404

- 그 폴더 안에 **`index.html`** 이 있어야 합니다.
- 폴더 이름이 곧 주소이고 **대소문자를 구분**합니다(`About` ≠ `about`). 소문자만 쓰세요.

### 3.4 그래도 해결이 안 되면

되돌리지 말고 **그대로 두고** §7 로 연락하세요. 마지막으로 정상이던 커밋 해시(`git log` 또는 GitHub **Commits** 목록에서 확인)를 알려주면 바로 복구됩니다.

---

## 4. 내 수정이 사이트에 올라갔는지 확인

1. GitHub 저장소 → **Actions** 탭 → 가장 위 실행 클릭
2. **초록 체크** = 배포 완료. 보통 1~2분 걸립니다.
3. 사이트에서 `Ctrl + F5` (강력 새로고침). 그래도 예전 화면이면 시크릿 창에서 열어 보세요.
4. **빨간 X** = 배포 실패 → 실행을 클릭해 빨간 단계를 캡처해서 §7 로 보내기.
5. **노란 경고(skipped)** = 저장소에 `CLOUDFLARE_API_TOKEN` 시크릿이 없어 배포를 건너뜀 → 담당자에게 알리기.

---

## 5. 꼭 지킬 규칙 5가지

1. **`public/` 폴더만 고친다.** (`functions/`, `migrations/` 는 관리자 영역 — §6)
2. **`node make-project.js` 는 실행하지 않는다.** `public/` 을 통째로 지우고 로컬 `site/` 복사본으로 덮어씁니다. (저장소에는 `site/` 가 없습니다)
3. **태그와 `class`/`id`/`style` 은 건드리지 않고 글자만 바꾼다.** 지우면 레이아웃이 깨집니다.
4. **새 파일·폴더 이름은 영문 소문자·숫자·하이픈만.** 한글·공백·대문자 금지.
5. **사진은 2MB 이하, 기존 파일 이름 유지.**

---

## 6. 관리자·고급 (필요할 때만 읽으세요)

### 6.1 저장소 구조

| 경로 | 설명 | 수정 여부 |
| --- | --- | --- |
| `public/` | **실제 콘텐츠.** 페이지마다 폴더 하나 + `index.html`. 배포되는 폴더 | ✅ 여기만 |
| `functions/api/` | D1 을 읽어 JSON 을 돌려주는 API (`/api/members` …) | API 를 바꿀 때만 |
| `migrations/` | D1 스키마·초기 데이터 SQL | 데이터베이스 작업 시 |
| `wrangler.toml` | Cloudflare 프로젝트 설정 + D1 바인딩 | 거의 수정 안 함 |
| `.github/workflows/deploy.yml` | `main` push 시 자동 배포 | 관리자만 |
| `make-project.js` | `public/` 삭제 후 `site/` 복사, `functions/`·`wrangler.toml`·`.gitignore` 재생성 | ❌ 실행 금지(재수집 전용) |
| `site/` | 옛 사이트를 긁어올 때 만든 임시 복사본. **저장소에 없음**(`.gitignore`) | ❌ 커밋 금지 |
| `lib/`, `crawl*.js`, `build-data.js` | 옛 사이트 이전용 1회성 스크립트 | ❌ |

### 6.2 로컬 작업 환경 (선택)

웹 편집기로 버거운 작업(큰 파일, 여러 장의 사진, 폴더 복사)만 로컬에서:

```bash
git clone https://github.com/LiliLIN0324/cityenergylab.git
cd cityenergylab
git config core.longpaths true   # Windows 전용 — WordPress 경로가 매우 깁니다
```

편집 후:

```bash
git add -A
git commit -m "content: 2026-03 세미나 소식 추가"
git push origin main
```

### 6.3 수동 배포 (Actions 를 못 쓸 때)

```bash
npx wrangler login
npx wrangler pages deploy public --project-name city-energy-lab --branch main
```

정상 출력: `✨ Deployment complete! ...`
⚠️ `node make-project.js` 를 먼저 실행하지 마세요. 로컬 `site/` 로 `public/` 을 덮어씁니다.

### 6.4 자동 배포 구조

`main` 에 push → `.github/workflows/deploy.yml` → **빌드 단계 없이** 저장소의 `public/` 을 그대로 업로드 →
`https://city-energy-lab.pages.dev/`. 즉 **커밋한 내용이 곧 사이트**입니다.

필요한 저장소 시크릿: `CLOUDFLARE_API_TOKEN`
(Cloudflare → *My Profile* → *API Tokens* → *Create Custom Token*, 권한 **Account · Cloudflare Pages · Edit** + **Account · Account Settings · Read**)

### 6.5 데이터베이스 D1 (화면과 무관)

```bash
npx wrangler d1 execute cityenergylab-db --remote --command "SELECT name, role FROM members"
npx wrangler d1 execute cityenergylab-db --remote --file=migrations/0003_update.sql
npx wrangler d1 export cityenergylab-db --remote --output backup-2026-03.sql   # 대량 수정 전 백업
```

테이블: `lab_profile`, `members`, `alumni`, `publications`, `news`, `research_areas`, `projects`, `courses`, `pages`, `contact_messages`
API 예: https://city-energy-lab.pages.dev/api/members
**주의**: DB를 고쳐도 페이지 모습은 그대로입니다(페이지는 정적 HTML). 화면도 바꾸려면 HTML을 함께 수정하세요.

### 6.6 문의 양식으로 온 메시지 확인

```bash
npx wrangler d1 execute cityenergylab-db --remote \
  --command "SELECT * FROM contact_messages ORDER BY id DESC LIMIT 20"
```

### 6.7 옛 사이트 재수집 (관리자만, 위험)

`site/` 가 있는 **원래 작업 컴퓨터에서만** 실행하세요. `public/` 이 삭제된 뒤 재생성됩니다.

```bash
node crawl.js && node crawl2.js && node build-data.js && node make-project.js
```

### 6.8 인수인계 체크리스트

1. GitHub → *Settings* → *Collaborators* 에서 *Write* 권한으로 추가
2. Cloudflare → *Manage Account* → *Members* 에서 *Pages Edit* + *D1 Edit* 로 초대
3. 이 문서(`README.ko.md`) 전달 + 저장소 주소 안내
4. 첫 과제로 §1.1(문구 한 줄)을 직접 해 보게 하기 — 웹만으로 되는지 확인
5. 추가로 연결할 것은 없음 (Actions 가 이미 자동 배포. Pages 프로젝트는 *Direct Upload* 라 Git 연결 불가)

---

## 7. 문의

- **담당자(저장소 소유자): @LiliLIN0324** — GitHub Issues 또는 직접 연락
  - 이슈 남기기: https://github.com/LiliLIN0324/cityenergylab/issues
- 연구실 대표 연락처: `sjquan@snu.ac.kr` · `02-880-9368`
- 문의할 때 함께 알려주면 좋은 것:
  1. 문제가 생긴 **페이지 주소**
  2. 무엇이 **어떻게** 잘못됐는지 (예: 사진이 안 보임 / 글자가 깨짐 / 소식이 안 올라감)
  3. **스크린샷**
  4. 마지막으로 **한 일** (예: "소식 목록에 링크 추가하고 커밋함")

원래 사이트와 동일한, 의도된 부분:

- 갤러리 이미지 8장은 **원래 서버에서도 404** 였으므로 이 사이트에도 없습니다.
- `research`, `projects` 페이지는 원래 사이트와 마찬가지로 "UNDER CONSTRUCTION" 상태입니다.
