// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/config.ts';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  // CSS가 작아서 인라인이 렌더 차단 요청보다 빠르다 (Lighthouse 성능)
  build: { inlineStylesheets: 'always' },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.endsWith('/404/') && !page.endsWith('/404'),
    }),
  ],
});
