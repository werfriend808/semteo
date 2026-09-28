// 계산기 frontmatter 스키마. 필수 항목이 빠지거나 형식이 틀리면 빌드가 실패한다.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './config';

const optionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

const inputSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'id는 영문으로 시작하는 영숫자/_'),
    label: z.string().min(1),
    type: z.enum(['number', 'select', 'date', 'radio']),
    unit: z.string().optional(),
    default: z.union([z.number(), z.string()]).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().positive().optional(),
    help: z.string().optional(),
    placeholder: z.string().optional(),
    options: z.array(optionSchema).min(2).optional(),
    /** 다른 입력값이 특정 값일 때만 표시. 예: { id: 'mode', equals: 'gross' } */
    showIf: z.object({ id: z.string(), equals: z.string() }).optional(),
  })
  .refine((d) => (d.type === 'select' || d.type === 'radio') === Boolean(d.options), {
    message: 'select/radio에는 options가 필요하고, 그 외 타입에는 options를 쓰지 않는다',
  });

const calculators = defineCollection({
  loader: glob({
    pattern: '*/content.mdx',
    base: './src/calculators',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z
    .object({
      /** H1 겸 페이지 제목 */
      title: z.string().min(1),
      /** H1 아래 한 줄 요약 */
      summary: z.string().min(1),
      /** meta description (검색 결과 노출 문구) */
      description: z.string().min(40).max(160),
      category: z.enum(Object.keys(CATEGORIES) as [keyof typeof CATEGORIES]),
      /** 홈 목록 정렬용 (작을수록 앞) */
      order: z.number().default(100),
      /** 적용 기준 연도. 예: 2026 */
      baseYear: z.number().int().min(2000).max(2100),
      /** 출처를 마지막으로 확인한 날짜 YYYY-MM-DD */
      lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식'),
      sources: z
        .array(
          z.object({
            name: z.string().min(1),
            url: z.url(),
            note: z.string().optional(),
          }),
        )
        .min(1, '출처는 최소 1개 필요'),
      /** 공식 출처로 확인하지 못한 항목. 페이지에 "확인 필요"로 표시된다. */
      needsVerification: z.array(z.string()).default([]),
      inputs: z.array(inputSchema).min(1),
      examples: z
        .array(
          z.object({
            title: z.string().min(1),
            description: z.string().optional(),
            inputs: z.record(z.string(), z.union([z.number(), z.string()])),
          }),
        )
        .min(1)
        .max(3),
      faq: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).min(3, 'FAQ는 최소 3개'),
      /** 관련 계산기 slug 목록 */
      related: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    })
    .superRefine((d, ctx) => {
      const ids = new Set(d.inputs.map((i) => i.id));
      if (ids.size !== d.inputs.length) {
        ctx.addIssue({ code: 'custom', message: 'inputs의 id가 중복됨', path: ['inputs'] });
      }
      d.inputs.forEach((input, i) => {
        if (input.showIf && !ids.has(input.showIf.id)) {
          ctx.addIssue({ code: 'custom', message: `showIf.id '${input.showIf.id}'가 없음`, path: ['inputs', i] });
        }
      });
      d.examples.forEach((ex, i) => {
        for (const key of Object.keys(ex.inputs)) {
          if (!ids.has(key)) {
            ctx.addIssue({ code: 'custom', message: `예시 입력 '${key}'가 inputs에 없음`, path: ['examples', i] });
          }
        }
      });
    }),
});

export const collections = { calculators };
