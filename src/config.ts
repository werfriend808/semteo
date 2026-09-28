// 사이트 전역 설정. 값을 바꿀 곳은 이 파일 하나뿐이다.

/** 배포 도메인. TODO: 도메인 확정 후 교체 (canonical·sitemap·OG에 사용) */
export const SITE_URL = 'https://semteo.example';

export const SITE_NAME = '셈터';
export const SITE_TAGLINE = '생활 계산기 모음';
export const SITE_DESCRIPTION =
  '3.3% 세금, 주휴수당, 연차, 퇴직금 등 생활에 필요한 계산을 공식 기준에 맞춰 바로 해 보는 무료 계산기 모음입니다.';

/** 문의 이메일. TODO: 실제 주소로 교체 */
export const CONTACT_EMAIL = 'TODO_EMAIL';

/** 애드센스 승인 후 true로. false면 AdSlot은 아무것도 렌더링하지 않는다. */
export const ADS_ENABLED = false;

/** 홈 화면에 표시되는 카테고리 (순서대로 노출). 키는 content.mdx의 category 값. */
export const CATEGORIES = {
  labor: '급여·노동',
  tax: '세금',
  life: '생활',
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
