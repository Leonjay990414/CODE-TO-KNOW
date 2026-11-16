/**
 * CODE TO KNOW (碼上學) - 離線啟發式 AI 教學備援引擎
 * 依據 P11 (AI 智慧教學與分析系統) 規格建立：
 * - 支援 HTML (結構)、CSS (樣式)、JavaScript (互動) 三大領域之智慧分類
 * - 實作「觀念聚焦 → 思考破題 → 邊界提點 → 完整解構」四階段鷹架式引導
 * - 提供 100% 離線可用之啟發式提示庫與未知問題誠實提示
 * - 嚴格實施 DEMO / OFFLINE / AI_LIVE 狀態標示，無正式金鑰時禁止標示 AI_LIVE
 * - 保護 AIS-009 (Prompt 版本與系統規範)
 */

export type TechnologyCategory = 'HTML' | 'CSS' | 'JAVASCRIPT' | 'GENERAL';

export type ResponseSource = 'DEMO' | 'OFFLINE' | 'AI_LIVE';

export type ScaffoldingStage = 1 | 2 | 3 | 4;

export interface TechnologyClassification {
  category: TechnologyCategory;
  nameZh: string;
  focusZh: string;
  explanationZh: string;
}

export interface ScaffoldingStageInfo {
  stage: ScaffoldingStage;
  name: string;
  objectiveZh: string;
  antiSpoilerRuleZh: string;
}

export interface CommonErrorPattern {
  id: string;
  pattern: RegExp;
  category: TechnologyCategory;
  titleZh: string;
  stages: {
    [key in ScaffoldingStage]: {
      hintZh: string;
      guidingQuestionZh: string;
      suggestedActionZh: string;
    };
  };
}

export interface FallbackResponse {
  query: string;
  category: TechnologyCategory;
  categoryName: string;
  stage: ScaffoldingStage;
  stageName: string;
  source: ResponseSource;
  isLiveModel: boolean;
  contentZh: string;
  guidingQuestionZh: string;
  nextStepZh: string;
  transparencyNoticeZh: string;
  promptVersion: string;
}

/** AIS-009: Prompt 版本與規格追蹤標記（保護已通過之 100% 基準） */
export const AIS_009_PROMPT_METADATA = {
  uid: 'P11-AIS-009',
  version: 'v1.4.0-socratic-offline',
  framework: 'Socratic Scaffolding 4-Tier Model',
  antiSpoilerEnforced: true,
  lastAudited: '2026-11-16',
};

/** 四階段教學鷹架標準定義 */
export const SCAFFOLDING_STAGES_INFO: Record<ScaffoldingStage, ScaffoldingStageInfo> = {
  1: {
    stage: 1,
    name: '觀念聚焦',
    objectiveZh: '引導學生回想基礎定義、語法結構與核心定理',
    antiSpoilerRuleZh: '嚴禁直接輸出解答程式碼，僅能以提問引導回想基礎規範',
  },
  2: {
    stage: 2,
    name: '思考破題',
    objectiveZh: '梳理演算流程、邏輯分支與屬性配置方向',
    antiSpoilerRuleZh: '提供思考方向與偽代碼邏輯，保留學生親自實作的空間',
  },
  3: {
    stage: 3,
    name: '邊界提點',
    objectiveZh: '指出考場評分標準、相容性地雷與邊界陷阱',
    antiSpoilerRuleZh: '點出考題要求與屬性限制，強化解題嚴謹度',
  },
  4: {
    stage: 4,
    name: '完整解構',
    objectiveZh: '對比語意標準、現代化替代方案與最佳實踐',
    antiSpoilerRuleZh: '總結知識脈絡並給予檢定標準格式示範與下一步學習建議',
  },
};

