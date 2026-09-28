import { describe, expect, it } from 'vitest';
import { calculate, fromGross, fromNet, MAX_AMOUNT } from './logic';

const row = (r: ReturnType<typeof calculate>, label: string) =>
  r.rows.find((x) => x.label.startsWith(label))?.value;

describe('fromGross (세전 → 실수령)', () => {
  it('0원이면 모두 0', () => {
    expect(fromGross(0)).toEqual({ gross: 0, incomeTax: 0, localTax: 0, totalTax: 0, net: 0 });
  });

  it('월 200만원 예시', () => {
    expect(fromGross(2_000_000)).toEqual({
      gross: 2_000_000,
      incomeTax: 60_000,
      localTax: 6_000,
      totalTax: 66_000,
      net: 1_934_000,
    });
  });

  it('월 50만원 예시', () => {
    expect(fromGross(500_000)).toMatchObject({ incomeTax: 15_000, localTax: 1_500, net: 483_500 });
  });

  it('1억원', () => {
    expect(fromGross(100_000_000)).toMatchObject({ incomeTax: 3_000_000, localTax: 300_000, net: 96_700_000 });
  });

  it('상한(1조원)에서도 정수 연산이 정확', () => {
    expect(fromGross(MAX_AMOUNT)).toMatchObject({ incomeTax: 30_000_000_000, localTax: 3_000_000_000 });
  });

  describe('10원 미만 절사 경계', () => {
    it('333원 → 소득세 9.99원 → 0원', () => {
      expect(fromGross(333)).toMatchObject({ incomeTax: 0, localTax: 0, net: 333 });
    });
    it('334원 → 소득세 10.02원 → 10원, 지방소득세 1원 → 0원', () => {
      expect(fromGross(334)).toMatchObject({ incomeTax: 10, localTax: 0, net: 324 });
    });
    it('3,333원 → 소득세 99.99 → 90원, 지방소득세 9 → 0원', () => {
      expect(fromGross(3_333)).toMatchObject({ incomeTax: 90, localTax: 0 });
    });
    it('3,334원 → 소득세 100원, 지방소득세 10원', () => {
      expect(fromGross(3_334)).toMatchObject({ incomeTax: 100, localTax: 10 });
    });
    it('원 단위 모드는 1원 미만만 버림', () => {
      expect(fromGross(3_333, 'won')).toMatchObject({ incomeTax: 99, localTax: 9, net: 3_225 });
      expect(fromGross(334, 'won')).toMatchObject({ incomeTax: 10, localTax: 1, net: 323 });
    });
  });

  describe('소액부징수 경계 (인적용역 사업소득은 적용 안 함)', () => {
    it('소득세 999원 근처(33,300원)도 원천징수한다', () => {
      expect(fromGross(33_300, 'won')).toMatchObject({ incomeTax: 999, localTax: 99 });
      expect(fromGross(33_300)).toMatchObject({ incomeTax: 990, localTax: 90 });
    });
    it('소득세 1,000원(33,334원)', () => {
      expect(fromGross(33_334)).toMatchObject({ incomeTax: 1_000, localTax: 100 });
    });
    it('1,000원 미만이면 안내 문구가 붙는다', () => {
      const r = calculate({ mode: 'gross', gross: 33_300, rounding: 'floor10' });
      expect(row(r, '소득세')).toBe(990);
      expect(r.notes?.some((n) => n.includes('소액부징수'))).toBe(true);
      const r2 = calculate({ mode: 'gross', gross: 33_334, rounding: 'floor10' });
      expect(r2.notes?.some((n) => n.includes('소액부징수'))).toBe(false);
    });
  });
});

