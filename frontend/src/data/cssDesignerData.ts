/**
 * CODE TO KNOW — CSS Designer Game Level Data & Validation Rules
 * Phase 14: Interactive Gaming and Gamified Learning System (P14-GAM-005, P14-GAM-009)
 *
 * Provides structured educational levels and semantic validation for CSS Designer:
 * 1. CSS 基礎顏色與背景 (Color & Background-color & Border-radius)
 * 2. Box Model (Width, Padding, Margin, Border)
 * 3. Flexbox 排版 (Display, Justify-content, Align-items, Gap)
 * 4. 進階卡片排版 (Max-width, Box-shadow, Border-radius, Padding, Flex Column)
 */

export interface CSSControlDef {
  property: string;
  label: string;
  type: 'select' | 'slider' | 'color' | 'text';
  defaultValue: any;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

export interface CSSDesignerLevel {
  levelId: number;
  title: string;
  category: '基礎樣式' | '盒模型' | 'Flexbox 排版' | '複合卡片';
  difficulty: '入門' | '基礎' | '進階';
  estimatedMinutes: number;
  description: string;
  instructions: string;
  targetDescription: string;
  targetStyles: Record<string, any>;
  controls: CSSControlDef[];
  hints: string[];
  explanation: {
    overview: string;
    propertiesUsed: { prop: string; desc: string }[];
    alternatives: string;
    commonMistakes: string;
  };
}

export const CSS_DESIGNER_LEVELS: CSSDesignerLevel[] = [
  {
    levelId: 1,
    title: 'CSS 基礎顏色、背景與圓角',
    category: '基礎樣式',
    difficulty: '入門',
    estimatedMinutes: 3,
    description: '掌握前景文字色彩、背景填色與邊框圓角之基本宣告，建立具備良好色彩對比度的行動按鈕。',
    instructions: '請調整下方 CSS 屬性，使右側即時預覽的按鈕達到「深藍背景 (#2563EB)」、「白字 (#FFFFFF)」並具備「平滑圓角 (8px)」的目標效果。',
    targetDescription: '目標按鈕：深藍色背景、高對比白字、8px 平滑邊角。',
    targetStyles: {
      color: '#FFFFFF',
      backgroundColor: '#2563EB',
      borderRadius: '8px',
    },
    controls: [
      {
        property: 'color',
        label: '文字顏色 (color)',
        type: 'select',
        defaultValue: '#1E293B',
        options: [
          { label: '深藍黑 (#1E293B)', value: '#1E293B' },
          { label: '純白高對比 (#FFFFFF)', value: '#FFFFFF' },
          { label: '淺灰 (#94A3B8)', value: '#94A3B8' },
          { label: '警示紅 (#EF4444)', value: '#EF4444' },
        ],
        description: '設定元素內文字與圖示的前景顏色。',
      },
      {
        property: 'backgroundColor',
        label: '背景顏色 (background-color)',
        type: 'select',
        defaultValue: '#F1F5F9',
        options: [
          { label: '淺白灰 (#F1F5F9)', value: '#F1F5F9' },
          { label: '品牌深藍 (#2563EB)', value: '#2563EB' },
          { label: '翠綠 (#10B981)', value: '#10B981' },
          { label: '象牙暖白 (#F5F2EA)', value: '#F5F2EA' },
        ],
        description: '設定容器區域的填滿背景色彩。',
      },
      {
        property: 'borderRadius',
        label: '邊框圓角 (border-radius)',
        type: 'slider',
        defaultValue: 0,
        min: 0,
        max: 30,
        step: 1,
        unit: 'px',
        description: '控制元素四個邊角的弧度半徑（目標約 8px）。',
      },
    ],
    hints: [
      '【概念方向】：好的按鈕必須具備明確的視覺重量與足夠的 WCAG 對比度，避免字體融入背景。',
      '【屬性提示】：使用 color 設定白字，background-color 設定藍色主色調。',
      '【具體操作】：將文字顏色切換為「純白高對比 (#FFFFFF)」，背景顏色選擇「品牌深藍 (#2563EB)」，並將圓角滑桿調至 8px。',
    ],
    explanation: {
      overview: '按鈕是網頁互動頻率最高的核心元件。深藍底配純白字能提供超過 4.5:1 的優異對比度，符合 WCAG AA 無障礙規範。適度的 8px 圓角能降低介面的尖銳感，呈現現代親和感。',
      propertiesUsed: [
        { prop: 'color', desc: '控制文字顏色，接受十六進制 (#FFF)、RGB 或顏色名稱。' },
        { prop: 'background-color', desc: '控制背景顏色，不影響子元素文字色。' },
        { prop: 'border-radius', desc: '控制外框平滑弧度，可傳入單一數值或 4 個角落獨立值。' },
      ],
      alternatives: '亦可使用縮寫或相對單位，例如 `border-radius: 0.5rem` 或以 CSS 自定義屬性（CSS Variables）指派顏色。',
      commonMistakes: '常有初學者誤用 `background` 覆蓋掉後續設定，或將淺色背景配白字造成文字隱形。',
    },
  },
  {
    levelId: 2,
    title: 'CSS 盒模型 (Box Model: Width, Padding, Margin, Border)',
    category: '盒模型',
    difficulty: '基礎',
    estimatedMinutes: 4,
    description: '理解盒模型四層結構（Content, Padding, Border, Margin），掌握內容與邊框之呼吸留白。',
    instructions: '請調整下方屬性，將提示卡片設為「寬度 280px」、「內距 16px」、「外距 20px」與「2px 香檳金外框」。',
    targetDescription: '目標提示框：寬度 280px、內部四周留白 16px、邊框 2px 實線香檳金 (#BDA77E)、外部邊距 20px。',
    targetStyles: {
      width: '280px',
      padding: '16px',
      margin: '20px',
      borderWidth: '2px',
      borderColor: '#BDA77E',
    },
    controls: [
      {
        property: 'width',
        label: '寬度 (width)',
        type: 'slider',
        defaultValue: 200,
        min: 180,
        max: 360,
        step: 10,
        unit: 'px',
        description: '設定盒模型內容區塊寬度（目標 280px）。',
      },
      {
        property: 'padding',
        label: '內距 (padding)',
        type: 'slider',
        defaultValue: 4,
        min: 0,
        max: 32,
        step: 2,
        unit: 'px',
        description: '內容文字與外框之間的內部留白空間（目標 16px）。',
      },
      {
        property: 'margin',
        label: '外距 (margin)',
        type: 'slider',
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 4,
        unit: 'px',
        description: '外框與相鄰元素之間的外部間距（目標 20px）。',
      },
      {
        property: 'borderWidth',
        label: '邊框粗細 (border-width)',
        type: 'slider',
        defaultValue: 0,
        min: 0,
        max: 6,
        step: 1,
        unit: 'px',
        description: '邊框實線粗細（目標 2px）。',
      },
      {
        property: 'borderColor',
        label: '邊框顏色 (border-color)',
        type: 'select',
        defaultValue: '#E2E8F0',
        options: [
          { label: '淺灰框 (#E2E8F0)', value: '#E2E8F0' },
          { label: '品牌香檳金 (#BDA77E)', value: '#BDA77E' },
          { label: '霧藍灰 (#8FA9B8)', value: '#8FA9B8' },
        ],
        description: '邊框實線的配色。',
      },
    ],
    hints: [
      '【概念方向】：盒模型由內至外為 Content -> Padding -> Border -> Margin。',
      '【屬性提示】：內部留白請調整 padding；外部間隔請調整 margin。',
      '【具體操作】：寬度調至 280px，padding 調整至 16px，margin 設為 20px，邊框粗細 2px 並選擇香檳金。',
    ],
    explanation: {
      overview: '盒模型是網頁版面配置最容易混淆的基礎。Padding 負責讓文字呼吸，不致緊貼框線；Margin 負責推開鄰近元件。現代排版大多搭配 `box-sizing: border-box`，使 padding 與 border 計入總寬度中。',
      propertiesUsed: [
        { prop: 'width', desc: '設定元素寬度。' },
        { prop: 'padding', desc: '元素內部留白空間。' },
        { prop: 'margin', desc: '元素與外部鄰近物件之間隙。' },
        { prop: 'border', desc: '包圍在 padding 外側的裝飾框線。' },
      ],
      alternatives: '可以使用簡寫語法，如 `border: 2px solid #BDA77E`，或 `padding: 1rem`。',
      commonMistakes: '常有開發者搞混 padding 與 margin，將外距當成內距，導致背景色無法包覆預期範圍。',
    },
  },
  {
    levelId: 3,
    title: 'CSS Flexbox 彈性軸線與項目間距',
    category: 'Flexbox 排版',
    difficulty: '基礎',
    estimatedMinutes: 5,
    description: '利用 Flexbox 解決傳統浮動排版難題，達成主軸置中對齊、交叉軸對齊與均勻間隔 (gap)。',
    instructions: '請調整屬性，將 3 個技能標籤設定為「彈性容器 (display: flex)」、「主軸置中 (justify-content: center)」、「垂直置中 (align-items: center)」與「項目間隔 (gap: 16px)」。',
    targetDescription: '目標徽章列：水平並列置中、垂直置中、標籤間距 16px。',
    targetStyles: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '16px',
    },
    controls: [
      {
        property: 'display',
        label: '佈局模式 (display)',
        type: 'select',
        defaultValue: 'block',
        options: [
          { label: '標準塊級 (block)', value: 'block' },
          { label: '彈性盒模型 (flex)', value: 'flex' },
          { label: '行內塊級 (inline-block)', value: 'inline-block' },
        ],
        description: '將容器轉為彈性排版容器。',
      },
      {
        property: 'justifyContent',
        label: '主軸對齊 (justify-content)',
        type: 'select',
        defaultValue: 'flex-start',
        options: [
          { label: '靠左對齊 (flex-start)', value: 'flex-start' },
          { label: '水平置中 (center)', value: 'center' },
          { label: '靠右對齊 (flex-end)', value: 'flex-end' },
          { label: '兩端貼齊均分 (space-between)', value: 'space-between' },
        ],
        description: '決定子元件在主軸（預設水平方向）上的分佈方式。',
      },
      {
        property: 'alignItems',
        label: '交叉軸對齊 (align-items)',
        type: 'select',
        defaultValue: 'stretch',
        options: [
          { label: '靠頂部對齊 (flex-start)', value: 'flex-start' },
          { label: '垂直置中 (center)', value: 'center' },
          { label: '靠底部對齊 (flex-end)', value: 'flex-end' },
          { label: '撐滿高度 (stretch)', value: 'stretch' },
        ],
        description: '決定子元件在交叉軸（垂直方向）上的對齊基準。',
      },
      {
        property: 'gap',
        label: '元素間距 (gap)',
        type: 'slider',
        defaultValue: 0,
        min: 0,
        max: 32,
        step: 4,
        unit: 'px',
        description: '相鄰彈性項目之間的專屬間距（目標 16px）。',
      },
    ],
    hints: [
      '【概念方向】：要讓項目水平並列且支援現代對齊屬性，首要關鍵是啟用 flex 容器。',
      '【屬性提示】：主軸置中是 justify-content，交叉軸置中是 align-items。',
      '【具體操作】：將 display 切換為 flex，justify-content 與 align-items 皆切換為 center，gap 調至 16px。',
    ],
    explanation: {
      overview: 'Flexbox 是現代前端排版的最核心工具。一旦宣告 `display: flex`，子項目即成為彈性項目。透過 `justify-content` 主導水平、`align-items` 主導垂直，再搭配 `gap` 取代過往複雜的 `margin-right: -10px` 與 `:last-child` 技巧。',
      propertiesUsed: [
        { prop: 'display: flex', desc: '啟動彈性盒模型容器。' },
        { prop: 'justify-content', desc: '主軸（Main Axis）對齊規則。' },
        { prop: 'align-items', desc: '交叉軸（Cross Axis）對齊規則。' },
        { prop: 'gap', desc: '彈性子項目之間的間距，不需額外清除頭尾外距。' },
      ],
      alternatives: '亦可使用 CSS Grid `display: grid; place-items: center; gap: 16px` 達成類似置中排列。',
      commonMistakes: '忘記先設定 `display: flex` 就直接加上 `justify-content`，導致排版完全不起作用。',
    },
  },
  {
    levelId: 4,
    title: '現代產品卡片排版 (Card Layout: Max-width, Shadow, Flex-col)',
    category: '複合卡片',
    difficulty: '進階',
    estimatedMinutes: 6,
    description: '結合最大寬度限制、柔和立體陰影、圓角與垂直彈性流向，打造現代教育產品卡片。',
    instructions: '請調整屬性：限制卡片「最大寬度 320px」、「垂直排列 (column)」、「內距 24px」、「圓角 12px」、「柔和陰影」與「項目間隔 12px」。',
    targetDescription: '目標產品卡片：最大寬度 320px、垂直單欄彈性排列、24px 內距、12px 圓角、精緻立體投影與 12px 元件間隔。',
    targetStyles: {
      maxWidth: '320px',
      flexDirection: 'column',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
      gap: '12px',
    },
    controls: [
      {
        property: 'maxWidth',
        label: '最大寬度 (max-width)',
        type: 'slider',
        defaultValue: 220,
        min: 200,
        max: 420,
        step: 20,
        unit: 'px',
        description: '限制卡片不隨螢幕無限拉長（目標 320px）。',
      },
      {
        property: 'flexDirection',
        label: '排列方向 (flex-direction)',
        type: 'select',
        defaultValue: 'row',
        options: [
          { label: '水平橫向 (row)', value: 'row' },
          { label: '垂直縱向 (column)', value: 'column' },
        ],
        description: '決定卡片內部各區塊是水平橫置還是由上而下堆疊。',
      },
      {
        property: 'padding',
        label: '內距留白 (padding)',
        type: 'slider',
        defaultValue: 8,
        min: 4,
        max: 36,
        step: 4,
        unit: 'px',
        description: '卡片邊緣至內部文字按鈕的舒適距離（目標 24px）。',
      },
      {
        property: 'borderRadius',
        label: '卡片圓角 (border-radius)',
        type: 'slider',
        defaultValue: 0,
        min: 0,
        max: 24,
        step: 2,
        unit: 'px',
        description: '卡片外部四個邊角半徑（目標 12px）。',
      },
      {
        property: 'boxShadow',
        label: '立體投影 (box-shadow)',
        type: 'select',
        defaultValue: 'none',
        options: [
          { label: '無陰影 (none)', value: 'none' },
          { label: '輕柔浮起 (0 4px 14px rgba(0,0,0,0.1))', value: '0 4px 14px rgba(0, 0, 0, 0.1)' },
          { label: '深邃高投影 (0 12px 28px rgba(0,0,0,0.25))', value: '0 12px 28px rgba(0, 0, 0, 0.25)' },
        ],
        description: '產生卡片浮起於底層之視覺層次感。',
      },
      {
        property: 'gap',
        label: '元件間隔 (gap)',
        type: 'slider',
        defaultValue: 4,
        min: 0,
        max: 24,
        step: 2,
        unit: 'px',
        description: '卡片內部標題、標籤、內文與按鈕間隔（目標 12px）。',
      },
    ],
    hints: [
      '【概念方向】：產品卡片應呈現由上而下之視覺動線，不可採用 row 水平擠壓內容。',
      '【屬性提示】：使用 flex-direction: column 堆疊，並用 max-width 防止過寬。',
      '【具體操作】：max-width 設為 320px，flex-direction 設為 column，padding 設為 24px，圓角設為 12px，陰影選「輕柔浮起」，gap 設為 12px。',
    ],
    explanation: {
      overview: '卡片元件是現代 Web 產品（如課程清單、商品展示）的基本單元。結合 `max-width` 提供良好的響應式適配，`flex-direction: column` 保持資訊階層自然向下延伸，搭配 `box-shadow` 與 `border-radius` 提供優雅的現代質感。',
      propertiesUsed: [
        { prop: 'max-width', desc: '限制寬度上限，避免在大螢幕破壞排版平衡。' },
        { prop: 'flex-direction: column', desc: '將主軸方向轉向垂直，子元件依序由上而下排列。' },
        { prop: 'box-shadow', desc: 'X/Y位移、模糊半徑、擴散與顏色所構成的柔和陰影。' },
        { prop: 'border-radius', desc: '卡片外框圓弧修飾。' },
      ],
      alternatives: '亦可使用 border 取代 shadow（平面風 Flat Design），或搭配 `:hover` 偽類在滑鼠懸停時微調 translateY 與陰影強度。',
      commonMistakes: '陰影顏色設太黑（如純黑不透明 `black`）顯得沉重骯髒；應採用具透明度的 RGBA 顏色。',
    },
  },
];

