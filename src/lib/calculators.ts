import { getCollection, type CollectionEntry } from 'astro:content';

export type CalculatorEntry = CollectionEntry<'calculators'>;

/** 공개된 계산기 전체 (order → 제목 순) */
export async function getCalculators(): Promise<CalculatorEntry[]> {
  const all = await getCollection('calculators', (e) => !e.data.draft);
  return all.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title, 'ko'));
}
