/**
 * CODE TO KNOW (碼上學) - 題庫、錯題與教育遊戲目標雙向連動引擎
 * 對應原始 UID：P14-GAM-013（課程、題庫、考試與遊戲學習目標連動）
 *
 * 核心功能：
 * 1. 深度分析學生錯題本（ctk_wrong_questions:${userId}）未掌握與複習中題目的單元分佈
 * 2. 映射至平台五大教育遊戲之專屬能力維度
 * 3. 動態輸出個人化遊戲強化推薦清單與精準診斷建議
 */

import { GameId } from './gameStorage';
import {
  getWrongQuestionsCollection,
  WrongQuestionItem,
} from './wrongQuestionsStorage';

export interface GameRecommendation {
  gameId: GameId;
  gameTitleZh: string;
  actionHash: string;
  tagZh: string;
  priority: 'HIGH' | 'MEDIUM' | 'NORMAL';
  unmasteredCount: number;
  reasonZh: string;
  actionLabelZh: string;
}

export interface SectionAnalysis {
  sectionId: '01' | '02' | '03' | '04';
  sectionNameZh: string;
  totalWrong: number;
  unmasteredCount: number;
}

export const OFFICIAL_SECTION_NAMES: Record<'01' | '02' | '03' | '04', string> = {
  '01': '工作項目 01：電腦與網路通訊基礎',
  '02': '工作項目 02：網頁語法 HTML 與語意地標',
  '03': '工作項目 03：CSS 樣式設計與盒模型排版',
  '04': '工作項目 04：網頁應用技術與考場除錯實務',
};

/**
 * 依據錯題本單元分佈，計算個人化遊戲推薦
 */
