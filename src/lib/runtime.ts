// 계산기 페이지 클라이언트 스크립트: 입력 → 즉시 계산 → 결과 렌더, URL 쿼리 동기화.
import type { ClientHooks, ClientModule, Inputs, LogicModule } from '../calculators/types';
import { formatTyping, parseNumber } from './format';
import { isVisible, type InputDef } from './inputs';
import { renderResultHtml } from './result-html';

// lazy glob: 계산기별 로직이 별도 청크로 분리되어 해당 페이지에서만 로드된다.
const logicLoaders = import.meta.glob<LogicModule>('../calculators/*/logic.ts');
const clientLoaders = import.meta.glob<ClientModule>('../calculators/*/client.ts');

function fieldEls(form: HTMLFormElement, id: string): HTMLInputElement[] {
  return Array.from(form.querySelectorAll<HTMLInputElement>(`[name="${id}"]`));
}

function readInputs(form: HTMLFormElement, defs: InputDef[]): Inputs {
  const out: Inputs = {};
  for (const d of defs) {
    const els = fieldEls(form, d.id);
    if (d.type === 'radio') {
      out[d.id] = els.find((el) => el.checked)?.value ?? null;
    } else if (d.type === 'number') {
      out[d.id] = parseNumber(els[0]?.value ?? '');
    } else {
      out[d.id] = els[0]?.value || null;
    }
  }
  return out;
}

function writeInput(form: HTMLFormElement, def: InputDef, raw: string) {
  const els = fieldEls(form, def.id);
  if (def.type === 'radio') {
    const target = els.find((el) => el.value === raw);
    if (target) target.checked = true;
  } else if (def.type === 'number') {
    if (els[0]) els[0].value = formatTyping(raw, (def.step ?? 1) < 1);
  } else if (def.type === 'select') {
    const sel = form.querySelector<HTMLSelectElement>(`select[name="${def.id}"]`);
    if (sel && Array.from(sel.options).some((o) => o.value === raw)) sel.value = raw;
  } else if (els[0]) {
    els[0].value = raw;
  }
}

function syncUrl(defs: InputDef[], inputs: Inputs) {
  const params = new URLSearchParams();
  for (const d of defs) {
    const v = inputs[d.id];
    if (v === null || v === undefined || v === '') continue;
    if (d.default !== undefined && String(v) === String(d.default)) continue;
    params.set(d.id, String(v));
  }
  const qs = params.toString();
  const url = location.pathname + (qs ? `?${qs}` : '') + location.hash;
  history.replaceState(null, '', url);
}

/** 쉼표 재포맷 후 커서 위치를 "커서 앞 숫자 개수" 기준으로 복원 */
function reformatNumberField(el: HTMLInputElement, allowDecimal: boolean) {
  const caret = el.selectionStart ?? el.value.length;
  const digitsBefore = el.value.slice(0, caret).replace(/[^\d.-]/g, '').length;
  const next = formatTyping(el.value, allowDecimal);
  if (next === el.value) return;
  el.value = next;
  let pos = 0;
  let seen = 0;
  while (pos < next.length && seen < digitsBefore) {
    if (/[\d.-]/.test(next[pos])) seen++;
    pos++;
  }
  el.setSelectionRange(pos, pos);
}

export async function initCalculator() {
  const form = document.querySelector<HTMLFormElement>('form[data-calculator]');
  const resultEl = document.getElementById('calc-result');
  const defsEl = document.getElementById('calc-inputs');
  if (!form || !resultEl || !defsEl) return;

  const slug = form.dataset.calculator!;
  const defs: InputDef[] = JSON.parse(defsEl.textContent || '[]');

  // URL 쿼리 → 입력값 복원
  const params = new URLSearchParams(location.search);
  for (const d of defs) {
    const raw = params.get(d.id);
    if (raw !== null) writeInput(form, d, raw);
  }

  const loadLogic = logicLoaders[`../calculators/${slug}/logic.ts`];
  if (!loadLogic) return;
  const { calculate } = await loadLogic();

  let hooks: ClientHooks | void = undefined;

  const updateVisibility = (inputs: Inputs) => {
    for (const d of defs) {
      const wrap = form.querySelector<HTMLElement>(`[data-field="${d.id}"]`);
      if (wrap) wrap.hidden = !isVisible(d, inputs);
    }
  };

  const recalc = () => {
    const inputs = readInputs(form, defs);
    updateVisibility(inputs);
    const result = calculate(inputs);
    resultEl.innerHTML = renderResultHtml(result);
    syncUrl(defs, inputs);
    hooks?.afterRender?.(result, inputs);
  };

  form.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    const def = defs.find((d) => d.id === el.name);
    if (def?.type === 'number') reformatNumberField(el, (def.step ?? 1) < 1);
    recalc();
  });
  form.addEventListener('change', recalc);
  form.addEventListener('submit', (e) => e.preventDefault());

  const loadClient = clientLoaders[`../calculators/${slug}/client.ts`];
  if (loadClient) {
    const mod = await loadClient();
    hooks = mod.setup({ form, resultEl, getInputs: () => readInputs(form, defs), recalc });
  }

  if (params.size > 0 || hooks) recalc();
}
