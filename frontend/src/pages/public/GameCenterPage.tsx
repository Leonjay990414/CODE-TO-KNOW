import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Puzzle,
  Palette,
  Bug,
  Zap,
  Layout,
  Star,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Award,
  Search,
  X,
  Filter,
  Flame,
  CheckCircle2,
  Target,
  History,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  getOverallGameStats,
  getUserGameRecord,
  getGamePlayHistory,
  GamePlayHistoryItem,
} from '../../utils/gameStorage';
import { GameAchievementsModal } from '../../components/GameAchievementsModal';
import { getDetailedAchievements } from '../../utils/gameAchievementEngine';
import {
  getUserStreak,
  getDailyQuests,
  claimQuestReward,
  recordDailyActivity,
  DailyStreakRecord,
  DailyQuestsRecord,
} from '../../utils/dailyQuestEngine';
import {
  getRecommendedGamesByWeakness,
} from '../../utils/gameLearningInterlock';

interface GameCenterPageProps {
  onOpenTeacherApply?: () => void;
}

export type GameCategory = 'ALL' | 'HTML' | 'CSS' | 'JS' | 'EXAM';

export const GameCenterPage: React.FC<GameCenterPageProps> = ({ onOpenTeacherApply }) => {
  const { user, openAuth } = useAuth();
  const { goToHome, goToStudentDashboard } = useNavigation();

  const userId = user?.id || 'guest-anonymous';
  const [stats, setStats] = useState(() => getOverallGameStats(userId));
  const [achievements, setAchievements] = useState(() => getDetailedAchievements(userId));
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [puzzleRecord, setPuzzleRecord] = useState(() => getUserGameRecord(userId, 'code-puzzle'));
  const [cssRecord, setCssRecord] = useState(() => getUserGameRecord(userId, 'css-designer'));
  const [bugRecord, setBugRecord] = useState(() => getUserGameRecord(userId, 'bug-hunter'));
  const [quizRecord, setQuizRecord] = useState(() => getUserGameRecord(userId, 'quiz-rush'));
  const [webBuilderRecord, setWebBuilderRecord] = useState(() => getUserGameRecord(userId, 'web-builder'));

  // P14-GAM-011: 連續學習 Streak 與每日任務狀態
  const [streak, setStreak] = useState<DailyStreakRecord>(() => getUserStreak(userId));
  const [dailyQuests, setDailyQuests] = useState<DailyQuestsRecord>(() => getDailyQuests(userId));

  // P14-GAM-013: 題庫錯題弱點連動推薦狀態
  const [weaknessRec, setWeaknessRec] = useState(() => getRecommendedGamesByWeakness(userId));

  // P14-GAM-012: 最近遊玩對局歷程
  const [playHistory, setPlayHistory] = useState<GamePlayHistoryItem[]>(() => getGamePlayHistory(userId, 3));

  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setStats(getOverallGameStats(userId));
    setAchievements(getDetailedAchievements(userId));
    setPuzzleRecord(getUserGameRecord(userId, 'code-puzzle'));
    setCssRecord(getUserGameRecord(userId, 'css-designer'));
    setBugRecord(getUserGameRecord(userId, 'bug-hunter'));
    setQuizRecord(getUserGameRecord(userId, 'quiz-rush'));
    setWebBuilderRecord(getUserGameRecord(userId, 'web-builder'));
    setStreak(getUserStreak(userId));
    setDailyQuests(getDailyQuests(userId));
    setWeaknessRec(getRecommendedGamesByWeakness(userId));
    setPlayHistory(getGamePlayHistory(userId, 3));
  }, [userId]);

  const handleClaim = (questId: string) => {
    const updated = claimQuestReward(userId, questId);
    setDailyQuests(updated);
  };

  const handleDailyCheckIn = () => {
    const updated = recordDailyActivity(userId);
    setStreak(updated);
  };

  const gamesList: Array<{
    id: string;
    uid: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    status: 'AVAILABLE' | 'COMING_SOON';
    statusText: string;
    tag: string;
    categories: GameCategory[];
    levelsCount: number;
    completedLevels: number;
    stars: number;
    score: number;
    actionHash: string;
    description: string;
  }> = [
    {
      id: 'code-puzzle',
      uid: 'P14-GAM-004',
      title: 'Code Puzzle (程式邏輯拼圖)',
      subtitle: '重組程式碼語意結構，鍛鍊階層思維與標準語法順序',
      icon: <Puzzle size={28} color="var(--color-brand-gold)" />,
      status: 'AVAILABLE',
      statusText: '已開放遊玩',
      tag: 'HTML5 / CSS / JS',
      categories: ['HTML', 'CSS', 'JS'],
      levelsCount: 4,
      completedLevels: puzzleRecord.completedLevelsCount,
      stars: puzzleRecord.totalStars,
      score: puzzleRecord.totalScore,
      actionHash: '#games/code-puzzle',
      description: '將打亂的語意標籤與樣式屬性重新排列，支援即時驗證、層級提示與完整語法解析。',
    },
    {
      id: 'css-designer',
      uid: 'P14-GAM-005',
      title: 'CSS Designer (樣式排版設計師)',
      subtitle: '視覺化滑桿與屬性調校，直覺理解 Flexbox、盒模型與顏色對比',
      icon: <Palette size={28} color="#0284C7" />,
      status: 'AVAILABLE',
      statusText: '已開放遊玩',
      tag: '色彩 / 盒模型 / Flexbox / 卡片',
      categories: ['CSS'],
      levelsCount: 4,
      completedLevels: cssRecord.completedLevelsCount,
      stars: cssRecord.totalStars,
      score: cssRecord.totalScore,
      actionHash: '#games/css-designer',
      description: '即時調整顏色、盒模型 (margin/padding/border) 與 Flexbox 佈局，精準達成視覺設計目標。',
    },
    {
      id: 'bug-hunter',
      uid: 'P14-GAM-006',
      title: 'Bug Hunter (程式除錯獵人)',
      subtitle: '排查未閉合標籤、非法 CSS 屬性與 JS 大小寫邏輯漏洞',
      icon: <Bug size={28} color="#E11D48" />,
      status: 'AVAILABLE',
      statusText: '已開放遊玩',
      tag: 'HTML / CSS / JS 綜合除錯',
      categories: ['HTML', 'CSS', 'JS'],
      levelsCount: 4,
      completedLevels: bugRecord.completedLevelsCount,
      stars: bugRecord.totalStars,
      score: bugRecord.totalScore,
      actionHash: '#games/bug-hunter',
      description: '模擬考場常犯失分錯誤，訓練一眼看穿未閉合標籤、非法 CSS 屬性值與 JS 駝峰大小寫的除錯直覺。',
    },
    {
      id: 'quiz-rush',
      uid: 'P14-GAM-007',
      title: 'Quiz Rush (證照疾速快答)',
      subtitle: '全量 605 題官方有效題庫高壓實力試煉，連鎖 Combo 加分',
      icon: <Zap size={28} color="#D97706" />,
      status: 'AVAILABLE',
      statusText: '已開放遊玩',
      tag: '605 題官方題庫 / 限時快答 / Combo',
      categories: ['EXAM'],
      levelsCount: 4,
      completedLevels: quizRecord.completedLevelsCount,
      stars: quizRecord.totalStars,
      score: quizRecord.totalScore,
      actionHash: '#games/quiz-rush',
      description: '在倒數計時中迅速判斷答案，支援連續答對 Combo 加分，錯題無縫同步至個人錯題本。',
    },
    {
      id: 'web-builder',
      uid: 'P14-GAM-008',
      title: 'Web Builder (網頁架構拼裝工坊)',
      subtitle: '模組化組裝完整網頁區塊，即時預覽版面成果',
      icon: <Layout size={28} color="#059669" />,
      status: 'AVAILABLE',
      statusText: '已開放遊玩',
      tag: 'HTML5 語意地標 / 結構拼裝',
      categories: ['HTML'],
      levelsCount: 4,
      completedLevels: webBuilderRecord.completedLevelsCount,
      stars: webBuilderRecord.totalStars,
      score: webBuilderRecord.totalScore,
      actionHash: '#games/web-builder',
      description: '將文件宣告、地標（header/nav/main/footer）與圖文區塊積木拼裝成現代標準網頁，培養全域架構視野。',
    },
  ];

  const categoryTabs: { key: GameCategory; label: string; count: number }[] = [
    { key: 'ALL', label: '全部遊戲', count: gamesList.length },
    { key: 'HTML', label: 'HTML 結構', count: gamesList.filter((g) => g.categories.includes('HTML')).length },
    { key: 'CSS', label: 'CSS 樣式', count: gamesList.filter((g) => g.categories.includes('CSS')).length },
    { key: 'JS', label: 'JavaScript', count: gamesList.filter((g) => g.categories.includes('JS')).length },
    { key: 'EXAM', label: '證照快答', count: gamesList.filter((g) => g.categories.includes('EXAM')).length },
  ];

  const filteredGames = gamesList.filter((game) => {
    const matchesCategory = selectedCategory === 'ALL' || game.categories.includes(selectedCategory);
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      game.title.toLowerCase().includes(q) ||
      game.subtitle.toLowerCase().includes(q) ||
      game.description.toLowerCase().includes(q) ||
      game.tag.toLowerCase().includes(q) ||
      game.uid.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-base)' }}>
      <Navbar onOpenAuth={openAuth} onOpenTeacherApply={onOpenTeacherApply} />

      <main style={{ flex: 1, paddingBottom: 'var(--space-16)' }}>
        {/* Header Breadcrumbs */}
        <section style={{ backgroundColor: 'var(--surface-base)', borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-6) 0' }}>
          <div className="container">
            <nav className="breadcrumb-nav" aria-label="導覽路徑" style={{ marginBottom: '12px' }}>
              <a href="#hero" onClick={(e) => { e.preventDefault(); goToHome(); }}>首頁</a>
              <span>/</span>
              <a href="#student" onClick={(e) => { e.preventDefault(); goToStudentDashboard(); }}>學生中心</a>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>互動遊戲中心 (Game Center)</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <Gamepad2 size={32} color="var(--color-brand-gold)" />
                  <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    互動遊戲與遊戲化學習中心
                  </h1>
                </div>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0 }}>
                  寓教於樂、啟發程式邏輯思考。透過 5 款微型學習遊戲，循序鞏固學科與術科核心能力。
                </p>
              </div>

              {/* Progress Summary Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  backgroundColor: 'var(--surface-sunken)',
                  padding: '12px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star size={20} color="var(--color-brand-gold)" fill="var(--color-brand-gold)" />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>累計星星</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {stats.totalStars} <span style={{ fontSize: '12px', fontWeight: 400 }}>顆</span>
                    </div>
                  </div>
                </div>

                <div style={{ width: '1px', height: '28px', backgroundColor: 'var(--border-default)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={20} color="#2563EB" />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>遊戲總積分</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {stats.totalScore} <span style={{ fontSize: '12px', fontWeight: 400 }}>分</span>
                    </div>
                  </div>
                </div>

                <div style={{ width: '1px', height: '28px', backgroundColor: 'var(--border-default)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} color="#16A34A" />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>已通關關卡</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {stats.totalLevelsCompleted} <span style={{ fontSize: '12px', fontWeight: 400 }}>關</span>
                    </div>
                  </div>
                </div>

                <div style={{ width: '1px', height: '28px', backgroundColor: 'var(--border-default)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flame size={20} color="#EA580C" fill={streak.currentStreak > 0 ? '#EA580C' : 'none'} />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>連續學習</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {streak.currentStreak} <span style={{ fontSize: '12px', fontWeight: 400 }}>天</span>
                    </div>
                  </div>
                </div>

                <div style={{ width: '1px', height: '28px', backgroundColor: 'var(--border-default)' }} />

                <button
                  onClick={() => setIsAchievementsModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  title="點擊開啟成就與榮譽徽章館"
                >
                  <Award size={20} color="#D97706" />
                  <div>
                    <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 600 }}>榮譽徽章館</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#78350F' }}>
                      {achievements.unlockedCount} / {achievements.totalCount}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy & Instructions Card */}
        <div className="container" style={{ marginTop: '24px' }}>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(189, 167, 126, 0.08)',
              border: '1px solid rgba(189, 167, 126, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '24px',
            }}
          >
            <Sparkles size={24} color="var(--color-brand-gold)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
              <strong>碼上學 遊戲化學習準則：</strong>遊戲是思維訓練的催化劑，絕非盲目盲猜。每款遊戲均針對「網頁設計丙級」核心技能研發，包含階層排序、排版直覺、除錯敏銳度與知識反應。每關皆提供漸進式思考提示與通關深度解析，輔助您獨立掌握技術本質。
            </div>
          </div>

          {/* P14-GAM-011: 每日學習任務與連續打卡 Streak 儀表板 */}
          <div
            data-testid="daily-quests-dashboard"
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-sunken)',
              border: '1px solid var(--border-default)',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Target size={22} color="#EA580C" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    每日挑戰任務 (Daily Quests)
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    每日 00:00 自動刷新 · 連續打卡維持熱情 · 完成領取學習經驗值
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    backgroundColor: streak.currentStreak > 0 ? '#FEF2F2' : 'var(--surface-base)',
                    border: '1px solid',
                    borderColor: streak.currentStreak > 0 ? '#FCA5A5' : 'var(--border-default)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: streak.currentStreak > 0 ? '#B91C1C' : 'var(--text-muted)',
                  }}
                >
                  <Flame size={16} color={streak.currentStreak > 0 ? '#EF4444' : 'var(--text-muted)'} />
                  <span>連續打卡 {streak.currentStreak} 天 (歷史最高 {streak.longestStreak} 天)</span>
                </div>

                <button
                  onClick={handleDailyCheckIn}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '12px', padding: '6px 12px', minHeight: '32px' }}
                >
                  今日簽到
                </button>
              </div>
            </div>

            {/* 3 Quests Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '14px',
              }}
            >
              {dailyQuests.quests.map((q) => {
                const percent = Math.min(100, Math.round((q.current / q.target) * 100));
                return (
                  <div
                    key={q.id}
                    data-testid={`quest-card-${q.id}`}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-base)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{q.title}</span>
                        <span style={{ fontSize: '11px', color: '#B45309', fontWeight: 600 }}>+{q.rewardExp} EXP</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        {q.description}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>進度</span>
                        <span>{q.current} / {q.target}</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'var(--surface-sunken)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${percent}%`,
                            height: '100%',
                            backgroundColor: q.completed ? '#10B981' : '#EA580C',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '4px' }}>
                      {q.claimed ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
                          <CheckCircle2 size={14} /> 已領取
                        </span>
                      ) : q.completed ? (
                        <button
                          onClick={() => handleClaim(q.id)}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '12px', padding: '4px 10px', minHeight: '28px' }}
                        >
                          領取獎勵
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>進行中</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* P14-GAM-013: 題庫錯題弱點智慧連動推薦區塊 */}
          <div
            data-testid="learning-interlock-recommendation"
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-sunken)',
              border: '1px solid var(--border-default)',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <TrendingUp size={22} color="#2563EB" />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  學科弱點連動推薦 (P14-GAM-013 智慧引導)
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {weaknessRec.hasWeakness
                    ? `依據您錯題本累積的 ${weaknessRec.totalUnmasteredQuestions} 道待加強題目，智慧推薦專屬教育遊戲以強化弱點技能`
                    : '根據您的學習狀況提供專屬遊戲挑戰指引，及早發現學習盲點'}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '12px',
              }}
            >
              {weaknessRec.recommendations.map((rec) => (
                <div
                  key={rec.gameId}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--surface-base)',
                    border: '1px solid',
                    borderColor: rec.priority === 'HIGH' ? '#93C5FD' : 'var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {rec.gameTitleZh}
                      </span>
                      <span
                        className={`badge ${rec.priority === 'HIGH' ? 'badge-primary' : 'badge-neutral'}`}
                        style={{ fontSize: '11px' }}
                      >
                        {rec.tagZh}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {rec.reasonZh}
                    </p>
                  </div>

                  <a
                    href={rec.actionHash}
                    className="btn btn-outline btn-sm btn-nowrap"
                    style={{ alignSelf: 'flex-start', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{rec.actionLabelZh}</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* P14-GAM-012: 最近遊玩對局歷程 (Play History Audit Trail) */}
          {playHistory.length > 0 && (
            <div
              data-testid="play-history-section"
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-sunken)',
                border: '1px solid var(--border-default)',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <History size={18} color="var(--text-secondary)" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  最近挑戰歷程 (P14-GAM-012 對局軌跡)
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {playHistory.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-base)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.gameId === 'quiz-rush' ? 'Quiz Rush 快答' : item.gameId}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                        第 {item.levelId} 關
                      </span>
                      {item.isNewHighScore && (
                        <span className="badge badge-gold" style={{ fontSize: '11px' }}>
                          新紀錄!
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <span style={{ color: 'var(--color-brand-gold-text)', fontWeight: 600 }}>
                        ★ {item.stars} 顆星 ({item.score} 分)
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filter Controls (P14-GAM-001) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginBottom: '24px',
              padding: '16px 20px',
              backgroundColor: 'var(--surface-sunken)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              {/* Keyword Search Input */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--surface-base)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  flex: '1 1 280px',
                  maxWidth: '460px',
                  position: 'relative',
                }}
              >
                <Search size={18} color="var(--text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="搜尋遊戲名稱、技術關鍵字 (例：Flexbox, 題庫, 拼圖)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    width: '100%',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                  }}
                  aria-label="搜尋遊戲"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-muted)',
                    }}
                    title="清除關鍵字"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Match Counter */}
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={14} />
                <span>顯示 {filteredGames.length} / {gamesList.length} 款遊戲</span>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              {categoryTabs.map((tab) => {
                const isActive = selectedCategory === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedCategory(tab.key)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: isActive ? 600 : 500,
                      borderRadius: '20px',
                      border: isActive ? '1px solid var(--color-brand-gold)' : '1px solid var(--border-default)',
                      backgroundColor: isActive ? 'rgba(189, 167, 126, 0.15)' : 'var(--surface-base)',
                      color: isActive ? 'var(--color-brand-gold)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        backgroundColor: isActive ? 'var(--color-brand-gold)' : 'var(--surface-sunken)',
                        color: isActive ? '#fff' : 'var(--text-muted)',
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5 Games Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredGames.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '48px 24px',
                  backgroundColor: 'var(--surface-sunken)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-default)',
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  查無符合條件的遊戲
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  試著調整搜尋關鍵字或選擇不同的技術分類
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                  }}
                  className="btn btn-outline btn-sm"
                >
                  重設搜尋條件
                </button>
              </div>
            ) : (
              filteredGames.map((game) => {
              const isAvailable = game.status === 'AVAILABLE';

              return (
                <div
                  key={game.id}
                  className="interactive-card stagger-item"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderRadius: 'var(--radius-md)',
                    border: isAvailable ? '2px solid var(--color-brand-gold)' : '1px solid var(--border-default)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isAvailable ? '0 4px 16px rgba(189, 167, 126, 0.15)' : 'none',
                    position: 'relative',
                  }}
                >
                  {/* Card Header */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--surface-base)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border-default)',
                        }}
                      >
                        {game.icon}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          className={`badge ${isAvailable ? 'badge-gold' : 'badge-neutral'}`}
                          style={{ marginBottom: '4px', display: 'inline-block' }}
                        >
                          {game.statusText}
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{game.uid}</div>
                      </div>
                    </div>

                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                      {game.title}
                    </h2>
                    <div style={{ fontSize: '12px', color: 'var(--color-brand-gold-text)', fontWeight: 600, marginBottom: '8px' }}>
                      {game.tag}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                      {game.description}
                    </p>
                  </div>

                  {/* Card Footer / Stats */}
                  <div>
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--surface-base)',
                        border: '1px solid var(--border-subtle)',
                        marginBottom: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>通關進度</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {game.completedLevels} / {game.levelsCount} 關
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>累積星星 / 分數</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-gold-text)' }}>
                          ★ {game.stars} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({game.score}分)</span>
                        </div>
                      </div>
                    </div>

                    {isAvailable ? (
                      <a
                        href={game.actionHash}
                        className="btn btn-primary btn-nowrap"
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          textDecoration: 'none',
                        }}
                      >
                        <span>進入遊戲挑戰</span>
                        <ArrowRight size={16} />
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-nowrap"
                        disabled
                        style={{
                          width: '100%',
                          opacity: 0.6,
                          cursor: 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>即將在後續批次解鎖</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
      </main>

      {/* Trophies & Badges Modal */}
      <GameAchievementsModal
        isOpen={isAchievementsModalOpen}
        onClose={() => {
          setIsAchievementsModalOpen(false);
          setAchievements(getDetailedAchievements(userId));
        }}
        userId={userId}
      />

      <Footer />
    </div>
  );
};
