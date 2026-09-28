// 빌드 시 각 계산기의 logic.ts를 slug로 찾는다. 새 계산기는 폴더만 추가하면 자동 등록된다.
import type { Calculate, LogicModule } from './types';

const logicModules = import.meta.glob<LogicModule>('./*/logic.ts', { eager: true });

export function getCalculate(slug: string): Calculate {
  const mod = logicModules[`./${slug}/logic.ts`];
  if (!mod || typeof mod.calculate !== 'function') {
    throw new Error(`[셈터] src/calculators/${slug}/logic.ts에 calculate 함수가 없습니다.`);
  }
  return mod.calculate;
}
