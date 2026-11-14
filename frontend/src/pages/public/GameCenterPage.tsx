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
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { getOverallGameStats, getUserGameRecord } from '../../utils/gameStorage';
import { GameAchievementsModal } from '../../components/GameAchievementsModal';
import { getDetailedAchievements } from '../../utils/gameAchievementEngine';

interface GameCenterPageProps {
  onOpenTeacherApply?: () => void;
}

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

  useEffect(() => {
    setStats(getOverallGameStats(userId));
    setAchievements(getDetailedAchievements(userId));
    setPuzzleRecord(getUserGameRecord(userId, 'code-puzzle'));
    setCssRecord(getUserGameRecord(userId, 'css-designer'));
    setBugRecord(getUserGameRecord(userId, 'bug-hunter'));
    setQuizRecord(getUserGameRecord(userId, 'quiz-rush'));
    setWebBuilderRecord(getUserGameRecord(userId, 'web-builder'));
  }, [userId]);

  const gamesList = [
    {
      id: 'code-puzzle',
      uid: 'P14-GAM-004',
      title: 'Code Puzzle (程式邏輯拼圖)',
      subtitle: '重組程式碼語意結構，鍛鍊階層思維與標準語法順序',
      icon: <Puzzle size={28} color="var(--color-brand-gold)" />,
      status: 'AVAILABLE',
      statusText: '已開放遊玩',
      tag: 'HTML5 / CSS / JS',
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
      levelsCount: 4,
      completedLevels: webBuilderRecord.completedLevelsCount,
      stars: webBuilderRecord.totalStars,
      score: webBuilderRecord.totalScore,
      actionHash: '#games/web-builder',
      description: '將文件宣告、地標（header/nav/main/footer）與圖文區塊積木拼裝成現代標準網頁，培養全域架構視野。',
    },
  ];

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
              marginBottom: '28px',
            }}
          >
            <Sparkles size={24} color="var(--color-brand-gold)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
              <strong>碼上學 遊戲化學習準則：</strong>遊戲是思維訓練的催化劑，絕非盲目盲猜。每款遊戲均針對「網頁設計丙級」核心技能研發，包含階層排序、排版直覺、除錯敏銳度與知識反應。每關皆提供漸進式思考提示與通關深度解析，輔助您獨立掌握技術本質。
            </div>
          </div>

          {/* 5 Games Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {gamesList.map((game) => {
              const isAvailable = game.status === 'AVAILABLE';

              return (
                <div
                  key={game.id}
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
                    <div style={{ fontSize: '12px', color: 'var(--color-brand-gold)', fontWeight: 600, marginBottom: '8px' }}>
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
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-gold)' }}>
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
            })}
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
