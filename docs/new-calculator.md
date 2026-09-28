# 새 계산기 추가 체크리스트

예시는 `src/calculators/freelancer-3-3/`을 복사해서 시작하면 가장 빠르다.

## 1. 출처 확인 (코드보다 먼저)

- [ ] 적용할 세율·요율·기준을 **공식 출처**에서 확인했다 (국가법령정보센터 조문, 국세청·고용노동부·국민건강보험공단 등 기관 안내)
- [ ] 적용 기준 연도와 시행일을 확인했다 (연중 개정 여부 포함)
- [ ] 끝수 처리(원 단위 절사·반올림), 최저·최고 한도, 예외 규정을 확인했다
- [ ] 확인하지 못한 부분은 목록으로 따로 적어 두었다 → `needsVerification`

## 2. 파일 3개

```
src/calculators/<slug>/
  content.mdx
  logic.ts
  logic.test.ts
```

`<slug>`는 URL이 된다 (`/<slug>/`). 영문 소문자·숫자·하이픈만 쓴다.

### content.mdx frontmatter

| 항목 | 필수 | 설명 |
| --- | --- | --- |
| `title` | ✅ | H1이자 페이지 제목 |
| `summary` | ✅ | H1 아래 한 줄 요약, 홈 카드 문구 |
| `description` | ✅ | meta description, 40~160자 |
| `category` | ✅ | `labor`(급여·노동) / `tax`(세금) / `life`(생활) — `src/config.ts`의 CATEGORIES |
| `order` | | 홈 목록 정렬 (작을수록 앞, 기본 100) |
| `baseYear` | ✅ | 적용 기준 연도 (예: 2026) |
| `lastVerified` | ✅ | 출처 최종 확인일 `'YYYY-MM-DD'` (따옴표 필수) |
| `sources` | ✅ | `[{ name, url, note? }]` 최소 1개. name에 법령명·조문까지 |
| `needsVerification` | | 공식 확인 못 한 항목. 페이지에 "확인 필요"로 표시됨 |
| `inputs` | ✅ | 입력 정의 (아래) |
| `examples` | ✅ | 1~3개 `{ title, description?, inputs }` — 빌드 시 logic.ts로 계산되어 표시 |
| `faq` | ✅ | `[{ q, a }]` 최소 3개 (5개 이상 권장). FAQPage JSON-LD 자동 생성 |
| `related` | | 관련 계산기 slug 목록 (없는 slug면 빌드 실패) |
| `draft` | | true면 빌드에서 제외 |

### inputs 항목

```yaml
- id: gross            # logic.ts에서 inputs.gross로 받음 (영문으로 시작)
  label: 세전 금액
  type: number         # number | select | date | radio
  unit: 원
  default: 2000000
  min: 0
  max: 1000000000000
  step: 1              # 1 미만이면 소수 입력(inputmode=decimal)
  help: 도움말 문장
  options:             # select/radio만 (최소 2개)
    - { value: a, label: 보기 A }
  showIf: { id: mode, equals: gross }   # 다른 입력값이 이 값일 때만 표시
```

- number 값은 숫자(빈 칸이면 `null`), 나머지는 문자열로 `calculate`에 전달된다.
- 입력값은 URL 쿼리에 자동 반영된다 (기본값과 같으면 생략).

### 본문 (MDX)

- `## 계산 방식`(공식), `### 적용 기준`, 개념 설명을 H2/H3로 쓴다. H1은 쓰지 않는다 (템플릿이 출력).
- 예시·FAQ·출처·면책은 템플릿이 자동으로 붙이므로 본문에 쓰지 않는다.

### logic.ts

```ts
import type { CalcResult, Inputs } from '../types';

export function calculate(inputs: Inputs): CalcResult {
  return {
    rows: [{ label: '실수령액', value: 123, unit: '원', emphasis: true }],
    notes: ['계산 기준 안내'],
    warnings: ['입력 오류 안내'],
  };
}
```

- 순수 함수. DOM·`window`·Astro import 금지 (브라우저와 빌드에서 같이 쓰임).
- `emphasis: true`인 첫 행이 결과 상단에 크게 표시된다.
- 빈 값·음수·상한 초과는 예외를 던지지 말고 `warnings`로 알린다.
- 금액 계산은 정수 연산으로 (예: `Math.floor(amount * 3 / 100)`), 근거 조문을 주석으로 남긴다.

## 3. 테스트 (logic.test.ts)

- [ ] 0 입력
- [ ] 빈 입력(`null`)·음수·상한 초과 → warnings
- [ ] 끝수 처리 경계 (예: 10원 절사 직전/직후)
- [ ] 법정 구간·한도 경계 (예: 세액 999원/1,000원, 주 15시간 등)
- [ ] 큰 금액 (1억 이상)
- [ ] 역산 기능이 있으면 왕복 일치(역산 → 재계산 = 입력값) 또는 오차 규칙을 테스트로 명시
- [ ] frontmatter 예시 금액의 기대값

## 4. 확인

- [ ] `npm test` 통과
- [ ] `npm run build` 통과 (스키마·타입 검증 포함)
- [ ] `npm run preview`에서 페이지 확인: 입력 즉시 갱신, 쉼표, URL 공유 후 새로고침 유지, 모바일 폭(360px)
- [ ] 홈 카테고리에 카드가 나타남
- [ ] "확인 필요" 항목이 있으면 사용자에게 보고

## 특수 UI가 필요할 때 (탈출구)

기본 폼으로 부족할 때만 쓴다.

1. **`client.ts`** — 같은 폴더에 두면 자동 로드된다.

   ```ts
   import type { ClientContext, ClientHooks } from '../types';

   export function setup(ctx: ClientContext): ClientHooks {
     // ctx.form, ctx.resultEl, ctx.getInputs(), ctx.recalc()
     return {
       afterRender(result, inputs) {
         /* 결과 렌더 직후 추가 UI 갱신 */
       },
     };
   }
   ```

2. **MDX 컴포넌트** — 본문에 표·도표 등 정적 컴포넌트가 필요하면 `content.mdx`에서 직접 import 한다.
