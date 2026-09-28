# 셈터 — 프로젝트 규칙

생활 계산기(세금·급여·생활) 정적 사이트. 수익은 검색 유입 + 애드센스. 운영자는 주 5시간 이하만 투자하므로
**"한 번 만들면 손이 안 가는 구조"**와 **"계산기 = 폴더 하나"**를 깨지 않는 것이 최우선이다.

## 정확성 원칙 (반드시 지킬 것)

- 세율·요율·법정 기준은 **공식 출처**(국가법령정보센터, 국세청, 고용노동부 등 정부·공공기관)를 확인하고,
  `content.mdx`의 `sources`에 조문/문서 이름과 URL, `baseYear`, `lastVerified`를 적는다.
- 확인하지 못한 내용은 **추측하지 않는다.** 코드 주석과 `needsVerification`에 "확인 필요"로 적고 사용자에게 보고한다.
  (`needsVerification` 항목은 페이지 출처 박스에 자동으로 노출된다.)
- 모든 `logic.ts`에는 **경계값 테스트**가 있어야 한다 (0, 빈 값, 음수, 절사·구간 경계, 큰 금액, 역산 왕복).
- 블로그·AI 요약 글은 공식 출처가 아니다. 참고만 하고 출처로 적지 않는다.

## 구조

```
src/
  config.ts                 # SITE_URL, CONTACT_EMAIL, ADS_ENABLED, CATEGORIES — 전역 설정은 여기만
  content.config.ts         # 계산기 frontmatter zod 스키마 (필수 항목 누락 시 빌드 실패)
  calculators/
    types.ts                # Inputs, CalcResult 등 공통 타입
    registry.ts             # logic.ts 자동 수집 (빌드용)
    <slug>/
      content.mdx           # frontmatter(메타·입력·예시·FAQ·출처) + 본문(계산 방식 설명)
      logic.ts              # export function calculate(inputs): CalcResult — 순수 함수, DOM 금지
      logic.test.ts         # Vitest 경계값 테스트
      client.ts             # (선택) 특수 UI 탈출구: export function setup(ctx)
  components/calculator/    # 폼 자동 렌더링, 결과, FAQ, 출처 박스
  lib/                      # format(쉼표), result-html(결과 마크업), runtime(브라우저 즉시 계산·URL 동기화)
  pages/[slug].astro        # 모든 계산기 페이지를 자동 생성 (템플릿 구성 고정)
docs/new-calculator.md      # 새 계산기 추가 체크리스트
```

- 새 계산기는 `src/calculators/<slug>/`에 파일 3개만 추가한다. 라우팅·홈 목록·sitemap·JSON-LD는 자동.
- 페이지 구성(H1 → 계산기 → 설명 → 예시 → FAQ → 출처 → 관련 → 면책)은 `[slug].astro`에 고정. 계산기별로 바꾸지 않는다.
- 결과 마크업은 `lib/result-html.ts` 하나로 빌드·브라우저가 공유한다. 계산 예시는 `logic.ts`로 빌드 시 계산된다.
- 특수 UI가 꼭 필요하면 (1) `client.ts`의 `setup(ctx)` 훅, (2) MDX 본문에서 컴포넌트 import 순으로 고려한다.
- UI 프레임워크·CSS 프레임워크·웹폰트를 추가하지 않는다. 페이지당 JS 최소화.
- 스택 변경·유료 의존성·외부 서비스 가입·배포는 사용자 승인 없이 하지 않는다.

## 명령어

```sh
npm run dev       # 개발 서버 (http://localhost:4321)
npm test          # Vitest 전체
npm run build     # astro check(타입) + 정적 빌드 → dist/
npm run preview   # 빌드 결과 확인
```

- TypeScript는 6.x로 고정 (`astro check`가 TS 7을 아직 지원하지 않음).
- 작업 완료 전 `npm test`와 `npm run build`가 모두 통과해야 한다.

## 계산기 추가 절차 (요약 — 상세는 docs/new-calculator.md)

1. 공식 출처 확인 → 근거 조문·기준 연도 메모
2. `src/calculators/<slug>/` 생성: `content.mdx`, `logic.ts`, `logic.test.ts`
3. `npm test` → `npm run build` → `npm run preview`로 페이지 확인
4. 확인하지 못한 항목은 `needsVerification`에 적고 보고