export function getRecommendedGamesByWeakness(userId: string): {
  hasWeakness: boolean;
  totalUnmasteredQuestions: number;
  dominantWeakSection?: '01' | '02' | '03' | '04';
  recommendations: GameRecommendation[];
} {
  const collection = getWrongQuestionsCollection(userId);
  const items = Object.values(collection.items || {}) as WrongQuestionItem[];

  // 篩選未完全掌握的錯題（unmastered 或 reviewing）
  const activeUnmastered = items.filter(
    (item) => !item.resolved && item.masteryStatus !== 'mastered'
  );

  const sectionCounts: Record<'01' | '02' | '03' | '04', number> = {
    '01': 0,
    '02': 0,
    '03': 0,
    '04': 0,
  };

  activeUnmastered.forEach((item) => {
    const sec = item.officialSection;
    if (sec && ['01', '02', '03', '04'].includes(sec)) {
      sectionCounts[sec] += 1;
    } else {
      // 依據章節預設
      const ch = item.chapterId || 1;
      const fallbackSec = `0${ch}`.slice(-2) as '01' | '02' | '03' | '04';
      if (sectionCounts[fallbackSec] !== undefined) {
        sectionCounts[fallbackSec] += 1;
      }
    }
  });

  const totalUnmastered = activeUnmastered.length;

  // 若使用者尚無任何錯題，回傳綜合入門建議
  if (totalUnmastered === 0) {
    return {
      hasWeakness: false,
      totalUnmasteredQuestions: 0,
      recommendations: [
        {
          gameId: 'quiz-rush',
          gameTitleZh: 'Quiz Rush (證照疾速快答)',
          actionHash: '#games/quiz-rush',
          tagZh: '學科模擬挑戰',
          priority: 'NORMAL',
          unmasteredCount: 0,
          reasonZh: '尚未累積錯題！建議先透過證照快答挑戰自我，發掘潛在學習盲點。',
          actionLabelZh: '開始快答自我檢測',
        },
        {
          gameId: 'code-puzzle',
          gameTitleZh: 'Code Puzzle (程式邏輯拼圖)',
          actionHash: '#games/code-puzzle',
          tagZh: '語意結構訓練',
          priority: 'NORMAL',
          unmasteredCount: 0,
          reasonZh: '透過程式碼重組熟悉 HTML5 骨架順序，厚植考場直覺。',
          actionLabelZh: '前往拼圖挑戰',
        },
      ],
    };
  }

  // 找出待加強最嚴重的單元
  const sortedSections = (Object.keys(sectionCounts) as Array<'01' | '02' | '03' | '04'>).sort(
    (a, b) => sectionCounts[b] - sectionCounts[a]
  );
  const dominantSec = sortedSections[0];

  const recommendations: GameRecommendation[] = [];

  // 單元 03 (CSS) 錯題偏多 -> 強烈推薦 CSS Designer
  if (sectionCounts['03'] > 0) {
    recommendations.push({
      gameId: 'css-designer',
      gameTitleZh: 'CSS Designer (樣式排版設計師)',
      actionHash: '#games/css-designer',
      tagZh: 'CSS 盒模型 / 排版',
      priority: sectionCounts['03'] >= 2 ? 'HIGH' : 'MEDIUM',
      unmasteredCount: sectionCounts['03'],
      reasonZh: `您在 CSS 樣式與排版相關題目累積 ${sectionCounts['03']} 道待加強錯題，建議透過視覺化滑桿即時調校強化空間認知。`,
      actionLabelZh: '強化 CSS 弱點',
    });
  }

  // 單元 04 (除錯/應用) 錯題偏多 -> 強烈推薦 Bug Hunter
  if (sectionCounts['04'] > 0) {
    recommendations.push({
      gameId: 'bug-hunter',
      gameTitleZh: 'Bug Hunter (程式除錯獵人)',
      actionHash: '#games/bug-hunter',
      tagZh: '考場除錯 / 語法陷阱',
      priority: sectionCounts['04'] >= 2 ? 'HIGH' : 'MEDIUM',
      unmasteredCount: sectionCounts['04'],
      reasonZh: `您在考場除錯與網頁應用累積 ${sectionCounts['04']} 道待加強錯題，建議前往除錯獵人訓練一眼辨識語法漏洞。`,
      actionLabelZh: '前往除錯特訓',
    });
  }

  // 單元 02 (HTML 結構) 錯題偏多 -> 推薦 Web Builder 或 Code Puzzle
  if (sectionCounts['02'] > 0) {
    recommendations.push({
      gameId: 'web-builder',
      gameTitleZh: 'Web Builder (網頁架構拼裝工坊)',
      actionHash: '#games/web-builder',
      tagZh: 'HTML5 地標語意',
      priority: sectionCounts['02'] >= 2 ? 'HIGH' : 'MEDIUM',
      unmasteredCount: sectionCounts['02'],
      reasonZh: `您在 HTML 語意標籤累積 ${sectionCounts['02']} 道待加強錯題，建議組裝完整網頁地標區塊厚植標準觀念。`,
      actionLabelZh: '搭建語意架構',
    });
  }

  // 單元 01 (通識概念) 錯題偏多 -> 推薦 Quiz Rush
  if (sectionCounts['01'] > 0) {
    recommendations.push({
      gameId: 'quiz-rush',
      gameTitleZh: 'Quiz Rush (證照疾速快答)',
      actionHash: '#games/quiz-rush',
      tagZh: '電腦通識與通訊',
      priority: sectionCounts['01'] >= 2 ? 'HIGH' : 'MEDIUM',
      unmasteredCount: sectionCounts['01'],
      reasonZh: `您在電腦與通訊基礎累積 ${sectionCounts['01']} 道待加強錯題，建議透過高壓倒數快答強化記憶連結。`,
      actionLabelZh: '重溫通識快答',
    });
  }

  // 排序：HIGH 優先於 MEDIUM，並按錯題數量降冪排序
  recommendations.sort((a, b) => {
    if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
    if (b.priority === 'HIGH' && a.priority !== 'HIGH') return 1;
    return b.unmasteredCount - a.unmasteredCount;
  });

  return {
    hasWeakness: true,
    totalUnmasteredQuestions: totalUnmastered,
    dominantWeakSection: dominantSec,
    recommendations: recommendations.slice(0, 3), // 最多推薦前 3 款相關遊戲
  };
}
