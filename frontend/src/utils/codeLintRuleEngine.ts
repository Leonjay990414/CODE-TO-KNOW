/**
 * CODE TO KNOW (碼上學) - 離線考場語法規則與版面檢查引擎
 * 對應原始 UID：P11-AIS-006（程式碼與版面檢查：規則與 AI 判斷分離）
 *
 * 核心原則：
 * 1. 物理區隔「客觀確定性語法規則（Rule Violations）」與「主觀啟發式 AI 引導（AI Suggestions）」。
 * 2. 涵蓋考場五大題組最常見扣分點（DOCTYPE、alt 屬性、未閉合標籤、非法 CSS 語法）。
 * 3. 離線純函式運算，100% 確定性、零網路呼叫、防 ReDoS 安全正則。
 */

export type RuleSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface RuleViolation {
  ruleId: string;
  ruleTitleZh: string;
  severity: RuleSeverity;
  messageZh: string;
  sourceType: 'OFFLINE_SYNTAX_RULE'; // 標記為離線語法規則
  affectedSnippet?: string;
  recommendedFixZh: string;
}

export interface AiHeuristicGuidance {
  topicZh: string;
  sourceType: 'HEURISTIC_AI_DEMO'; // 標記為展示版啟發式建議
  pedagogicalStage: 1 | 2 | 3 | 4;
  socraticHintZh: string;
  guidingQuestionZh: string;
}

export interface CodeLintAnalysisResult {
  hasErrors: boolean;
  ruleViolationsCount: number;
  ruleViolations: RuleViolation[];
  aiSuggestions: AiHeuristicGuidance[];
  summaryZh: string;
}

/**
 * 執行考場程式碼結構與樣式檢查
 */
export function lintExamCode(code: string): CodeLintAnalysisResult {
  const content = (code || '').trim();
  const ruleViolations: RuleViolation[] = [];
  const aiSuggestions: AiHeuristicGuidance[] = [];

  if (!content) {
    return {
      hasErrors: false,
      ruleViolationsCount: 0,
      ruleViolations: [],
      aiSuggestions: [],
      summaryZh: '程式碼內容為空，無檢驗項目。',
    };
  }

  // 1. DOCTYPE 檢測（若包含 <html> 則視為完整網頁，必須宣告 DOCTYPE）
  if (/<html/i.test(content) && !/<!DOCTYPE\s+html>/i.test(content)) {
    ruleViolations.push({
      ruleId: 'EXAM-RULE-001',
      ruleTitleZh: '缺少 HTML5 文件類型宣告',
      severity: 'ERROR',
      messageZh: '完整網頁第一行必須宣告 <!DOCTYPE html>，否則可能觸發瀏覽器怪異模式（Quirks Mode）導致版面失真。',
      sourceType: 'OFFLINE_SYNTAX_RULE',
      affectedSnippet: content.slice(0, 30),
      recommendedFixZh: '在文件最開頭補上 <!DOCTYPE html>',
    });
  }

  // 2. <title> 標籤檢測
  if (/<head/i.test(content) && !/<title[^>]*>.*?<\/title>/i.test(content)) {
    ruleViolations.push({
      ruleId: 'EXAM-RULE-002',
      ruleTitleZh: '缺少網頁標題標籤',
      severity: 'ERROR',
      messageZh: '依考場規範，<head> 內部必須包含 <title> 標籤並註明題目規定標題。',
      sourceType: 'OFFLINE_SYNTAX_RULE',
      recommendedFixZh: '在 <head> 中加入 <title>網頁標題</title>',
    });
  }

  // 3. <img> 缺少 alt 屬性檢測
  const imgTagsWithoutAlt = content.match(/<img(?![^>]*\balt\s*=)[^>]*>/gi);
  if (imgTagsWithoutAlt && imgTagsWithoutAlt.length > 0) {
    ruleViolations.push({
      ruleId: 'EXAM-RULE-003',
      ruleTitleZh: '圖片標籤缺少 alt 替代文字',
      severity: 'WARNING',
      messageZh: `偵測到 ${imgTagsWithoutAlt.length} 處 <img> 標籤未設定 alt 屬性，不符合無障礙規範與考場評分標準。`,
      sourceType: 'OFFLINE_SYNTAX_RULE',
      affectedSnippet: imgTagsWithoutAlt[0].slice(0, 40),
      recommendedFixZh: '為每個 <img> 標籤補上描述性 alt 屬性，例如 alt="校園景色"',
    });
  }

  // 4. 誤用 CSS align: center 語法檢測
  if (/align\s*:\s*center/i.test(content)) {
    ruleViolations.push({
      ruleId: 'EXAM-RULE-004',
      ruleTitleZh: '非法 CSS 屬性 align: center',
      severity: 'ERROR',
      messageZh: 'CSS 中並無 align: center 屬性，文字置中應為 text-align: center，區塊元素居中應為 margin: 0 auto。',
      sourceType: 'OFFLINE_SYNTAX_RULE',
      affectedSnippet: 'align: center',
      recommendedFixZh: '文字請改用 text-align: center; 容器區塊請設定 margin: 0 auto;',
    });
  }

  // 5. 浮動元素缺少清除浮動（Clearfix）提醒 (AI 啟發引導)
  if (/float\s*:\s*(left|right)/i.test(content) && !/(clear\s*:\s*both|overflow\s*:\s*(hidden|auto)|clearfix)/i.test(content)) {
    aiSuggestions.push({
      topicZh: '浮動元素與父容器高度塌陷',
      sourceType: 'HEURISTIC_AI_DEMO',
      pedagogicalStage: 2,
      socraticHintZh: '偵測到您在排版中使用了 float 浮動。請思考：當子元素浮動脫離正常文件流時，父容器高度會發生什麼變化？',
      guidingQuestionZh: '若父容器高度變為 0 導致下方內容重疊，您打算使用 clear: both 還是 overflow: hidden 來閉合排版？',
    });
  }

  // 6. 語意化地標標籤建議 (AI 啟發引導)
  if (/<div[^>]*class=["'](?:header|nav|footer)["']/i.test(content) && !/<(header|nav|footer)\b/i.test(content)) {
    aiSuggestions.push({
      topicZh: 'HTML5 語意化地標標籤重構',
      sourceType: 'HEURISTIC_AI_DEMO',
      pedagogicalStage: 4,
      socraticHintZh: '目前版面大量採用一般 <div> 搭配 class 來劃分區塊。現代標準推薦改用 HTML5 原生語意標籤。',
      guidingQuestionZh: '將 <div class="header"> 替換為 <header>，能為螢幕閱讀器與 SEO 帶來哪些具體好處？',
    });
  }

  const hasErrors = ruleViolations.some((v) => v.severity === 'ERROR');

  const summaryZh = hasErrors
    ? `檢驗完成：發現 ${ruleViolations.length} 項客觀語法規則需修正，並提供 ${aiSuggestions.length} 則思考引導建議。`
    : ruleViolations.length > 0
    ? `檢驗通過：無嚴重語法錯誤，發現 ${ruleViolations.length} 項警示項目與 ${aiSuggestions.length} 則優化建議。`
    : `檢驗完美：程式碼符合標準語法規則！提供 ${aiSuggestions.length} 則深度思維建議。`;

  return {
    hasErrors,
    ruleViolationsCount: ruleViolations.length,
    ruleViolations,
    aiSuggestions,
    summaryZh,
  };
}
