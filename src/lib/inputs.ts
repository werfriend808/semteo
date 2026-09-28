// 입력 정의(frontmatter inputs) 관련 순수 유틸.
import type { Inputs } from '../calculators/types';

export interface InputDef {
  id: string;
  label: string;
  type: 'number' | 'select' | 'date' | 'radio';
  unit?: string;
  default?: number | string;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  showIf?: { id: string; equals: string };
}

export function defaultInputs(defs: InputDef[]): Inputs {
  const out: Inputs = {};
  for (const d of defs) {
    if (d.type === 'number') out[d.id] = typeof d.default === 'number' ? d.default : null;
    else if (d.default !== undefined) out[d.id] = String(d.default);
    else out[d.id] = d.options?.[0]?.value ?? null;
  }
  return out;
}

export function isVisible(def: InputDef, inputs: Inputs): boolean {
  if (!def.showIf) return true;
  return String(inputs[def.showIf.id] ?? '') === def.showIf.equals;
}
