import React, { useState, useEffect } from 'react';
import {
  Bug,
  RotateCcw,
  CheckCircle2,
  Lightbulb,
  Star,
  Trophy,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Check,
  ShieldCheck,
  Edit3,
  HelpCircle,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { GameBriefingModal } from '../../components/GameBriefingModal';
import { GAME_BRIEFING_CONFIGS } from '../../data/gameBriefingConfigs';
import {
  BUG_HUNTER_LEVELS,
  BugHunterLevel,
  BuggyLineInfo,
} from '../../data/bugHunterData';
import {
  getUserGameRecord,
  saveLevelCompletion,
  UserGameRecord,
} from '../../utils/gameStorage';

interface BugHunterPageProps {
  onOpenTeacherApply?: () => void;
}

export const BugHunterPage: React.FC<BugHunterPageProps> = ({ onOpenTeacherApply }) => {
  const { user, openAuth } = useAuth();
  const { goToHome, goToStudentDashboard } = useNavigation();

  const userId = user?.id || 'guest-anonymous';
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [gameRecord, setGameRecord] = useState<UserGameRecord>(() =>
    getUserGameRecord(userId, 'bug-hunter')
  );

  const currentLevel: BugHunterLevel =
    BUG_HUNTER_LEVELS.find((l) => l.levelId === selectedLevelId) || BUG_HUNTER_LEVELS[0];

  // Working state for active level
  // workingCodeLines: array of current code lines
  const [workingLines, setWorkingLines] = useState<string[]>(() =>
    currentLevel.initialCode.split('\n')
  );
  // selectedLineIndex: 0-indexed line selected for inspection
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  // resolvedBugs: set of line numbers that have been fixed
  const [resolvedBugs, setResolvedBugs] = useState<Record<number, boolean>>({});
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);

  // Mode: 'line-select' or 'code-edit'
  const [interactiveMode, setInteractiveMode] = useState<'line-select' | 'code-edit'>('line-select');
  const [editorText, setEditorText] = useState<string>(currentLevel.initialCode);

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
    setWorkingLines(currentLevel.initialCode.split('\n'));
    setSelectedLineIndex(null);
    setResolvedBugs({});
    setEditorText(currentLevel.initialCode);
    setHintsRevealed(0);
    setValidationResult({
      tested: false,
      isCorrect: false,
      starsEarned: 0,
      scoreEarned: 0,
      message: '',
    });
  }, [currentLevel.levelId]);

  // Sync storage on user switch
  useEffect(() => {
    setGameRecord(getUserGameRecord(userId, 'bug-hunter'));
  }, [userId]);

  const handleLineClick = (idx: number) => {
    setSelectedLineIndex(idx);
    setValidationResult((prev) => ({ ...prev, tested: false }));
  };

  const handleApplyFix = (bugInfo: BuggyLineInfo, fixReplacement: string, isCorrect: boolean) => {
    if (!isCorrect) {
      setValidationResult({
        tested: true,
        isCorrect: false,
        starsEarned: 0,
        scoreEarned: 0,
        message: '此選項無法徹底修復該行的語法問題，請再試試其他方案。',
      });
      return;
    }

    // Apply the fix to workingLines (lineNum is 1-indexed)
    setWorkingLines((prev) => {
      const next = [...prev];
      next[bugInfo.lineNum - 1] = fixReplacement;
      return next;
    });

    setEditorText((prev) => {
      const lines = prev.split('\n');
      lines[bugInfo.lineNum - 1] = fixReplacement;
      return lines.join('\n');
    });

    setResolvedBugs((prev) => ({
      ...prev,
      [bugInfo.lineNum]: true,
    }));

    setValidationResult((prev) => ({ ...prev, tested: false }));
  };

  const handleReset = () => {
    setWorkingLines(currentLevel.initialCode.split('\n'));
    setSelectedLineIndex(null);
    setResolvedBugs({});
    setEditorText(currentLevel.initialCode);
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
    // If in editorText mode, sync with workingLines first
    let currentCodeLines = workingLines;
    if (interactiveMode === 'code-edit') {
      currentCodeLines = editorText.split('\n');
    }

    // Validate that every buggy line in currentLevel has been correctly modified
    const errors: string[] = [];

    currentLevel.buggyLines.forEach((b) => {
      const actualLine = (currentCodeLines[b.lineNum - 1] || '').trim();
      const expectedNormalized = b.expectedText.trim();

      // Check if actual line matches expected text or contains the fix
      // Also check if fixOptions that are correct match
      const correctReplacements = b.fixOptions
        .filter((opt) => opt.isCorrect)
        .map((opt) => opt.replacement.trim());
      correctReplacements.push(expectedNormalized);

      const isResolved = correctReplacements.some(
        (exp) => actualLine === exp || actualLine.replace(/\s+/g, ' ') === exp.replace(/\s+/g, ' ')
      );

      if (!isResolved) {
        errors.push(`第 ${b.lineNum} 行的「${b.bugType}」尚未修正`);
      }
    });

    if (errors.length === 0) {
      let stars = 3;
      if (hintsRevealed === 1) stars = 2;
      else if (hintsRevealed >= 2) stars = 1;

      const score = 100 + stars * 50;

      // Save to game storage
      const updatedRecord = saveLevelCompletion(
        userId,
        'bug-hunter',
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
        message: '太棒了！所有程式語法與邏輯漏洞已全數修復！',
      });
    } else {
      setValidationResult({
        tested: true,
        isCorrect: false,
        starsEarned: 0,
        scoreEarned: 0,
        message: `尚有 ${errors.length} 處錯誤未修復：${errors.join('、')}。`,
      });
    }
  };

  const handleNextLevel = () => {
    const nextLevel = BUG_HUNTER_LEVELS.find((l) => l.levelId === currentLevel.levelId + 1);
    if (nextLevel) {
      setSelectedLevelId(nextLevel.levelId);
    } else {
      window.location.hash = '#games';
    }
  };

  // Check if selected line has a bug
  const selectedLineNumber = selectedLineIndex !== null ? selectedLineIndex + 1 : null;
  const currentBugInfo = currentLevel.buggyLines.find((b) => b.lineNum === selectedLineNumber);
  const totalBugsInLevel = currentLevel.buggyLines.length;
  const resolvedBugsCount = Object.keys(resolvedBugs).length;

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
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Bug Hunter (程式除錯獵人)</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <Bug size={28} color="#E11D48" />
                  <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Bug Hunter｜程式除錯獵人
                  </h1>
                  <span className="badge badge-gold">P14-GAM-006</span>
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
                  火眼金睛揪出考場常見失分陷阱！排查未閉合標籤、非法 CSS 與 JS 大小寫邏輯漏洞。
                </p>
              </div>

              {/* Progress Summary Pill */}
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
                  <Trophy size={18} color="#E11D48" />
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
            {BUG_HUNTER_LEVELS.map((level) => {
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
                    border: isSelected ? '2px solid #E11D48' : '1px solid var(--border-default)',
                    backgroundColor: isSelected ? 'rgba(225, 29, 72, 0.08)' : 'var(--surface-sunken)',
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
                      backgroundColor: isSelected ? '#E11D48' : 'var(--border-default)',
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
                  <span className="badge badge-gold" style={{ backgroundColor: '#FFE4E6', color: '#BE123C' }}>
                    共潛伏 {totalBugsInLevel} 個 Bug (已排查：{resolvedBugsCount}/{totalBugsInLevel})
                  </span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  {currentLevel.title}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
                  {currentLevel.description}
                </p>
                <p style={{ fontSize: '13px', color: '#E11D48', margin: 0, fontWeight: 600 }}>
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
                  <Lightbulb size={16} color="#E11D48" />
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
                  <span>重置代碼</span>
                </button>
              </div>
            </div>

            {/* Hint Box (if any hint unlocked) */}
            {hintsRevealed > 0 && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px 18px',
                  backgroundColor: 'rgba(225, 29, 72, 0.08)',
                  border: '1px solid rgba(225, 29, 72, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={16} color="#E11D48" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    除錯線索提示（使用提示將影響該關星級）：
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

          {/* Interactive Mode Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${interactiveMode === 'line-select' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setInteractiveMode('line-select')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: interactiveMode === 'line-select' ? '#E11D48' : undefined,
                  borderColor: interactiveMode === 'line-select' ? '#E11D48' : undefined,
                }}
              >
                <CheckCircle2 size={16} />
                <span>模式一：點選行號排查 (推薦)</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${interactiveMode === 'code-edit' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setInteractiveMode('code-edit')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: interactiveMode === 'code-edit' ? '#E11D48' : undefined,
                  borderColor: interactiveMode === 'code-edit' ? '#E11D48' : undefined,
                }}
              >
                <Edit3 size={16} />
                <span>模式二：受控編輯區手動改寫</span>
              </button>
            </div>

            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              點擊程式行可鎖定問題行；點擊下方提交按鈕驗證修復結果
            </span>
          </div>

          {/* Workspace Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            {/* Left Column: Code Viewer / Editor */}
            <div
              style={{
                backgroundColor: 'var(--surface-sunken)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  代碼靶場檢視區 (點擊行號即可檢查)：
                </span>
                <span style={{ fontSize: '12px', color: '#E11D48', fontWeight: 600 }}>
                  {interactiveMode === 'line-select' ? '點選模式' : '編輯模式'}
                </span>
              </div>

              {interactiveMode === 'line-select' ? (
                <div
                  style={{
                    backgroundColor: '#0F172A',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: '1px solid #334155',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {workingLines.map((lineText, idx) => {
                      const lineNum = idx + 1;
                      const isSelected = selectedLineIndex === idx;
                      const isKnownBuggy = currentLevel.buggyLines.some((b) => b.lineNum === lineNum);
                      const isFixed = resolvedBugs[lineNum];

                      return (
                        <div
                          key={idx}
                          onClick={() => handleLineClick(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px 12px',
                            backgroundColor: isSelected
                              ? 'rgba(225, 29, 72, 0.25)'
                              : isFixed
                              ? 'rgba(16, 185, 129, 0.1)'
                              : idx % 2 === 0
                              ? '#0F172A'
                              : '#1E293B',
                            cursor: 'pointer',
                            borderLeft: isSelected
                              ? '4px solid #E11D48'
                              : isFixed
                              ? '4px solid #10B981'
                              : '4px solid transparent',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {/* Line Number */}
                          <span
                            style={{
                              width: '32px',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              color: isSelected ? '#FDA4AF' : '#64748B',
                              textAlign: 'right',
                              paddingRight: '12px',
                              userSelect: 'none',
                              flexShrink: 0,
                            }}
                          >
                            {lineNum}
                          </span>

                          {/* Code Content */}
                          <pre
                            style={{
                              margin: 0,
                              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                              fontSize: '13px',
                              lineHeight: 1.5,
                              color: isFixed ? '#6EE7B7' : '#F1F5F9',
                              whiteSpace: 'pre',
                              overflowX: 'auto',
                              flex: 1,
                            }}
                          >
                            {lineText}
                          </pre>

                          {/* Status Icon Indicator */}
                          {isFixed && (
                            <Check size={16} color="#10B981" style={{ marginLeft: '8px', flexShrink: 0 }} />
                          )}
                          {!isFixed && isKnownBuggy && isSelected && (
                            <Bug size={16} color="#FB7185" style={{ marginLeft: '8px', flexShrink: 0 }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <textarea
                    value={editorText}
                    onChange={(e) => {
                      setEditorText(e.target.value);
                      setValidationResult((prev) => ({ ...prev, tested: false }));
                    }}
                    rows={12}
                    style={{
                      width: '100%',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      backgroundColor: '#0F172A',
                      color: '#F1F5F9',
                      padding: '14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #334155',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    在受控文字區中直接修改程式碼，完成後點擊下方「提交除錯驗證」。
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleValidate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    fontSize: '15px',
                    backgroundColor: '#E11D48',
                    borderColor: '#E11D48',
                  }}
                >
                  <ShieldCheck size={18} />
                  <span>提交除錯驗證</span>
                </button>

                {validationResult.tested && validationResult.isCorrect && (
                  <button
                    type="button"
                    className="btn btn-gold"
                    onClick={handleNextLevel}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '15px' }}
                  >
                    <span>
                      {currentLevel.levelId < BUG_HUNTER_LEVELS.length ? '挑戰下一關' : '返回遊戲中心'}
                    </span>
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Line Diagnostics & Fix Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Inspection Box */}
              <div
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Bug size={20} color="#E11D48" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    行號診斷與修正工具 (Inspector)
                  </h3>
                </div>

                {selectedLineNumber === null ? (
                  <div
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      backgroundColor: 'var(--surface-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px dashed var(--border-default)',
                    }}
                  >
                    請在左側點選任一行程式碼，系統將立即為您診斷該行是否潛藏語法問題。
                  </div>
                ) : currentBugInfo ? (
                  <div>
                    {/* Bug Detected Banner */}
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: '#FFE4E6',
                        border: '1px solid #FECDD3',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9F1239', fontWeight: 700, fontSize: '14px' }}>
                        <AlertCircle size={16} />
                        <span>第 {selectedLineNumber} 行發現漏洞：{currentBugInfo.bugType}</span>
                      </div>
                      <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: '#BE123C', lineHeight: 1.5 }}>
                        {currentBugInfo.hint}
                      </p>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      請選擇正確的修復方式：
                    </div>

                    {/* Options list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {currentBugInfo.fixOptions.map((opt) => {
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleApplyFix(currentBugInfo, opt.replacement, opt.isCorrect)}
                            style={{
                              padding: '12px',
                              textAlign: 'left',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-default)',
                              backgroundColor: 'var(--surface-base)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <code
                              style={{
                                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                fontSize: '12.5px',
                                color: '#2563EB',
                                fontWeight: 700,
                              }}
                            >
                              {opt.label.trim()}
                            </code>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {opt.explanation}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '18px',
                      backgroundColor: 'var(--surface-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <CheckCircle2 size={20} color="#10B981" />
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      第 {selectedLineNumber} 行語法結構健全，未發現明顯語意錯誤。請繼續排查其他行號！
                    </div>
                  </div>
                )}
              </div>

              {/* Validation Result Alert */}
              {validationResult.tested && (
                <div
                  style={{
                    padding: '16px 20px',
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
                          <strong>本次獵蟲表現：</strong>
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
                        提示：請檢查標籤是否對稱閉合、屬性名是否拼對、或大小寫是否相符。
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed Post-Completion Explanation Card */}
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
                    <Sparkles size={20} color="#E11D48" />
                    <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      除錯復盤與知識點教學
                    </h3>
                  </div>

                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    {currentLevel.explanation.overview}
                  </p>

                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    排查出的漏洞清單：
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    {currentLevel.explanation.bugsAnalyzed.map((b, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: '12.5px',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--surface-base)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#E11D48', marginBottom: '2px' }}>
                          第 {b.line} 行：{b.error}
                        </div>
                        <div style={{ color: '#059669', marginBottom: '4px' }}>
                          ➜ 正確修正：<code>{b.fix}</code>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                          原理解析：{b.why}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: '#92400E', backgroundColor: '#FEF3C7', padding: '10px 14px', borderRadius: '4px', marginBottom: '10px' }}>
                    <strong>考場奪分秘笈：</strong>{currentLevel.explanation.examTips}
                  </div>

                  <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                    <strong>業界最佳實務：</strong>{currentLevel.explanation.bestPractices}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <GameBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        config={GAME_BRIEFING_CONFIGS['bug-hunter']}
      />

      <Footer />
    </div>
  );
};