describe('fromNet (실수령 → 세전 역산)', () => {
  it('1,934,000원 → 2,000,000원', () => {
    expect(fromNet(1_934_000)).toMatchObject({ gross: 2_000_000, exact: true });
  });

  it('0원 → 0원', () => {
    expect(fromNet(0)).toMatchObject({ gross: 0, net: 0, exact: true });
  });

  it('1억원 실수령', () => {
    const r = fromNet(100_000_000);
    expect(r.exact).toBe(true);
    expect(fromGross(r.gross).net).toBe(100_000_000);
  });

  it('같은 실수령액이 되는 세전 금액이 여럿이면 가장 큰 값 + 나머지는 alternatives', () => {
    const r = fromNet(1_934_000);
    expect(r.alternatives).toEqual([1_999_980]);
    expect(fromGross(1_999_980).net).toBe(1_934_000);
  });

  // 오차 규칙: 역산한 세전 금액으로 다시 계산하면 실수령액이 입력값과 정확히 일치해야 한다(오차 0원).
  // 같은 실수령액이 되는 세전 금액이 여럿이면 가장 큰 값을 대표로 고른다.
  for (const rounding of ['floor10', 'won'] as const) {
    it(`왕복 일치 + 최댓값·후보 완전성 (${rounding}, 0~20,000원 전수)`, () => {
      const failures: number[] = [];
      for (let net = 0; net <= 20_000; net++) {
        const r = fromNet(net, rounding);
        let ok = r.exact && fromGross(r.gross, rounding).net === net;
        for (const alt of r.alternatives) {
          ok &&= alt < r.gross && fromGross(alt, rounding).net === net;
        }
        // 탐색 범위 밖에 더 큰/작은 후보가 없음을 확인
        for (let k = 1; k <= 40; k++) {
          ok &&= fromGross(r.gross + k, rounding).net !== net;
          const lower = (r.alternatives[0] ?? r.gross) - k;
          if (lower >= 0) ok &&= fromGross(lower, rounding).net !== net;
        }
        if (!ok) failures.push(net);
      }
      expect(failures).toEqual([]);
    });

    it(`왕복 일치 (${rounding}, 큰 금액 표본)`, () => {
      for (const net of [999_999, 1_234_567, 50_000_001, 96_700_000, 999_999_999, 123_456_789_012]) {
        const r = fromNet(net, rounding);
        expect(r.exact).toBe(true);
        expect(fromGross(r.gross, rounding).net).toBe(net);
      }
    });
  }
});

describe('calculate (입력 검증·결과 형태)', () => {
  it('빈 입력이면 경고와 0원 결과', () => {
    const r = calculate({ mode: 'gross', gross: null, rounding: 'floor10' });
    expect(r.warnings).toEqual(['금액을 입력해 주세요.']);
    expect(row(r, '실수령액')).toBe(0);
  });

  it('음수 입력이면 경고', () => {
    const r = calculate({ mode: 'gross', gross: -1000, rounding: 'floor10' });
    expect(r.warnings?.[0]).toContain('0원 이상');
    expect(row(r, '소득세')).toBe(0);
  });

  it('상한 초과면 경고', () => {
    const r = calculate({ mode: 'gross', gross: MAX_AMOUNT + 1, rounding: 'floor10' });
    expect(r.warnings?.[0]).toContain('1조원');
  });

  it('세전 모드는 실수령액을, 역산 모드는 세전 금액을 강조', () => {
    const g = calculate({ mode: 'gross', gross: 2_000_000, rounding: 'floor10' });
    expect(g.rows.find((x) => x.emphasis)?.label).toBe('실수령액');
    const n = calculate({ mode: 'net', net: 1_934_000, rounding: 'floor10' });
    expect(n.rows.find((x) => x.emphasis)?.label).toBe('세전 금액');
    expect(row(n, '세전 금액')).toBe(2_000_000);
    expect(n.notes?.some((x) => x.includes('1,999,980원'))).toBe(true);
  });

  it('역산 모드에서 빈 입력', () => {
    const r = calculate({ mode: 'net', net: null, rounding: 'floor10' });
    expect(r.warnings).toEqual(['금액을 입력해 주세요.']);
  });

  it('소수 입력은 원 미만을 버린다', () => {
    const r = calculate({ mode: 'gross', gross: 2_000_000.9, rounding: 'floor10' });
    expect(row(r, '세전 금액')).toBe(2_000_000);
  });
});
