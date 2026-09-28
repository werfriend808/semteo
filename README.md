# 셈터

생활 계산기 모음 정적 사이트 (Astro, TypeScript, 정적 출력).

## 요구 사항

- Node.js 22.12 이상

## 로컬 실행

```sh
npm install
npm run dev        # http://localhost:4321
```

## 테스트

```sh
npm test           # Vitest (src/**/*.test.ts)
npm run test:watch
```

## 빌드

```sh
npm run build      # astro check(타입 검사) + astro build → dist/
npm run preview    # 빌드 결과를 로컬에서 확인
```

계산기 frontmatter에 필수 항목(출처, 기준일, FAQ 등)이 빠지면 빌드가 실패한다.

## 설정

`src/config.ts` 한 곳에서 관리한다.

| 상수 | 설명 |
| --- | --- |
| `SITE_URL` | 배포 도메인. canonical·sitemap·OG에 쓰인다 (현재 임시값) |
| `CONTACT_EMAIL` | 문의·개인정보 담당 이메일 (현재 `TODO_EMAIL`) |
| `ADS_ENABLED` | 애드센스 승인 후 `true`. 광고 자리에 최소 높이를 예약한다 |
| `CATEGORIES` | 홈 카테고리 |

## 새 계산기 추가

[docs/new-calculator.md](docs/new-calculator.md) 참고. `src/calculators/<slug>/`에 파일 3개를 추가하면 페이지·홈 목록·sitemap이 자동으로 생성된다.

## Cloudflare Pages 배포

1. GitHub 등에 저장소를 올린다.
2. Cloudflare 대시보드 → Workers & Pages → Create → Pages → Git 저장소 연결
3. 빌드 설정
   - Framework preset: `Astro`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - 환경 변수: `NODE_VERSION` = `22` (또는 그 이상)
4. 배포 후 커스텀 도메인을 연결하고 `src/config.ts`의 `SITE_URL`을 그 도메인으로 바꿔 다시 배포한다.
5. Google Search Console에 사이트를 등록하고 `https://<도메인>/sitemap-index.xml`을 제출한다.

`404.html`은 Cloudflare Pages가 자동으로 404 페이지로 사용한다.