/** 常見錯誤模式與四階啟發庫 */
const COMMON_ERROR_PATTERNS: CommonErrorPattern[] = [
  {
    id: 'css-margin-center',
    pattern: /(水平置中|置中失效|margin.*auto|靠左|版面置中|外距置中)/i,
    category: 'CSS',
    titleZh: '區塊元素水平置中設定',
    stages: {
      1: {
        hintZh: '在 CSS 盒模型中，要讓區塊元素在視窗中水平居中，必須讓瀏覽器自動均分左右邊界。請先檢查你是否誤用了只對行內文字有效的屬性？',
        guidingQuestionZh: '你目前是使用 text-align 還是 margin 來處理外層容器的對齊？',
        suggestedActionZh: '檢查外層包裹容器是否有設定明確寬度（width）與 margin 屬性。',
      },
      2: {
        hintZh: '若目標是 1024px 的外層主容器，需要透過 margin-left: auto; 與 margin-right: auto; 來達成居中對齊。',
        guidingQuestionZh: '當容器 width 為 1024px 時，簡寫的 margin: 0 auto; 代表上下與左右分別是什麼數值？',
        suggestedActionZh: '在容器 CSS 規則中加入 margin: 0 auto; 並重新預覽。',
      },
      3: {
        hintZh: '【考場邊界提點】：若未指定寬度（預設 width: 100%），margin: auto 無剩餘空間可分配，置中將完全無效；另需注意周圍 float 元素干擾。',
        guidingQuestionZh: '容器是否有設定固定寬度？是否有浮動元素未清除導致外層寬度被擠壓？',
        suggestedActionZh: '確認 width: 1024px 與 margin: 0 auto 兩者同時存在。',
      },
      4: {
        hintZh: '【架構解構】：標準做法為宣告 `.container { width: 1024px; margin: 0 auto; }`。現代排版亦可將 body 設為 flex 搭配 justify-content: center。',
        guidingQuestionZh: '在題組一與題組三中，這種置中模式對整體網頁在不同解析度下的表現有何重要性？',
        suggestedActionZh: '在瀏覽器中縮放視窗測試，確認在 1024px 以上解析度均保持水平置中。',
      },
    },
  },
  {
    id: 'css-float-collapse',
    pattern: /(float|高度塌陷|浮動|父容器.*0|背景不見|clearfix)/i,
    category: 'CSS',
    titleZh: '浮動元素導致父容器高度塌陷',
    stages: {
      1: {
        hintZh: '當子元素被設定 float 之後，它會脫離正常的文件流（Document Flow），父容器在計算高度時無法感知浮動子元素的高度。',
        guidingQuestionZh: '你的選單或欄位是否設定了 float: left 或 float: right，而外層父標籤未定義高度？',
        suggestedActionZh: '使用瀏覽器開發者工具檢查父標籤的 computed height 是否為 0。',
      },
      2: {
        hintZh: '解決思路在於「清除浮動」或「觸發區塊格式化上下文（BFC）」，促使父容器重新計算包含浮動內容的完整高度。',
        guidingQuestionZh: '你知道傳統的 clear: both 與現代 overflow: hidden 分別如何促使高度重新閉合嗎？',
        suggestedActionZh: '嘗試在外層父標籤加上 overflow: hidden; 或在最後加入清除浮動標籤。',
      },
      3: {
        hintZh: '【考場邊界提點】：若父標籤內有子選單需要溢出顯示（如下拉選單），使用 overflow: hidden 會將子選單切除，此時需改用 clearfix 偽元素。',
        guidingQuestionZh: '你的導覽列是否有下拉式選單？若有，overflow: hidden 是否會誤遮擋展開項目？',
        suggestedActionZh: '評估採用 `.clearfix::after { content: ""; display: block; clear: both; }` 解法。',
      },
      4: {
        hintZh: '【架構解構】：在現代網頁設計與 HTML5 規範中，建議全面改用 display: flex; 進行多欄並排，徹底告別 float 塌陷問題。',
        guidingQuestionZh: '若改用 flex 排版，align-items 與 justify-content 能否取代浮動效果？',
        suggestedActionZh: '在練習頁面嘗試將父容器改為 flex 佈局進行對照學習。',
      },
    },
  },
  {
    id: 'html-target-iframe',
    pattern: /(target|iframe|內嵌框架|_blank|_self|開新分頁|另開視窗)/i,
    category: 'HTML',
    titleZh: '超連結 target 與 iframe 內嵌框架導航',
    stages: {
      1: {
        hintZh: '超連結 <a> 標籤的預設 target 是 _self（在目前視窗載入）。若要在右側 iframe 載入，不能使用預設值或 _blank。',
        guidingQuestionZh: '你的超連結是否遺漏了 target 屬性，或者誤寫成 _blank 開啟新分頁？',
        suggestedActionZh: '檢查 <a> 標籤中的 target 屬性值是否與右側 iframe 的 name 屬性一致。',
      },
      2: {
        hintZh: '超連結 target 屬性可以填入任何在同頁面中已命名的 iframe 之 name 屬性值（英文字母大小寫必須完全相符）。',
        guidingQuestionZh: '你的 iframe 標籤是否設定了 name="main" 屬性？超連結的 target 是否也對應為 "main"？',
        suggestedActionZh: '確認 `<iframe name="main">` 與 `<a target="main">` 兩者名稱完全吻合。',
      },
      3: {
        hintZh: '【考場評分地雷】：在丙級檢定中，若選單點擊後跳出新分頁而非在主內容框呈現，屬於嚴重功能缺失直接扣分。',
        guidingQuestionZh: '在點擊吉他社、各分頁連結時，畫面是否保持在原本頁面而只有主框內容改變？',
        suggestedActionZh: '逐一檢查所有子選單超連結，確保 target 均指向正確的框架名稱。',
      },
      4: {
        hintZh: '【架構解構】：標準寫法為 `<a href="club.html" target="main">社團介紹</a>` 搭配 `<iframe name="main" src="home.html"></iframe>`。',
        guidingQuestionZh: '除了 iframe 以外，單頁應用（SPA）在現代網頁開發中通常如何取代傳統框架切換？',
        suggestedActionZh: '整理一份題組所有子頁面檔名與框架名稱對照清單供自我複查。',
      },
    },
  },
  {
    id: 'js-event-click',
    pattern: /(javascript|js|onclick|addeventlistener|點擊沒反應|函式未定義|腳本)/i,
    category: 'JAVASCRIPT',
    titleZh: 'JavaScript 點擊事件與 DOM 元素監聽',
    stages: {
      1: {
        hintZh: '當按鈕點擊沒有反應時，最常見的原因是 DOM 元素尚未載入完成時腳本就已執行，或者事件監聽函式名稱拼寫有誤。',
        guidingQuestionZh: '你的 `<script>` 標籤是放在 `<head>` 還是放在 `</body>` 之前？',
        suggestedActionZh: '按下 F12 開啟瀏覽器 Console，檢查是否有 Uncaught ReferenceError 或 TypeError 報錯。',
      },
      2: {
        hintZh: '若在 DOM 結構建立前就嘗試透過 document.getElementById 獲取元素，回傳值會是 null，導致呼叫 addEventListener 時報錯。',
        guidingQuestionZh: '你是否將 script 移至 body 結尾，或是使用 window.onload / DOMContentLoaded 包裹初始化邏輯？',
        suggestedActionZh: '確保 JavaScript 在 HTML 元素渲染完畢後才執行綁定。',
      },
      3: {
        hintZh: '【考場邊界提點】：題組要求簡單的動態效果（如跑馬燈、圖片輪播）。請避免使用過度複雜的第三方函式庫，使用純原生 JavaScript（Vanilla JS）最安全穩定。',
        guidingQuestionZh: '程式碼是否依賴了未經核可的外部 CDN 資源？考場環境通常處於無外網隔離狀態。',
        suggestedActionZh: '將所有 JavaScript 邏輯改寫為原生語法並儲存於本機 js 資料夾。',
      },
      4: {
        hintZh: '【架構解構】：原生標準監聽寫法：`document.addEventListener("DOMContentLoaded", () => { document.getElementById("btn")?.addEventListener("click", handleClick); });`。',
        guidingQuestionZh: '現代前端開發中，事件委託（Event Delegation）相較於個別按鈕綁定有何優勢？',
        suggestedActionZh: '建立一套通用的事件處理函式並測試各操作狀態的 Console 回饋。',
      },
    },
  },
];

