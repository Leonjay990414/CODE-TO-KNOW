/**
 * CODE TO KNOW (碼上學) - 每日任務、連續學習 Streak 與外觀成就解鎖引擎
 * 對應原始 UID：P14-GAM-011（每日任務、連續學習與成就系統）
 * 遵循多帳號資料隔離 (ctk_daily_streak:${userId}, ctk_daily_quests:${userId})
 * 具備跨日自動刷新、容錯降級、防重複領取機制
 */

export interface DailyStreakRecord {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  streakDates: string[];  // 最近 30 天內活躍紀錄
  updatedAt: string;
}

export type QuestCategory = 'game' | 'stars' | 'review';

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  rewardExp: number;
  rewardBadgeTitle?: string;
}

export interface DailyQuestsRecord {
  userId: string;
  date: string; // YYYY-MM-DD
  quests: DailyQuest[];
  allCompleted: boolean;
  updatedAt: string;
}

export interface TitleReward {
  id: string;
  titleZh: string;
  descriptionZh: string;
  requiredStreak: number;
  badgeColor: string;
}

export const TITLE_REWARDS: TitleReward[] = [
  {
    id: 'title-novice-explorer',
    titleZh: '啟航學員',
    descriptionZh: '完成首次學習打卡',
    requiredStreak: 1,
    badgeColor: '#3B82F6',
  },
  {
    id: 'title-steady-learner',
    titleZh: '持之以恆',
    descriptionZh: '連續學習達 3 天',
    requiredStreak: 3,
    badgeColor: '#10B981',
  },
  {
    id: 'title-streak-master',
    titleZh: '自律領航員',
    descriptionZh: '連續學習達 7 天',
    requiredStreak: 7,
    badgeColor: '#F59E0B',
  },
  {
    id: 'title-code-gladiator',
    titleZh: '不屈鬥士',
    descriptionZh: '連續學習達 14 天',
    requiredStreak: 14,
    badgeColor: '#8B5CF6',
  },
];

const STREAK_PREFIX = 'ctk_daily_streak';
const QUESTS_PREFIX = 'ctk_daily_quests';
const EQUIPPED_TITLE_PREFIX = 'ctk_equipped_title';

function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString(date: Date = new Date()): string {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
}

function buildStreakKey(userId: string): string {
  const safeUser = (userId || 'guest-anonymous').trim();
  return `${STREAK_PREFIX}:${safeUser}`;
}

function buildQuestsKey(userId: string): string {
  const safeUser = (userId || 'guest-anonymous').trim();
  return `${QUESTS_PREFIX}:${safeUser}`;
}

function buildTitleKey(userId: string): string {
  const safeUser = (userId || 'guest-anonymous').trim();
  return `${EQUIPPED_TITLE_PREFIX}:${safeUser}`;
}

export function createInitialStreakRecord(userId: string): DailyStreakRecord {
  return {
    userId: userId || 'guest-anonymous',
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    streakDates: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 取得使用者連續學習 Streak 紀錄
 */
export function getUserStreak(userId: string, targetDate?: Date): DailyStreakRecord {
  const key = buildStreakKey(userId);
  const fallback = createInitialStreakRecord(userId);

  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;

    const today = targetDate ? getLocalDateString(targetDate) : getLocalDateString();
    const yesterday = targetDate ? getYesterdayDateString(targetDate) : getYesterdayDateString();
    const lastActive = parsed.lastActiveDate || '';

    // 計算 Streak 有效性：如果最後活躍日早於昨天，且不是今天，Streak 中斷歸 0
    let currentStreak = typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0;
    if (lastActive && lastActive !== today && lastActive !== yesterday) {
      currentStreak = 0;
    }

    return {
      userId: parsed.userId || userId,
      currentStreak,
      longestStreak: typeof parsed.longestStreak === 'number' ? parsed.longestStreak : 0,
      lastActiveDate: lastActive,
      streakDates: Array.isArray(parsed.streakDates) ? parsed.streakDates : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`[DailyQuestEngine] 讀取 Streak 失敗 (${key})，使用初始狀態:`, err);
    return fallback;
  }
}

/**
 * 記錄今日學習活躍打卡
 */
export function recordDailyActivity(userId: string, targetDate?: Date): DailyStreakRecord {
  const current = getUserStreak(userId, targetDate);
  const today = targetDate ? getLocalDateString(targetDate) : getLocalDateString();
  const yesterday = targetDate ? getYesterdayDateString(targetDate) : getYesterdayDateString();

  // 若今日已打卡，不重複累加天數
  if (current.lastActiveDate === today) {
    return current;
  }

  let newStreak = 1;
  if (current.lastActiveDate === yesterday) {
    newStreak = current.currentStreak + 1;
  }

  const newLongest = Math.max(current.longestStreak, newStreak);
  const dates = new Set(current.streakDates);
  dates.add(today);

  // 只保留最近 60 天
  const sortedDates = Array.from(dates).sort().slice(-60);

  const updated: DailyStreakRecord = {
    userId: current.userId,
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActiveDate: today,
    streakDates: sortedDates,
    updatedAt: new Date().toISOString(),
  };

  const key = buildStreakKey(userId);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(updated));
    }
  } catch (err) {
    console.error(`[DailyQuestEngine] 寫入 Streak 失敗 (${key}):`, err);
  }

  return updated;
}

