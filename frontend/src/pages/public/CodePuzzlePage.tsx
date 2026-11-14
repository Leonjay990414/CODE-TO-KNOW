import React, { useState, useEffect } from 'react';
import {
  Puzzle,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  CheckCircle2,
  Lightbulb,
  Star,
  Trophy,
  ArrowRight,
  Code2,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { GameBriefingModal } from '../../components/GameBriefingModal';
import { GAME_BRIEFING_CONFIGS } from '../../data/gameBriefingConfigs';
import {
  CODE_PUZZLE_LEVELS,
  CodePuzzleLevel,
  PuzzleBlock,
} from '../../data/codePuzzleData';
import {
  getUserGameRecord,
  saveLevelCompletion,
  UserGameRecord,
} from '../../utils/gameStorage';

interface CodePuzzlePageProps {
  onOpenTeacherApply?: () => void;
}

export const CodePuzzlePage: React.FC<CodePuzzlePageProps> = ({ onOpenTeacherApply }) => {
  const { user, openAuth } = useAuth();
  const { goToHome, goToStudentDashboard } = useNavigation();

  const userId = user?.id || 'guest-anonymous';
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [gameRecord, setGameRecord] = useState<UserGameRecord>(() =>
    getUserGameRecord(userId, 'code-puzzle')
  );

  const currentLevel: CodePuzzleLevel =
    CODE_PUZZLE_LEVELS.find((l) => l.levelId === selectedLevelId) || CODE_PUZZLE_LEVELS[0];

  // Working state for active level
  const [userBlocks, setUserBlocks] = useState<PuzzleBlock[]>(() => [...currentLevel.blocks]);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [validationResult, setValidationResult] = useState<{
    tested: boolean;
    isCorrect: boolean;
    starsEarned: number;
    scoreEarned: number;
    message: string;
  }>({
    tested: false,
    isCorrect: false,
    starsEarned: 0,
    scoreEarned: 0,
    message: '',
  });

  // Sync state when level changes
  useEffect(() => {
    setUserBlocks([...currentLevel.blocks]);
    setHintsRevealed(0);
    setValidationResult({
      tested: false,
      isCorrect: false,
      starsEarned: 0,
      scoreEarned: 0,
      message: '',
    });
  }, [currentLevel.levelId]);

  // Sync storage when user changes
  useEffect(() => {
    setGameRecord(getUserGameRecord(userId, 'code-puzzle'));
  }, [userId]);

  // Reordering handlers
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setUserBlocks((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
    setValidationResult((prev) => ({ ...prev, tested: false }));
  };

  const handleMoveDown = (index: number) => {
    if (index === userBlocks.length - 1) return;
    setUserBlocks((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
    setValidationResult((prev) => ({ ...prev, tested: false }));
  };

  const handleReset = () => {
    setUserBlocks([...currentLevel.blocks]);
    setValidationResult({
      tested: false,
      isCorrect: false,
      starsEarned: 0,
      scoreEarned: 0,
      message: '',
    });
  };

  const handleUnlockHint = () => {
    if (hintsRevealed < currentLevel.hints.length) {
      setHintsRevealed((prev) => prev + 1);
    }
  };

  const handleValidate = () => {
    const currentOrderIds = userBlocks.map((b) => b.id);
    const correctOrder = currentLevel.correctOrder;

    const isMatch =
      (currentOrderIds.length === correctOrder.length &&
        currentOrderIds.every((id, idx) => id === correctOrder[idx])) ||
      (currentLevel.acceptableOrders &&
        currentLevel.acceptableOrders.some(
          (alt) =>
            currentOrderIds.length === alt.length &&
            currentOrderIds.every((id, idx) => id === alt[idx])
        ));

    if (isMatch) {
      let stars = 3;
      if (hintsRevealed === 1) stars = 2;
      else if (hintsRevealed >= 2) stars = 1;

      const score = 100 + stars * 50;

      // Save to local storage
      const updatedRecord = saveLevelCompletion(
        userId,
        'code-puzzle',
        currentLevel.levelId,
        stars,
        score,
        hintsRevealed
      );
      setGameRecord(updatedRecord);

      setValidationResult({
        tested: true,
        isCorrect: true,
        starsEarned: stars,
        scoreEarned: score,
        message: '太棒了！程式碼語意結構排列完全正確！',
      });
    } else {
      setValidationResult({
        tested: true,
        isCorrect: false,
        starsEarned: 0,
        scoreEarned: 0,
        message: '排序尚未完全符合語意規範，請仔細檢查開閉標籤對應或邏輯前後關係。',
      });
    }
  };

  const handleNextLevel = () => {
    const nextLevel = CODE_PUZZLE_LEVELS.find((l) => l.levelId === currentLevel.levelId + 1);
    if (nextLevel) {
      setSelectedLevelId(nextLevel.levelId);
    } else {
      window.location.hash = '#games';
    }
  };

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
              <a href="#games" onClick={(e) => { e.preventDefault(); window.location.hash = '#games'; }}>遊戲中心</a>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Code Puzzle (程式邏輯拼圖)</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <Puzzle size={28} color="var(--color-brand-gold)" />
                  <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Code Puzzle｜程式邏輯拼圖
                  </h1>
                  <span className="badge badge-gold">P14-GAM-004</span>
                  <button
                    onClick={() => setIsBriefingOpen(true)}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#FEF3C7',
                      border: '1px solid #FCD34D',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#92400E',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <HelpCircle size={14} />
                    <span>玩法與計分說明</span>
                  </button>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  重組打亂的程式區塊，鍛鍊標準 HTML5 語意架構、CSS 樣式排版與 JS 執行順序。
                </p>
              </div>

              {/* Progress Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  backgroundColor: 'var(--surface-sunken)',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={18} color="var(--color-brand-gold)" fill="var(--color-brand-gold)" />
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>
                    {gameRecord.totalStars} 顆星
                  </span>
                </div>
                <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-default)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trophy size={18} color="#2563EB" />
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>
                    {gameRecord.totalScore} 分
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Level Selector Tabs */}
        <div className="container" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {CODE_PUZZLE_LEVELS.map((level) => {
              const record = gameRecord.levels[level.levelId];
              const isSelected = level.levelId === currentLevel.levelId;

              return (
                <button
                  key={level.levelId}
                  type="button"
                  onClick={() => setSelectedLevelId(level.levelId)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--color-brand-gold)' : '1px solid var(--border-default)',
                    backgroundColor: isSelected ? 'rgba(189, 167, 126, 0.12)' : 'var(--surface-sunken)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: isSelected ? 'var(--color-brand-gold)' : 'var(--border-default)',
                      color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {level.levelId}
                  </span>
                  <span>{level.title}</span>
                  {record?.completed && (
                    <span style={{ color: 'var(--color-brand-gold)', fontSize: '13px' }}>
                      {'★'.repeat(record.stars)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Level Header / Objective Box */}
          <div
            style={{
              padding: '20px',
              backgroundColor: 'var(--surface-sunken)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span className="badge badge-gold">第 {currentLevel.levelId} 關</span>
                  <span className="badge badge-neutral">{currentLevel.category}</span>
                  <span className="badge badge-neutral">難度：{currentLevel.difficulty}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    預估時間：{currentLevel.estimatedMinutes} 分鐘
                  </span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  {currentLevel.title}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
                  {currentLevel.description}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--color-brand-gold)', margin: 0, fontWeight: 600 }}>
                  任務指引：{currentLevel.instructions}
                </p>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleUnlockHint}
                  disabled={hintsRevealed >= currentLevel.hints.length}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Lightbulb size={16} color="var(--color-brand-gold)" />
                  <span>
                    提示 ({hintsRevealed}/{currentLevel.hints.length})
                  </span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleReset}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RotateCcw size={16} />
                  <span>重置順序</span>
                </button>
              </div>
            </div>

            {/* Hint Box (if any hint unlocked) */}
            {hintsRevealed > 0 && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px 18px',
                  backgroundColor: 'rgba(189, 167, 126, 0.08)',
                  border: '1px solid rgba(189, 167, 126, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={16} color="var(--color-brand-gold)" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    思考引導提示（使用提示將稍微影響獲得星星數）：
                  </span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {currentLevel.hints.slice(0, hintsRevealed).map((hint, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      {hint}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Interactive Reordering Board */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: validationResult.tested && validationResult.isCorrect ? '1fr 1fr' : '1fr',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            {/* Left Column: Puzzle Blocks Workspace */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  當前排列順序 (點擊按鈕調整上下順序)：
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  共 {userBlocks.length} 個區塊
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userBlocks.map((block, index) => {
                  return (
                    <div
                      key={block.id}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: 'var(--surface-sunken)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, overflow: 'hidden' }}>
                        {/* Line number badge */}
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--surface-base)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            flexShrink: 0,
                          }}
                        >
                          {index + 1}
                        </div>

                        {/* Monospace Code Content */}
                        <pre
                          style={{
                            margin: 0,
                            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                            fontSize: '13px',
                            lineHeight: 1.5,
                            color: 'var(--text-primary)',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            flex: 1,
                          }}
                        >
                          {block.content}
                        </pre>
                      </div>

                      {/* Reordering Controls */}
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          title="上移此行"
                          style={{ padding: '6px 10px', minWidth: '36px' }}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === userBlocks.length - 1}
                          title="下移此行"
                          style={{ padding: '6px 10px', minWidth: '36px' }}
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Validation Result Alert */}
              {validationResult.tested && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: validationResult.isCorrect ? '#ECFDF5' : '#FFF1F2',
                    border: `1px solid ${validationResult.isCorrect ? '#A7F3D0' : '#FECDD3'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  {validationResult.isCorrect ? (
                    <CheckCircle2 size={24} color="#059669" style={{ flexShrink: 0 }} />
                  ) : (
                    <AlertCircle size={24} color="#E11D48" style={{ flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: validationResult.isCorrect ? '#065F46' : '#9F1239',
                        marginBottom: '4px',
                      }}
                    >
                      {validationResult.message}
                    </div>
                    {validationResult.isCorrect ? (
                      <div style={{ fontSize: '13px', color: '#047857' }}>
                        <div>
                          <strong>本次通關表現：</strong>
                          獲得評級：{'★'.repeat(validationResult.starsEarned)} ({validationResult.starsEarned} 顆星)｜積分獎勵：+{validationResult.scoreEarned} 分
                        </div>
                        {gameRecord.levels[currentLevel.levelId] && (
                          <div style={{ marginTop: '4px', fontSize: '12px', color: '#065F46' }}>
                            <strong>歷史最佳紀錄：</strong>
                            最高得分 {gameRecord.levels[currentLevel.levelId].highScore} 分｜最佳星級 {'★'.repeat(gameRecord.levels[currentLevel.levelId].stars)} ({gameRecord.levels[currentLevel.levelId].stars} 顆星)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#BE123C' }}>
                        請檢查是否漏掉外層標籤或先後呼叫順序。若卡關可點選右上角「提示」按鈕。
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit / Next Button Toolbar */}
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleValidate}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '15px' }}
                >
                  <CheckCircle2 size={18} />
                  <span>提交驗證排序</span>
                </button>

                {validationResult.tested && validationResult.isCorrect && (
                  <button
                    type="button"
                    className="btn btn-gold"
                    onClick={handleNextLevel}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '15px' }}
                  >
                    <span>
                      {currentLevel.levelId < CODE_PUZZLE_LEVELS.length ? '挑戰下一關' : '返回遊戲中心'}
                    </span>
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Code Explanation & Target Reference (Shown upon success) */}
            {validationResult.tested && validationResult.isCorrect && (
              <div
                style={{
                  padding: '24px',
                  backgroundColor: 'var(--surface-sunken)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Code2 size={20} color="var(--color-brand-gold)" />
                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    通關語法解析與規範回顧
                  </h3>
                </div>

                <div style={{ marginBottom: '16px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {currentLevel.explanation}
                </div>

                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  標準程式碼參考：
                </div>
                <div
                  style={{
                    backgroundColor: '#1E293B',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    overflowX: 'auto',
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: '12.5px',
                      lineHeight: 1.5,
                      color: '#E2E8F0',
                    }}
                  >
                    {currentLevel.targetCode}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <GameBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        config={GAME_BRIEFING_CONFIGS['code-puzzle']}
      />

      <Footer />
    </div>
  );
};