/**
 * Semantic validation of user-submitted CSS values
 * Supports semantic equivalence (numeric range tolerance, color format parity)
 */
export function validateCSSDesignerLevel(
  levelId: number,
  values: Record<string, any>
): { isCorrect: boolean; feedback: string } {
  switch (levelId) {
    case 1: {
      // Level 1: color, backgroundColor, borderRadius
      const color = String(values.color || '').toUpperCase();
      const isWhiteColor = color === '#FFFFFF' || color === '#FFF' || color === 'WHITE' || color === 'RGB(255, 255, 255)';
      if (!isWhiteColor) {
        return { isCorrect: false, feedback: '文字顏色尚未符合高對比度目標（需為純白 #FFFFFF）。' };
      }

      const bg = String(values.backgroundColor || '').toUpperCase();
      const isBlueBg = bg === '#2563EB' || bg === 'RGB(37, 99, 235)';
      if (!isBlueBg) {
        return { isCorrect: false, feedback: '背景顏色尚未符合品牌深藍目標 (#2563EB)。' };
      }

      const radius = Number(values.borderRadius);
      // Tolerance: 6px to 10px acceptable for target 8px
      if (isNaN(radius) || radius < 6 || radius > 10) {
        return { isCorrect: false, feedback: `圓角設定為 ${radius}px，目標為約 8px 的平滑圓角。` };
      }

      return { isCorrect: true, feedback: '完美！色彩對比度與圓角半徑完全符合目標規格！' };
    }

    case 2: {
      // Level 2: width (280px), padding (16px), margin (20px), borderWidth (2px), borderColor (#BDA77E)
      const width = Number(values.width);
      if (isNaN(width) || width < 260 || width > 300) {
        return { isCorrect: false, feedback: `容器寬度為 ${width}px，目標約 280px。` };
      }

      const padding = Number(values.padding);
      if (isNaN(padding) || padding < 14 || padding > 18) {
        return { isCorrect: false, feedback: `內部留白 (padding) 為 ${padding}px，目標為 16px。` };
      }

      const margin = Number(values.margin);
      if (isNaN(margin) || margin < 16 || margin > 24) {
        return { isCorrect: false, feedback: `外部邊距 (margin) 為 ${margin}px，目標為 20px。` };
      }

      const borderWidth = Number(values.borderWidth);
      if (isNaN(borderWidth) || borderWidth < 1 || borderWidth > 3) {
        return { isCorrect: false, feedback: `邊框粗細為 ${borderWidth}px，目標為 2px 實線。` };
      }

      const borderColor = String(values.borderColor || '').toUpperCase();
      if (borderColor !== '#BDA77E') {
        return { isCorrect: false, feedback: '邊框顏色尚未選用專案香檳金 (#BDA77E)。' };
      }

      return { isCorrect: true, feedback: '太棒了！盒模型四層尺寸（Content, Padding, Border, Margin）配置精準！' };
    }

    case 3: {
      // Level 3: display (flex), justifyContent (center), alignItems (center), gap (16px)
      if (values.display !== 'flex') {
        return { isCorrect: false, feedback: '佈局模式尚未啟用「彈性盒模型 (display: flex)」。' };
      }

      if (values.justifyContent !== 'center') {
        return { isCorrect: false, feedback: '主軸尚未水平置中（需設為 justify-content: center）。' };
      }

      if (values.alignItems !== 'center') {
        return { isCorrect: false, feedback: '交叉軸尚未垂直置中（需設為 align-items: center）。' };
      }

      const gap = Number(values.gap);
      if (isNaN(gap) || gap < 12 || gap > 20) {
        return { isCorrect: false, feedback: `項目間距為 ${gap}px，目標為 16px。` };
      }

      return { isCorrect: true, feedback: '恭喜！Flexbox 主軸與交叉軸雙向置中宣告完全正確！' };
    }

    case 4: {
      // Level 4: maxWidth (320px), flexDirection (column), padding (24px), borderRadius (12px), boxShadow (soft), gap (12px)
      const maxWidth = Number(values.maxWidth);
      if (isNaN(maxWidth) || maxWidth < 300 || maxWidth > 340) {
        return { isCorrect: false, feedback: `卡片最大寬度為 ${maxWidth}px，目標約 320px。` };
      }

      if (values.flexDirection !== 'column') {
        return { isCorrect: false, feedback: '卡片內部排版應為垂直單欄堆疊（flex-direction: column）。' };
      }

      const padding = Number(values.padding);
      if (isNaN(padding) || padding < 20 || padding > 28) {
        return { isCorrect: false, feedback: `卡片內距為 ${padding}px，目標為 24px。` };
      }

      const borderRadius = Number(values.borderRadius);
      if (isNaN(borderRadius) || borderRadius < 10 || borderRadius > 14) {
        return { isCorrect: false, feedback: `卡片圓角為 ${borderRadius}px，目標為 12px。` };
      }

      const shadow = String(values.boxShadow || '');
      if (shadow === 'none' || !shadow.includes('rgba')) {
        return { isCorrect: false, feedback: '請選擇具備柔和立體感的「輕柔浮起」陰影效果。' };
      }

      const gap = Number(values.gap);
      if (isNaN(gap) || gap < 10 || gap > 16) {
        return { isCorrect: false, feedback: `卡片元件間隔為 ${gap}px，目標為 12px。` };
      }

      return { isCorrect: true, feedback: '出色！現代複合卡片的所有樣式指標完全達標！' };
    }

    default:
      return { isCorrect: false, feedback: '未知關卡。' };
  }
}
