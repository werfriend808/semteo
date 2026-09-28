import { describe, expect, it } from 'vitest';
import { formatNumber, formatTyping, parseNumber } from './format';
import { renderResultHtml } from './result-html';

describe('formatNumber', () => {
  it('천 단위 쉼표', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(-1234567)).toBe('-1,234,567');
    expect(formatNumber(1234.5)).toBe('1,234.5');
  });
});

describe('parseNumber', () => {
  it('쉼표·공백 제거 후 숫자', () => {
    expect(parseNumber('1,234,567')).toBe(1234567);
    expect(parseNumber(' 12 ')).toBe(12);
    expect(parseNumber('-500')).toBe(-500);
  });
  it('빈 값·형식 오류는 null', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('-')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('1.2.3')).toBeNull();
  });
});

describe('formatTyping', () => {
  it('입력 중 문자열 정리', () => {
    expect(formatTyping('1234567')).toBe('1,234,567');
    expect(formatTyping('12a34')).toBe('1,234');
    expect(formatTyping('0012')).toBe('12');
    expect(formatTyping('')).toBe('');
    expect(formatTyping('-1000')).toBe('-1,000');
    expect(formatTyping('1234.56', true)).toBe('1,234.56');
    expect(formatTyping('1234.56')).toBe('123,456');
  });
});

describe('renderResultHtml', () => {
  it('강조 행을 hero로, HTML 이스케이프', () => {
    const html = renderResultHtml({
      rows: [
        { label: 'A', value: 1000, unit: '원' },
        { label: '<B>', value: 2000, unit: '원', emphasis: true },
      ],
      notes: ['n'],
    });
    expect(html).toContain('result-hero-label">&lt;B&gt;');
    expect(html).toContain('2,000<span class="unit">원</span>');
    expect(html).toContain('<ul class="result-notes"><li>n</li></ul>');
  });
});
