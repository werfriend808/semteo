// 프리랜서(인적용역 사업소득) 3.3% 원천징수 계산. 순수 함수만 둔다 (DOM 접근 금지).
//
// 근거
// - 소득세: 원천징수대상 사업소득 × 3% (소득세법 제129조 제1항 제3호)
// - 지방소득세: 원천징수 소득세 × 10% (지방세법 제103조의13, 특별징수)
// - 소액부징수(세액 1,000원 미만 미징수, 소득세법 제86조)는 2024.7.1. 이후 지급하는
//   인적용역 사업소득에는 적용되지 않는다 (국세청 원천징수 안내) → 이 계산기에서는 적용하지 않음
// - 10원 미만 끝수: 국고금 관리법 제47조, 지방회계법 제55조.
//   [확인 필요] 이 조문이 "지급 건별 원천징수세액"에도 적용되는지, "납부 단계"에만 적용되는지
//   공식 해석을 확인하지 못했다. 그래서 절사 여부를 사용자가 고를 수 있게 했다 (기본: 절사).
import { formatNumber } from '../../lib/format';
import type { CalcResult, Inputs } from '../types';

export const INCOME_TAX_PERCENT = 3;
export const LOCAL_TAX_PERCENT_OF_INCOME_TAX = 10;
/** 입력 상한 1조원 (부동소수점 정밀도 여유를 크게 둔 값) */
export const MAX_AMOUNT = 1_000_000_000_000;

export type Rounding = 'floor10' | 'won';
export type Mode = 'gross' | 'net';

export interface Breakdown {
  gross: number;
  incomeTax: number;
  localTax: number;
  totalTax: number;
  net: number;
}

/** 정수 금액 × percent% 를 끝수 규칙에 맞게 내림. 정수 연산만 사용해 부동소수점 오차를 피한다. */
function percentOf(amount: number, percent: number, rounding: Rounding): number {
  const scaled = amount * percent; // 정수
  return rounding === 'floor10' ? Math.floor(scaled / 1000) * 10 : Math.floor(scaled / 100);
}

export function fromGross(gross: number, rounding: Rounding = 'floor10'): Breakdown {
  const g = Math.floor(gross);
  const incomeTax = percentOf(g, INCOME_TAX_PERCENT, rounding);
  const localTax = percentOf(incomeTax, LOCAL_TAX_PERCENT_OF_INCOME_TAX, rounding);
  const totalTax = incomeTax + localTax;
  return { gross: g, incomeTax, localTax, totalTax, net: g - totalTax };
}

export interface NetResult extends Breakdown {
  exact: boolean;
  /** 같은 실수령액이 되는 다른 세전 금액 (작은 순) */
  alternatives: number[];
}

/**
 * 실수령액 → 세전 금액 역산.
 * 끝수 절사 때문에 세전 금액 여러 개가 같은 실수령액이 될 수 있다
 * (예: 1,999,980원과 2,000,000원 모두 실수령 1,934,000원) → 가장 큰 세전 금액을 대표값으로 반환하고
 * 나머지는 alternatives로 돌려준다.
 * 실수령액은 세전 금액이 1원 늘 때 최대 1원만 늘어나므로 0 이상의 모든 정수 실수령액에 대응하는
 * 세전 금액이 존재한다 (exact=true). exact=false는 방어용 분기.
 */
export function fromNet(net: number, rounding: Rounding = 'floor10'): NetResult {
  const target = Math.floor(net);
  const rate = 1 - (INCOME_TAX_PERCENT * (100 + LOCAL_TAX_PERCENT_OF_INCOME_TAX)) / 10000; // 0.967
  // net ∈ [0.967g, 0.967g + 21] 이므로 g ∈ [(target-21)/0.967, target/0.967]
  const start = Math.max(0, Math.floor((target - 30) / rate));
  const end = Math.ceil(target / rate) + 2;
  const matches: number[] = [];
  let fallback: Breakdown | null = null;
  for (let g = start; g <= end; g++) {
    const b = fromGross(g, rounding);
    if (b.net === target) matches.push(g);
    else if (!fallback && b.net > target) fallback = b;
  }
  if (matches.length === 0) {
    return { ...(fallback ?? fromGross(end, rounding)), exact: false, alternatives: [] };
  }
  const best = matches[matches.length - 1];
  return { ...fromGross(best, rounding), exact: true, alternatives: matches.slice(0, -1) };
}

function emptyResult(mode: Mode, warning: string): CalcResult {
  return { ...toResult(fromGross(0), mode), warnings: [warning] };
}

function toResult(b: Breakdown, mode: Mode): CalcResult {
  return {
    rows: [
      { label: '세전 금액', value: b.gross, unit: '원', emphasis: mode === 'net' },
      { label: '소득세 (3%)', value: b.incomeTax, unit: '원' },
      { label: '지방소득세 (소득세의 10%)', value: b.localTax, unit: '원' },
      { label: '공제 합계 (3.3%)', value: b.totalTax, unit: '원' },
      { label: '실수령액', value: b.net, unit: '원', emphasis: mode === 'gross' },
    ],
  };
}

export function calculate(inputs: Inputs): CalcResult {
  const mode: Mode = inputs.mode === 'net' ? 'net' : 'gross';
  const rounding: Rounding = inputs.rounding === 'won' ? 'won' : 'floor10';
  const amount = mode === 'gross' ? inputs.gross : inputs.net;

  if (amount === null || amount === undefined || amount === '') {
    return emptyResult(mode, '금액을 입력해 주세요.');
  }
  const value = Number(amount);
  if (!Number.isFinite(value)) return emptyResult(mode, '숫자로 입력해 주세요.');
  if (value < 0) return emptyResult(mode, '0원 이상의 금액을 입력해 주세요.');
  if (value > MAX_AMOUNT) return emptyResult(mode, '1조원 이하의 금액을 입력해 주세요.');

  const notes: string[] = [];
  const warnings: string[] = [];
  let b: Breakdown;
  if (mode === 'gross') {
    b = fromGross(value, rounding);
  } else {
    const r = fromNet(value, rounding);
    b = r;
    if (!r.exact) warnings.push('입력한 실수령액과 정확히 일치하는 세전 금액이 없어 가장 가까운 큰 금액을 표시했습니다.');
    if (r.alternatives.length) {
      notes.push(
        `세금 끝수 처리 때문에 세전 ${r.alternatives.map((g) => formatNumber(g) + '원').join(', ')}도 실수령액이 같습니다. 위에는 가장 큰 금액을 표시했습니다.`,
      );
    }
  }
  if (!Number.isInteger(value)) notes.push('원 미만 금액은 버리고 계산했습니다.');
  if (b.incomeTax > 0 && b.incomeTax < 1000) {
    notes.push(
      '소득세가 1,000원 미만이지만, 2024년 7월 1일 이후 지급하는 인적용역 사업소득은 소액부징수 대상에서 제외되어 원천징수됩니다.',
    );
  }
  notes.push(
    rounding === 'floor10'
      ? '소득세·지방소득세는 각각 10원 미만을 버렸습니다.'
      : '소득세·지방소득세는 각각 1원 미만만 버렸습니다.',
  );

  const result = toResult(b, mode);
  return { ...result, notes, warnings: warnings.length ? warnings : undefined };
}
