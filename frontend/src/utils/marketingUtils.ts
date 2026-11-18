/**
 * CODE TO KNOW (碼上學) - 品牌行銷、UTM 流量追蹤與媒體資產工具
 * 對應原始 UID：P17-MED-001（品牌核心帳號）、P17-MED-009（網站流量與轉換追蹤）
 */

export interface UtmParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface BrandMetadata {
  brandNameZh: string;
  brandNameEn: string;
  fullNameZh: string;
  sloganZh: string;
  taglineEn: string;
  officialHandles: {
    youtube: string;
    instagram: string;
    threads: string;
    facebook: string;
    github: string;
  };
  contactEmail: string;
}

export const OFFICIAL_BRAND_METADATA: BrandMetadata = {
  brandNameZh: '碼上學',
  brandNameEn: 'CODE TO KNOW',
  fullNameZh: '碼上學 AI 智慧學習與教育科技平台',
  sloganZh: '碼上學，學無止境。',
  taglineEn: 'Learn Beyond Limits.',
  officialHandles: {
    youtube: '@codetoknow_tw',
    instagram: '@codetoknow.tw',
    threads: '@codetoknow.tw',
    facebook: 'CodeToKnowTaiwan',
    github: 'Leonjay990414/CODE-TO-KNOW',
  },
  contactEmail: 'contact@codetoknow.edu',
};

/**
 * 解析網址查詢字串中的標準 UTM 行銷追蹤參數
 */
export function parseUtmParameters(queryString: string): UtmParameters {
  const params: UtmParameters = {};
  if (!queryString) return params;

  try {
    const cleanSearch = queryString.startsWith('?') ? queryString.slice(1) : queryString;
    const searchParams = new URLSearchParams(cleanSearch);

    const source = searchParams.get('utm_source');
    const medium = searchParams.get('utm_medium');
    const campaign = searchParams.get('utm_campaign');
    const term = searchParams.get('utm_term');
    const content = searchParams.get('utm_content');

    if (source) params.utm_source = source;
    if (medium) params.utm_medium = medium;
    if (campaign) params.utm_campaign = campaign;
    if (term) params.utm_term = term;
    if (content) params.utm_content = content;
  } catch (err) {
    console.warn('[MarketingUtils] Failed to parse UTM parameters:', err);
  }

  return params;
}

/**
 * 組合標準行銷導流網址（符合 P17-MED-009 命名規範）
 */
export function buildMarketingUrl(baseUrl: string, utm: UtmParameters): string {
  try {
    const url = new URL(baseUrl, 'https://codetoknow.edu.tw');
    if (utm.utm_source) url.searchParams.set('utm_source', utm.utm_source);
    if (utm.utm_medium) url.searchParams.set('utm_medium', utm.utm_medium);
    if (utm.utm_campaign) url.searchParams.set('utm_campaign', utm.utm_campaign);
    if (utm.utm_term) url.searchParams.set('utm_term', utm.utm_term);
    if (utm.utm_content) url.searchParams.set('utm_content', utm.utm_content);
    return url.toString();
  } catch {
    return baseUrl;
  }
}