/**
 * 依據使用者問題字串判斷所屬技術領域
 */
export function classifyTechnology(query: string): TechnologyClassification {
  const q = query.toLowerCase();

  const isHtml = /(html|標籤|tag|div|span|h1|table|tr|td|iframe|target|form|input|alt|img|語意)/i.test(q);
  const isCss = /(css|樣式|排版|margin|padding|border|float|flex|grid|置中|顏色|color|寬度|width|高度|height|display|background)/i.test(q);
  const isJs = /(js|javascript|script|函式|function|點擊|click|監聽|event|dom|變數|var|let|const|迴圈|陣列)/i.test(q);

  if (isHtml && !isCss && !isJs) {
    return {
      category: 'HTML',
      nameZh: 'HTML 網頁結構',
      focusZh: '標籤語意、文件結構、超連結與多媒體配置',
      explanationZh: '本問題屬於 HTML 結構層，關注標籤之語意性、屬性設定與 DOM 階層關係。',
    };
  }

  if (isCss) {
    return {
      category: 'CSS',
      nameZh: 'CSS 視覺樣式',
      focusZh: '盒模型、定位排版、自適應佈局與色彩風格',
      explanationZh: '本問題屬於 CSS 表現層，關注元素之尺寸外距、浮動清除與視覺排版規則。',
    };
  }

  if (isJs) {
    return {
      category: 'JAVASCRIPT',
      nameZh: 'JavaScript 互動行為',
      focusZh: 'DOM 事件監聽、使用者互動、邏輯運算與狀態控制',
      explanationZh: '本問題屬於 JavaScript 行為層，關注動態事件觸發、腳本執行時序與邏輯判斷。',
    };
  }

  return {
    category: 'GENERAL',
    nameZh: '網頁技術通識與檢定規範',
    focusZh: '丙級技術士考場規範、檔案路徑管理與網頁整合標準',
    explanationZh: '本問題屬於綜合性技術概念或考場規範，建議依循檢定評分要點逐步排查。',
  };
}

