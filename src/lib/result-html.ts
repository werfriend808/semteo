// 결과(CalcResult) → HTML. 빌드 시 초기 결과·예시 렌더링과 브라우저 갱신이 같은 함수를 써서 마크업이 항상 일치한다.
import type { CalcResult, ResultRow } from '../calculators/types';
import { formatNumber } from './format';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function valueHtml(row: ResultRow): string {
  const v = typeof row.value === 'number' ? formatNumber(row.value) : row.value;
  const unit = row.unit ? `<span class="unit">${escapeHtml(row.unit)}</span>` : '';
  return `${escapeHtml(v)}${unit}`;
}

function listHtml(items: string[] | undefined, cls: string): string {
  if (!items?.length) return '';
  return `<ul class="${cls}">${items.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`;
}

export function renderResultHtml(result: CalcResult): string {
  const hero = result.rows.find((r) => r.emphasis) ?? result.rows[0];
  const heroHtml = hero
    ? `<div class="result-hero"><span class="result-hero-label">${escapeHtml(hero.label)}</span><strong class="result-hero-value">${valueHtml(hero)}</strong></div>`
    : '';
  const rows = result.rows
    .map(
      (r) =>
        `<div class="result-row${r === hero ? ' is-hero' : ''}"><dt>${escapeHtml(r.label)}</dt><dd>${valueHtml(r)}</dd></div>`,
    )
    .join('');
  return (
    listHtml(result.warnings, 'result-warnings') +
    heroHtml +
    `<dl class="result-rows">${rows}</dl>` +
    listHtml(result.notes, 'result-notes')
  );
}
