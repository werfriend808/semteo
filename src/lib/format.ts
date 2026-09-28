// 숫자 표시/파싱 유틸. 서버(빌드)와 브라우저에서 모두 사용한다.

/** 1234567 → "1,234,567" (ICU 설정과 무관하게 동일한 결과) */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '-';
  const negative = n < 0;
  const [int, frac] = Math.abs(n).toString().split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (negative ? '-' : '') + grouped + (frac ? '.' + frac : '');
}

/** "1,234" → 1234, 빈 값·형식 오류 → null */
export function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

/** 입력 중인 문자열을 쉼표 포맷으로 정리. 숫자/부호/소수점 외 문자는 제거. */
export function formatTyping(raw: string, allowDecimal = false): string {
  const negative = raw.trim().startsWith('-');
  let body = raw.replace(allowDecimal ? /[^\d.]/g : /\D/g, '');
  let frac: string | undefined;
  if (allowDecimal && body.includes('.')) {
    const idx = body.indexOf('.');
    frac = body.slice(idx + 1).replace(/\./g, '');
    body = body.slice(0, idx);
  }
  body = body.replace(/^0+(?=\d)/, '');
  const grouped = body.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (negative ? '-' : '') + grouped + (frac !== undefined ? '.' + frac : '');
}