/**
 * 驗證並校正 AI 回應來源標籤（防範虛構 AI LIVE 狀態）
 */
export function validateAiSourceStatus(requestedSource: ResponseSource, hasActiveLlmKey: boolean): ResponseSource {
  if (requestedSource === 'AI_LIVE' && !hasActiveLlmKey) {
    return 'OFFLINE';
  }
  return requestedSource;
}

/**
 * 核心離線備援提示產生器
 */
export function generateFallbackResponse(
  query: string,
  stage: ScaffoldingStage = 1,
  options?: { isDemoScenario?: boolean; hasActiveLlmKey?: boolean }
): FallbackResponse {
  const classification = classifyTechnology(query);
  const stageInfo = SCAFFOLDING_STAGES_INFO[stage];

  // 決定來源標籤：無金鑰時絕對不回傳 AI_LIVE
  const rawSource: ResponseSource = options?.isDemoScenario ? 'DEMO' : 'OFFLINE';
  const source = validateAiSourceStatus(rawSource, !!options?.hasActiveLlmKey);

  // 嘗試比對內建常見錯誤知識庫
  const matched = COMMON_ERROR_PATTERNS.find((item) => item.pattern.test(query));

  if (matched) {
    const stageData = matched.stages[stage];
    return {
      query,
      category: matched.category,
      categoryName: classification.nameZh,
      stage,
      stageName: stageInfo.name,
      source,
      isLiveModel: source === 'AI_LIVE',
      contentZh: stageData.hintZh,
      guidingQuestionZh: stageData.guidingQuestionZh,
      nextStepZh: stageData.suggestedActionZh,
      transparencyNoticeZh:
        source === 'DEMO'
          ? '〔展示模式〕此為系統預載之標準考場情境示範導引。'
          : '〔本機離線備援〕目前未連接外部雲端 LLM API，系統由本地啟發式知識庫提供無干擾引導。',
      promptVersion: AIS_009_PROMPT_METADATA.version,
    };
  }

  // 若無精確模式命中，提供誠實且結構化之四階啟發指引（不胡言亂語或偽造答案）
  const honestHints: Record<ScaffoldingStage, { content: string; q: string; next: string }> = {
    1: {
      content: `【觀念聚焦引導】：針對問題「${query}」，這涉及到 ${classification.nameZh} 的基本規格。在动手編碼前，請先回想官方標準中對該語法或屬性的最初設計目的為何？`,
      q: `你目前遇到的現象，是否能拆解為「輸入標籤」、「樣式宣告」或「腳本時序」三個維度中的哪一環？`,
      next: '先開啟瀏覽器 F12 開發者工具檢視 Console 錯誤或 Element 樣式面板。',
    },
    2: {
      content: `【思考破題引導】：思考問題成因，通常源於語法拼寫錯誤、路徑不正確、父子標籤未閉合，或 CSS 優先權（Specificity）被其他規則覆蓋。`,
      q: '你是否有檢查是否有中文字元干擾、分號缺失，或是標籤未成對閉合？',
      next: '逐行檢查代碼縮排與關鍵字拼寫，排除最基礎的語法疏失。',
    },
    3: {
      content: `【邊界提點引導】：檢定考場以 Chrome / Edge 與標準 W3C 規範為評分依據。請特別留意相對路徑（如 images/photo.jpg 與 ./images/photo.jpg）在不同層級目錄的有效性。`,
      q: '你的檔案結構層級是否清晰？所有素材路徑是否均使用相對路徑？',
      next: '在無快取狀態下重新整理頁面，驗證資源載入狀態是否為 200 OK。',
    },
    4: {
      content: `【完整解構引導】：解決此類問題的標準作業流程：先確認 HTML 結構正確無誤 → 接著撰寫並調試 CSS 外觀樣式 → 最後加入 JavaScript 互動並於 Console 確認無報錯。`,
      q: '你能否將目前修改成果與勞動部技能檢定中心公布之評分參考表逐條核對？',
      next: '若仍有疑問，建議點選上方考場常見盲點題組，參考標準對照解法。',
    },
  };

  const genericData = honestHints[stage];

  return {
    query,
    category: classification.category,
    categoryName: classification.nameZh,
    stage,
    stageName: stageInfo.name,
    source,
    isLiveModel: false,
    contentZh: genericData.content,
    guidingQuestionZh: genericData.q,
    nextStepZh: genericData.next,
    transparencyNoticeZh:
      '〔本機離線備援〕未匹配到特定特定考題模式，已切換至通用啟發引導模式，無外部網路依賴。',
    promptVersion: AIS_009_PROMPT_METADATA.version,
  };
}
