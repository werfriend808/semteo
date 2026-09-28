// 계산기 공통 타입. logic.ts는 이 타입만 import하고 DOM/Astro에 의존하지 않는다.

/** 폼에서 logic.ts로 전달되는 값. number 입력은 파싱된 숫자(빈 값이면 null), 나머지는 문자열. */
export type InputValue = number | string | null;
export type Inputs = Record<string, InputValue>;

export interface ResultRow {
  label: string;
  value: number | string;
  unit?: string;
  /** true인 행 중 첫 번째가 결과 상단에 크게 표시된다. */
  emphasis?: boolean;
}

export interface CalcResult {
  rows: ResultRow[];
  notes?: string[];
  warnings?: string[];
}

export type Calculate = (inputs: Inputs) => CalcResult;

export interface LogicModule {
  calculate: Calculate;
}

/** 선택적 client.ts가 받는 컨텍스트 (특수 UI용 탈출구). */
export interface ClientContext {
  form: HTMLFormElement;
  resultEl: HTMLElement;
  getInputs(): Inputs;
  recalc(): void;
}

export interface ClientHooks {
  /** 결과가 그려진 직후 호출된다. */
  afterRender?(result: CalcResult, inputs: Inputs): void;
}

export interface ClientModule {
  setup(ctx: ClientContext): ClientHooks | void;
}