/**
 * 產生標準每日 3 大任務範本
 */
export function createDefaultQuests(): DailyQuest[] {
  return [
    {
      id: 'quest-play-game',
      title: '試煉挑戰者',
      description: '完成任意 1 個教育遊戲關卡或挑戰回合',
      category: 'game',
      target: 1,
      current: 0,
      completed: false,
      claimed: false,
      rewardExp: 50,
      rewardBadgeTitle: '每日挑戰徽章',
    },
    {
      id: 'quest-collect-stars',
      title: '摘星之旅',
      description: '在遊戲挑戰中累積獲得至少 3 顆榮譽星星',
      category: 'stars',
      target: 3,
      current: 0,
      completed: false,
      claimed: false,
      rewardExp: 80,
    },
    {
      id: 'quest-review-questions',
      title: '學思並進',
      description: '完成 5 題證照快答或學科錯題複習',
      category: 'review',
      target: 5,
      current: 0,
      completed: false,
      claimed: false,
      rewardExp: 100,
    },
  ];
}

/**
 * 取得今日每日任務（跨日自動重置）
 */
export function getDailyQuests(userId: string, targetDate?: Date): DailyQuestsRecord {
  const key = buildQuestsKey(userId);
  const today = targetDate ? getLocalDateString(targetDate) : getLocalDateString();
  const defaultRecord: DailyQuestsRecord = {
    userId: userId || 'guest-anonymous',
    date: today,
    quests: createDefaultQuests(),
    allCompleted: false,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultRecord;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      // 首次進入寫入今日任務
      window.localStorage.setItem(key, JSON.stringify(defaultRecord));
      return defaultRecord;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.date !== today) {
      // 跨日或格式毀損，自動重設為今日乾淨任務
      window.localStorage.setItem(key, JSON.stringify(defaultRecord));
      return defaultRecord;
    }

    return {
      userId: parsed.userId || userId,
      date: parsed.date || today,
      quests: Array.isArray(parsed.quests) ? parsed.quests : createDefaultQuests(),
      allCompleted: !!parsed.allCompleted,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`[DailyQuestEngine] 讀取每日任務失敗 (${key})，使用乾淨狀態:`, err);
    return defaultRecord;
  }
}

/**
 * 更新每日任務進度
 */
export function updateQuestProgress(
  userId: string,
  category: QuestCategory,
  increment: number = 1
): DailyQuestsRecord {
  const current = getDailyQuests(userId);
  let changed = false;

  const updatedQuests = current.quests.map((q) => {
    if (q.category === category && !q.completed) {
      const newCurrent = Math.min(q.target, q.current + Math.max(0, increment));
      const completed = newCurrent >= q.target;
      changed = true;
      return {
        ...q,
        current: newCurrent,
        completed,
      };
    }
    return q;
  });

  const allCompleted = updatedQuests.every((q) => q.completed);

  const updatedRecord: DailyQuestsRecord = {
    ...current,
    quests: updatedQuests,
    allCompleted,
    updatedAt: new Date().toISOString(),
  };

  if (changed) {
    const key = buildQuestsKey(userId);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(updatedRecord));
      }
    } catch (err) {
      console.error(`[DailyQuestEngine] 寫入任務進度失敗 (${key}):`, err);
    }
  }

  return updatedRecord;
}

/**
 * 領取每日任務獎勵
 */
export function claimQuestReward(userId: string, questId: string): DailyQuestsRecord {
  const current = getDailyQuests(userId);
  const updatedQuests = current.quests.map((q) => {
    if (q.id === questId && q.completed && !q.claimed) {
      return { ...q, claimed: true };
    }
    return q;
  });

  const updatedRecord: DailyQuestsRecord = {
    ...current,
    quests: updatedQuests,
    updatedAt: new Date().toISOString(),
  };

  const key = buildQuestsKey(userId);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(updatedRecord));
    }
  } catch (err) {
    console.error(`[DailyQuestEngine] 領取任務獎勵失敗 (${key}):`, err);
  }

  return updatedRecord;
}

/**
 * 稱號徽章配戴管理 (Cosmetic Title Management)
 */
export function getUnlockedTitles(userId: string): TitleReward[] {
  const streak = getUserStreak(userId);
  return TITLE_REWARDS.filter((t) => streak.longestStreak >= t.requiredStreak);
}

export function getEquippedTitle(userId: string): TitleReward | null {
  const key = buildTitleKey(userId);
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const titleId = window.localStorage.getItem(key);
    if (!titleId) return null;
    return TITLE_REWARDS.find((t) => t.id === titleId) || null;
  } catch {
    return null;
  }
}

export function equipTitle(userId: string, titleId: string): boolean {
  const unlocked = getUnlockedTitles(userId);
  const canEquip = unlocked.some((t) => t.id === titleId);
  if (!canEquip) {
    return false;
  }
  const key = buildTitleKey(userId);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, titleId);
    }
    return true;
  } catch {
    return false;
  }
}
