/**
 * CODE TO KNOW 碼上學｜五大遊戲新手說明與計分規格字典
 * 對應原始 UID：P14-GAM-003（每款遊戲開始前顯示玩法、操作方式、計分規則、時間及注意事項）
 */

import { GameBriefingConfig } from '../components/GameBriefingModal';

export const GAME_BRIEFING_CONFIGS: Record<string, GameBriefingConfig> = {
  'code-puzzle': {
    gameId: 'code-puzzle',
    gameTitle: 'Code Puzzle',
    gameSubtitle: '程式邏輯語意拼圖',
    objective: '將被隨機打散的 HTML5 語意標籤與 CSS 屬性程式碼片段重新排列，組成標準完整的程式流程。',
    controlsGuide: '點擊程式碼積木上的「▲ 上移」或「▼ 下移」按鈕調動順序，排列完成後點擊「驗證答案」。',
    levelsCount: 4,
    timerDescription: '正向計時（越快通關，時間獎勵分越高）',
    scoringFormula: '基礎分 300 + 時間獎勵 (100 - 秒數) - 提示扣分 (50/次)',
    starRules: [
      '不使用提示 且 60 秒內完成',
      '使用 1 次提示 或 120 秒內完成',
      '使用 2 次以上提示通關',
    ],
    hintNotice: '每關提供兩段循序漸進的思考方向提示，善用提示不影響基礎通關判定，僅微調星級。',
    pedagogicalGoal: '鍛鍊階層思維、閉合標籤順序感與網頁骨架直覺。',
  },
  'css-designer': {
    gameId: 'css-designer',
    gameTitle: 'CSS Designer',
    gameSubtitle: '樣式排版視覺化設計師',
    objective: '調整 CSS 屬性控制面板，讓即時預覽畫面與目標設計稿達到完全吻合。',
    controlsGuide: '滑動滑桿或點擊選項調整 Flexbox 方向、對齊方式、margin/padding 數值與色彩。',
    levelsCount: 4,
    timerDescription: '無時間限制，著重視覺對齊精度與盒模型觀念',
    scoringFormula: '基礎分 300 + 精度加成 (100 - 差異) + 時間獎勵',
    starRules: [
      '相符度達 95% 以上',
      '相符度達 80% ~ 94%',
      '相符度達 60% ~ 79%',
    ],
    hintNotice: '點擊提示可獲得關鍵屬性名稱與數值區間提醒。',
    pedagogicalGoal: '直覺理解 CSS 盒模型（Box Model）與 Flexbox 版面排列運算原理。',
  },
  'bug-hunter': {
    gameId: 'bug-hunter',
    gameTitle: 'Bug Hunter',
    gameSubtitle: '程式除錯獵人',
    objective: '在模擬考場常見的錯誤程式碼中，一眼識破標籤未閉合、非法屬性與語法漏洞並完成修復。',
    controlsGuide: '從錯誤清單中勾選可疑代碼行，或點擊正確修正選項代碼進行替換。',
    levelsCount: 4,
    timerDescription: '正向計時，考驗除錯敏銳度',
    scoringFormula: '基礎分 300 + 速度加成 (120 - 秒數) - 提示扣分 (50/次)',
    starRules: [
      '不使用提示 且 90 秒內全數抓出漏洞',
      '使用 1 次提示完成除錯',
      '使用 2 次以上提示完成除錯',
    ],
    hintNotice: '提示會縮小錯誤所在行數範圍，但不會直接給出修改代碼。',
    pedagogicalGoal: '訓練代碼審查（Code Review）視野，預防證照檢定失分陷阱。',
  },
  'quiz-rush': {
    gameId: 'quiz-rush',
    gameTitle: 'Quiz Rush',
    gameSubtitle: '證照疾速快答',
    objective: '在倒數壓力下連續正確回答勞動部網頁設計丙級官方 605 題真實學科考題。',
    controlsGuide: '閱讀題目後，於時限內直接點選 A、B、C、D 四大選項按鈕。',
    levelsCount: '3 種模式（每回合 10 題）',
    timerDescription: '限時快答（15秒/題） / 連擊挑戰（20秒/題） / 分類精熟（無倒數）',
    scoringFormula: '每題 100 分 + 剩餘秒數獎勵 (秒×10) + Combo連擊加成 (連擊數×20)',
    starRules: [
      '回合答對率達 90% 以上（9-10 題正確）',
      '回合答對率達 70% ~ 89%（7-8 題正確）',
      '回合答對率達 50% ~ 69%（5-6 題正確）',
    ],
    hintNotice: '「分類精熟模式」每題作答後即時展開深度官方題解，錯題自動收錄至錯題本。',
    pedagogicalGoal: '透過遊戲化高壓刺激強化記憶提取，無縫整合錯題複習專區。',
  },
  'web-builder': {
    gameId: 'web-builder',
    gameTitle: 'Web Builder',
    gameSubtitle: '網頁架構拼裝工坊',
    objective: '將現代網頁宣告、W3C 語意地標與圖文元件積木由上而下組合成高可用性網頁。',
    controlsGuide: '由下方元件庫點選加入積木，使用「▲」「▼」調動順序，點擊「驗證網頁架構」。',
    levelsCount: 4,
    timerDescription: '正向計時，鼓勵深思熟慮',
    scoringFormula: '基礎分 300 + 時間加成 (100 - 秒數) - 提示扣分 (40/次)',
    starRules: [
      '不使用提示 且 120 秒內完成',
      '使用 1 次提示 或 240 秒內完成',
      '使用 2 次以上提示完成',
    ],
    hintNotice: '提示將指出當前結構中位置顛倒的標籤與正確的父子包覆關係。',
    pedagogicalGoal: '建立語意化 HTML5 與無障礙 Web 地標（Landmarks）的結構思維。',
  },
};
