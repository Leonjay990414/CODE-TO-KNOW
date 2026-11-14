/**
 * CODE TO KNOW 碼上學｜成就與徽章系統定義
 * 對應原始 UID：P14-GAM-011（每日任務、連續學習、成就及可解鎖元件）
 */

import { UserGameRecord, GameId } from '../utils/gameStorage';

export type AchievementCategory = 'exploration' | 'mastery' | 'dedication' | 'milestone';

export interface AchievementEvaluationContext {
  userId: string;
  records: Record<GameId, UserGameRecord>;
  totalStars: number;
  totalScore: number;
  totalGamesPlayed: number;
  totalLevelsCompleted: number;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: AchievementCategory;
  categoryLabel: string;
  badgeIcon: string; // Lucide icon identifier
  badgeColor: string;
  requirementDescription: string;
  evaluate: (ctx: AchievementEvaluationContext) => boolean;
}

export const GAME_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'ach-first-step',
    title: '啟航冒險者',
    subtitle: '踏出遊戲化學習的第一步',
    description: '首次於任一款程式學習遊戲中成功通關至少一個關卡或完成一局挑戰。',
    category: 'exploration',
    categoryLabel: '探索入門',
    badgeIcon: 'Compass',
    badgeColor: '#3B82F6',
    requirementDescription: '完成任意遊戲的 1 個關卡或 1 回合',
    evaluate: (ctx) => ctx.totalLevelsCompleted >= 1,
  },
  {
    id: 'ach-puzzle-master',
    title: '邏輯編織者',
    subtitle: '解開重重交織的程式碼片段',
    description: '成功通關 Code Puzzle 程式邏輯拼圖的所有入門與進階關卡。',
    category: 'mastery',
    categoryLabel: '單項精通',
    badgeIcon: 'Puzzle',
    badgeColor: '#D97706',
    requirementDescription: 'Code Puzzle 通關數達 2 關以上',
    evaluate: (ctx) => (ctx.records['code-puzzle']?.completedLevelsCount || 0) >= 2,
  },
  {
    id: 'ach-css-artist',
    title: '視覺調色盤',
    subtitle: '掌握 CSS 版面與色彩美學',
    description: '在 CSS Designer 中精準駕馭 Flexbox 與盒模型，完成多個樣式任務。',
    category: 'mastery',
    categoryLabel: '單項精通',
    badgeIcon: 'Palette',
    badgeColor: '#0284C7',
    requirementDescription: 'CSS Designer 通關數達 2 關以上',
    evaluate: (ctx) => (ctx.records['css-designer']?.completedLevelsCount || 0) >= 2,
  },
  {
    id: 'ach-bug-catcher',
    title: '火眼金睛獵人',
    subtitle: '洞悉各類隱藏的語法陷阱',
    description: '在 Bug Hunter 遊戲中成功抓出並修復未閉合標籤與 CSS/JS 屬性漏洞。',
    category: 'mastery',
    categoryLabel: '單項精通',
    badgeIcon: 'Bug',
    badgeColor: '#E11D48',
    requirementDescription: 'Bug Hunter 通關數達 2 關以上',
    evaluate: (ctx) => (ctx.records['bug-hunter']?.completedLevelsCount || 0) >= 2,
  },
  {
    id: 'ach-quiz-rusher',
    title: '疾速解題者',
    subtitle: '在倒數壓力下保持精準判斷',
    description: '在 Quiz Rush 證照快答挑戰中完成作答並累積優異成績。',
    category: 'mastery',
    categoryLabel: '單項精通',
    badgeIcon: 'Zap',
    badgeColor: '#F59E0B',
    requirementDescription: 'Quiz Rush 完成至少 1 回合答題且星數達標',
    evaluate: (ctx) => (ctx.records['quiz-rush']?.completedLevelsCount || 0) >= 1,
  },
  {
    id: 'ach-web-architect',
    title: '架構建築師',
    subtitle: '構築符合 W3C 標準的語意結構',
    description: '在 Web Builder 網頁架構師中完成基本骨架、語意地標與頁面組裝挑戰。',
    category: 'mastery',
    categoryLabel: '單項精通',
    badgeIcon: 'Layout',
    badgeColor: '#059669',
    requirementDescription: 'Web Builder 通關數達 2 關以上',
    evaluate: (ctx) => (ctx.records['web-builder']?.completedLevelsCount || 0) >= 2,
  },
  {
    id: 'ach-omni-player',
    title: '全領域冒險家',
    subtitle: '五大領域跨界全能體驗',
    description: '在平台所有五款互動遊戲（拼圖、排版、除錯、快答、架構）中，各自完成至少 1 個關卡或回合。',
    category: 'exploration',
    categoryLabel: '綜合探索',
    badgeIcon: 'Trophy',
    badgeColor: '#8B5CF6',
    requirementDescription: '五款遊戲各完成至少 1 關',
    evaluate: (ctx) => {
      const gList: GameId[] = ['code-puzzle', 'css-designer', 'bug-hunter', 'quiz-rush', 'web-builder'];
      return gList.every((g) => (ctx.records[g]?.completedLevelsCount || 0) >= 1);
    },
  },
  {
    id: 'ach-star-collector-10',
    title: '榮譽新星 (10★)',
    subtitle: '摘下十顆榮耀之星',
    description: '跨遊戲累積獲得 10 顆以上挑戰星星，展現紮實解題實力。',
    category: 'milestone',
    categoryLabel: '成就里程碑',
    badgeIcon: 'Star',
    badgeColor: '#EAB308',
    requirementDescription: '全遊戲累積星星達 10 顆',
    evaluate: (ctx) => ctx.totalStars >= 10,
  },
  {
    id: 'ach-star-collector-20',
    title: '璀璨星宿 (20★)',
    subtitle: '照亮學習航道的光芒',
    description: '跨遊戲累積獲得 20 顆以上挑戰星星，邁向頂尖資訊人才之列。',
    category: 'milestone',
    categoryLabel: '成就里程碑',
    badgeIcon: 'Sparkles',
    badgeColor: '#F59E0B',
    requirementDescription: '全遊戲累積星星達 20 顆',
    evaluate: (ctx) => ctx.totalStars >= 20,
  },
  {
    id: 'ach-score-champion',
    title: '積分登頂者',
    subtitle: '跨領域總分突破 1000 分',
    description: '在多款遊戲歷練中不斷刷新歷史高標，累積總積分跨越 1,000 分大關。',
    category: 'dedication',
    categoryLabel: '毅力累積',
    badgeIcon: 'Award',
    badgeColor: '#EC4899',
    requirementDescription: '全遊戲累計最高分達 1000 分以上',
    evaluate: (ctx) => ctx.totalScore >= 1000,
  },
];
