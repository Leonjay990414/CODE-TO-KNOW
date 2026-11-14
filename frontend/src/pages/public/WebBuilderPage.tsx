import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Star,
  Trophy,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Lightbulb,
  Info,
  Layers,
  Eye,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { GameBriefingModal } from '../../components/GameBriefingModal';
import { GAME_BRIEFING_CONFIGS } from '../../data/gameBriefingConfigs';
import {
  WEB_BUILDER_LEVELS,
  WEB_BUILDER_BLOCKS,
  WebBlock,
  WebBuilderLevel,
} from '../../data/webBuilderData';
import {
  getUserGameRecord,
  saveLevelCompletion,
  UserGameRecord,
} from '../../utils/gameStorage';

export const WebBuilderPage: React.FC = () => {
  const { user } = useAuth();
  const { goToGameCenter } = useNavigation();
  const userId = user?.id || 'anonymous';

  // State
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const currentLevel: WebBuilderLevel = WEB_BUILDER_LEVELS[currentLevelIndex];

  const [activeBlocks, setActiveBlocks] = useState<WebBlock[]>([]);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [isBriefingOpen, setIsBriefingOpen] = useState<boolean>(false);
  const [userGameRecord, setUserGameRecord] = useState<UserGameRecord | null>(null);

  // Completion modal state
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [earnedStars, setEarnedStars] = useState<number>(0);
  const [earnedScore, setEarnedScore] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load record on mount / account change
  useEffect(() => {
    const record = getUserGameRecord(userId, 'web-builder');
    setUserGameRecord(record);
  }, [userId]);

  // Load level initial state
  useEffect(() => {
    const initialBlocks = currentLevel.starterBlockIds
      .map((id) => WEB_BUILDER_BLOCKS[id])
      .filter((b): b is WebBlock => !!b);
    setActiveBlocks(initialBlocks);
    setRevealedHints(0);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setIsCompleted(false);
    setValidationError(null);
  }, [currentLevelIndex]);

  // Wall-clock safe timer
  useEffect(() => {
    if (!isTimerRunning || isCompleted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isCompleted]);

  // Operations: Move Up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...activeBlocks];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setActiveBlocks(next);
    setValidationError(null);
  };

  // Operations: Move Down
  const handleMoveDown = (index: number) => {
    if (index >= activeBlocks.length - 1) return;
    const next = [...activeBlocks];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setActiveBlocks(next);
    setValidationError(null);
  };

  // Operations: Remove
  const handleRemove = (index: number) => {
    const next = activeBlocks.filter((_, idx) => idx !== index);
    setActiveBlocks(next);
    setValidationError(null);
  };

  // Operations: Add
  const handleAddBlock = (block: WebBlock) => {
    if (activeBlocks.length >= 10) {
      setValidationError('畫布最多容納 10 個積木，請先移除不需要的元素。');
      return;
    }
    setActiveBlocks([...activeBlocks, block]);
    setValidationError(null);
  };

  // Operations: Reset
  const handleResetLevel = () => {
    const initialBlocks = currentLevel.starterBlockIds
      .map((id) => WEB_BUILDER_BLOCKS[id])
      .filter((b): b is WebBlock => !!b);
    setActiveBlocks(initialBlocks);
    setValidationError(null);
  };

  // Hints
  const handleRevealHint = () => {
    if (revealedHints < currentLevel.hints.length) {
      setRevealedHints((prev) => prev + 1);
    }
  };

  // Validation & Completion
  const handleValidateStructure = () => {
    const currentSequence = activeBlocks.map((b) => b.id);
    const targetSequence = currentLevel.targetBlockSequence;

    if (currentSequence.length !== targetSequence.length) {
      setValidationError(
        `目前積木數量（${currentSequence.length}）與目標架構數量（${targetSequence.length}）不符，請核對是否缺少或有多餘積木。`
      );
      return;
    }

    let isMatch = true;
    for (let i = 0; i < targetSequence.length; i++) {
      if (currentSequence[i] !== targetSequence[i]) {
        isMatch = false;
        break;
      }
    }

    if (!isMatch) {
      setValidationError(
        '目前排列順序與標準語意化架構不同，請參考目標階層提示重新調整上下順序。'
      );
      return;
    }

    // Pass! Calculate score and stars
    setIsTimerRunning(false);
    let stars = 3;
    if (revealedHints === 1 || elapsedSeconds > 120) stars = 2;
    if (revealedHints >= 2 || elapsedSeconds > 240) stars = 1;

    const baseScore = 300;
    const timeBonus = Math.max(0, 100 - elapsedSeconds);
    const hintPenalty = revealedHints * 40;
    const finalScore = Math.max(100, baseScore + timeBonus - hintPenalty);

    setEarnedStars(stars);
    setEarnedScore(finalScore);
    setIsCompleted(true);
    setValidationError(null);

    // Save to isolated storage
    const updated = saveLevelCompletion(
      userId,
      'web-builder',
      currentLevel.levelNumber,
      stars,
      finalScore,
      revealedHints,
      elapsedSeconds
    );
    setUserGameRecord(updated);
  };

  // Render safe visual representation of each block
  const renderPreviewBlock = (block: WebBlock, index: number) => {
    switch (block.type) {
      case 'doctype':
        return (
          <div
            key={`${block.id}-${index}`}
            style={{
              padding: '8px 14px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#1E40AF',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{block.tag}</span>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>HTML5 标准宣告</span>
          </div>
        );
      case 'html':
        return (
          <div
            key={`${block.id}-${index}`}
            style={{
              padding: '6px 12px',
              backgroundColor: '#F8FAFC',
              border: '2px dashed #94A3B8',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#334155',
              marginBottom: '6px',
            }}
          >
            &lt;html lang="zh-Hant"&gt; [全站根邊界]
          </div>
        );
      case 'head':
        return (
          <div
            key={`${block.id}-${index}`}
            style={{
              padding: '8px 12px',
              backgroundColor: '#EEF2FF',
              border: '1px solid #C7D2FE',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#4338CA',
              marginBottom: '6px',
            }}
          >
            <strong>&lt;head&gt;</strong> {block.previewContent}
          </div>
        );
      case 'header':
        return (
          <header
            key={`${block.id}-${index}`}
            style={{
              padding: '12px 16px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '8px',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontWeight: 700, color: '#065F46', fontSize: '14px' }}>
              &lt;header&gt; 碼上學 CODE TO KNOW
            </div>
            <span style={{ fontSize: '12px', color: '#047857' }}>頁首導引區</span>
          </header>
        );
      case 'nav':
        return (
          <nav
            key={`${block.id}-${index}`}
            style={{
              padding: '8px 16px',
              backgroundColor: '#F0FDFA',
              border: '1px solid #99F6E4',
              borderRadius: '6px',
              marginBottom: '8px',
              display: 'flex',
              gap: '12px',
              fontSize: '12px',
              color: '#0F766E',
            }}
          >
            <span>&lt;nav&gt;</span>
            <span style={{ textDecoration: 'underline' }}>課程總覽</span>
            <span style={{ textDecoration: 'underline' }}>實務題庫</span>
            <span style={{ textDecoration: 'underline' }}>證照考題</span>
          </nav>
        );
      case 'main':
        return (
          <main
            key={`${block.id}-${index}`}
            style={{
              padding: '14px 16px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              marginBottom: '8px',
              color: '#92400E',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
              &lt;main&gt; 核心主要內容區
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#B45309' }}>
              {block.previewContent}
            </p>
          </main>
        );
      case 'section':
        return (
          <section
            key={`${block.id}-${index}`}
            style={{
              padding: '12px 16px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: '8px',
              marginBottom: '8px',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#78350F' }}>
              &lt;section&gt; {block.previewContent}
            </div>
          </section>
        );
      case 'h1':
        return (
          <h1
            key={`${block.id}-${index}`}
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#1E293B',
              margin: '6px 0',
              borderLeft: '4px solid #DC2626',
              paddingLeft: '8px',
            }}
          >
            {block.previewContent}
          </h1>
        );
      case 'h2':
        return (
          <h2
            key={`${block.id}-${index}`}
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#334155',
              margin: '6px 0',
              borderLeft: '3px solid #E11D48',
              paddingLeft: '8px',
            }}
          >
            {block.previewContent}
          </h2>
        );
      case 'p':
        return (
          <p
            key={`${block.id}-${index}`}
            style={{
              fontSize: '13px',
              lineHeight: 1.5,
              color: '#475569',
              margin: '6px 0',
              padding: '6px 10px',
              backgroundColor: '#F8FAFC',
              borderRadius: '4px',
            }}
          >
            {block.previewContent}
          </p>
        );
      case 'ul':
        return (
          <div
            key={`${block.id}-${index}`}
            style={{
              padding: '8px 12px',
              backgroundColor: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: '6px',
              marginBottom: '6px',
              fontSize: '12px',
              color: '#0369A1',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>&lt;ul&gt; 無序清單重點</div>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              <li>完整 605 題題庫解析</li>
              <li>五大術科題組逐步解說</li>
              <li>全真計時模擬考評分</li>
            </ul>
          </div>
        );
      case 'img':
        return (
          <div
            key={`${block.id}-${index}`}
            style={{
              padding: '12px',
              backgroundColor: '#FAF5FF',
              border: '1px dashed #D8B4FE',
              borderRadius: '6px',
              textAlign: 'center',
              marginBottom: '6px',
              color: '#6B21A8',
              fontSize: '12px',
            }}
          >
            <div>{block.previewContent}</div>
            <span
              style={{
                display: 'inline-block',
                marginTop: '4px',
                padding: '2px 8px',
                backgroundColor: '#E9D5FF',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              alt="學生使用 AI 平台自主探索" (符合無障礙)
            </span>
          </div>
        );
      case 'a':
        return (
          <div key={`${block.id}-${index}`} style={{ margin: '8px 0' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#D97706',
                color: '#FFFFFF',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              {block.previewContent}
            </span>
          </div>
        );
      case 'footer':
        return (
          <footer
            key={`${block.id}-${index}`}
            style={{
              padding: '12px 16px',
              backgroundColor: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              marginTop: '10px',
              fontSize: '12px',
              color: '#64748B',
              textAlign: 'center',
            }}
          >
            &lt;footer&gt; {block.previewContent}
          </footer>
        );
      default:
        return (
          <div
            key={`${block.id}-${index}`}
            style={{
              padding: '8px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              marginBottom: '4px',
              fontSize: '12px',
            }}
          >
            {block.label}
          </div>
        );
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F8FAFC',
      }}
    >
      <Navbar />

      <main
        style={{
          flex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px 16px 48px',
          width: '100%',
        }}
      >
        {/* Header navigation & title */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <button
                onClick={goToGameCenter}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#64748B',
                  cursor: 'pointer',
                }}
              >
                ← 返回遊戲中心
              </button>
              <button
                onClick={() => setIsBriefingOpen(true)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#1E40AF',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <HelpCircle size={13} />
                <span>玩法與計分說明</span>
              </button>
              <span
                style={{
                  padding: '3px 10px',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                HTML5 語意架構
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Web Builder｜網頁架構師
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
              透過積木組裝掌握 HTML5 語意化地標與無障礙網頁階層，告別傳統亂序標籤。
            </p>
          </div>

          {/* Stats badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '10px 16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>累計星星</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#D97706' }}>
                <Star size={16} fill="#D97706" />
                <span>{userGameRecord?.totalStars || 0} / 12</span>
              </div>
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: '#E2E8F0' }} />
            <div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>作答耗時</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Level Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          {WEB_BUILDER_LEVELS.map((lvl, idx) => {
            const isCurrent = idx === currentLevelIndex;
            const lvlStat = userGameRecord?.levels[lvl.levelNumber];
            const isPassed = !!lvlStat?.completed;

            return (
              <button
                key={lvl.id}
                onClick={() => setCurrentLevelIndex(idx)}
                style={{
                  padding: '12px 14px',
                  backgroundColor: isCurrent ? '#FFFFFF' : '#F1F5F9',
                  border: isCurrent ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  borderRadius: '10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: isCurrent ? '#2563EB' : '#475569' }}>
                    第 {lvl.levelNumber} 關
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      backgroundColor: '#E2E8F0',
                      borderRadius: '4px',
                      color: '#475569',
                    }}
                  >
                    {lvl.difficulty}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>
                  {lvl.title.replace(/^第.關：/, '')}
                </div>
                {isPassed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '6px' }}>
                    {[1, 2, 3].map((starIdx) => (
                      <Star
                        key={starIdx}
                        size={12}
                        fill={starIdx <= lvlStat.stars ? '#D97706' : 'none'}
                        color={starIdx <= lvlStat.stars ? '#D97706' : '#CBD5E1'}
                      />
                    ))}
                    <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '4px' }}>
                      {lvlStat.highScore}分
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Level Goal Card */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                {currentLevel.title}：{currentLevel.subtitle}
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                <strong>挑戰目標：</strong>{currentLevel.targetDescription}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#2563EB',
                }}
              >
                <Info size={14} />
                <span>{currentLevel.conceptSummary}</span>
              </div>
            </div>

            {/* Hint & Reset controls */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={handleRevealHint}
                disabled={revealedHints >= currentLevel.hints.length}
                style={{
                  padding: '8px 12px',
                  backgroundColor: revealedHints >= currentLevel.hints.length ? '#F1F5F9' : '#FEF3C7',
                  border: '1px solid #FCD34D',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: revealedHints >= currentLevel.hints.length ? '#94A3B8' : '#92400E',
                  cursor: revealedHints >= currentLevel.hints.length ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Lightbulb size={14} />
                <span>提示 ({revealedHints}/{currentLevel.hints.length})</span>
              </button>

              <button
                onClick={handleResetLevel}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RotateCcw size={14} />
                <span>重設</span>
              </button>
            </div>
          </div>

          {/* Render revealed hints */}
          {revealedHints > 0 && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#92400E',
              }}
            >
              {currentLevel.hints.slice(0, revealedHints).map((h, hIdx) => (
                <div key={hIdx} style={{ marginBottom: hIdx < revealedHints - 1 ? '6px' : 0 }}>
                  💡 {h}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Validation error banner */}
        {validationError && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              color: '#991B1B',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={18} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Workspace Grid (2 Columns: Builder Canvas vs Live Preview) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Blocks Sequence Canvas */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={18} color="#2563EB" />
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  目前結構順序（由上而下）
                </h2>
              </div>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                {activeBlocks.length} 個積木
              </span>
            </div>

            {/* Active blocks list */}
            {activeBlocks.length === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  border: '2px dashed #CBD5E1',
                  borderRadius: '8px',
                  color: '#94A3B8',
                  fontSize: '13px',
                }}
              >
                目前畫布為空，請從下方積木清單加入元素。
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeBlocks.map((block, idx) => (
                  <div
                    key={`${block.id}-${idx}`}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderLeft: `4px solid ${block.color}`,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#64748B',
                          width: '18px',
                          fontWeight: 700,
                        }}
                      >
                        #{idx + 1}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#0F172A',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {block.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {block.semanticRole}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        title="上移"
                        style={{
                          padding: '4px',
                          backgroundColor: '#F1F5F9',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          color: idx === 0 ? '#CBD5E1' : '#475569',
                        }}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === activeBlocks.length - 1}
                        title="下移"
                        style={{
                          padding: '4px',
                          backgroundColor: '#F1F5F9',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: idx === activeBlocks.length - 1 ? 'not-allowed' : 'pointer',
                          color: idx === activeBlocks.length - 1 ? '#CBD5E1' : '#475569',
                        }}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        onClick={() => handleRemove(idx)}
                        title="移除"
                        style={{
                          padding: '4px',
                          backgroundColor: '#FEE2E2',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#DC2626',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Validation action button */}
            <button
              onClick={handleValidateStructure}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
              }}
            >
              <CheckCircle2 size={18} />
              <span>驗證網頁架構 (Check Structure)</span>
            </button>

            {/* Available Blocks Pool */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                📦 本關可用元件庫 (點擊加入)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {currentLevel.blockPool.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleAddBlock(b)}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#1E293B',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={12} color="#2563EB" />
                    <span>{b.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Safe HTML Preview */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={18} color="#059669" />
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  即時結構渲染預覽 (Safe React DOM)
                </h2>
              </div>
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                ● 即時同步
              </span>
            </div>

            {/* Safe visual canvas */}
            <div
              style={{
                minHeight: '380px',
                padding: '16px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              {activeBlocks.length === 0 ? (
                <div
                  style={{
                    height: '240px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94A3B8',
                    fontSize: '13px',
                  }}
                >
                  尚未加入任何 HTML 元件
                </div>
              ) : (
                activeBlocks.map((b, idx) => renderPreviewBlock(b, idx))
              )}
            </div>

            {/* Target structure checklist */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#F1F5F9',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                🎯 目標架構順序提示：
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {currentLevel.targetBlockSequence.map((tid, sIdx) => {
                  const targetBlock = WEB_BUILDER_BLOCKS[tid];
                  const currentBlockAtIdx = activeBlocks[sIdx];
                  const isCorrect = currentBlockAtIdx?.id === tid;

                  return (
                    <span
                      key={sIdx}
                      style={{
                        padding: '3px 8px',
                        backgroundColor: isCorrect ? '#DCFCE7' : '#FFFFFF',
                        border: isCorrect ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                        borderRadius: '4px',
                        color: isCorrect ? '#166534' : '#64748B',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isCorrect && <CheckCircle2 size={12} />}
                      {sIdx + 1}. {targetBlock?.label || tid}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Completion Modal */}
        {isCompleted && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                maxWidth: '480px',
                width: '100%',
                padding: '28px',
                textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#DCFCE7',
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Trophy size={36} />
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                架構驗證通過！
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px' }}>
                恭喜通關 {currentLevel.title}
              </p>

              {/* Stars */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    size={28}
                    fill={s <= earnedStars ? '#F59E0B' : 'none'}
                    color={s <= earnedStars ? '#F59E0B' : '#CBD5E1'}
                  />
                ))}
              </div>

              {/* Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>本關得分</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                    {earnedScore} 分
                  </div>
                  {userGameRecord?.levels[currentLevel.levelNumber] && (
                    <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
                      歷史最高：{userGameRecord.levels[currentLevel.levelNumber].highScore} 分
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>完成耗時</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                    {elapsedSeconds} 秒
                  </div>
                  {userGameRecord?.levels[currentLevel.levelNumber] && (
                    <div style={{ fontSize: '11px', color: '#D97706', marginTop: '2px' }}>
                      最佳星級：{'★'.repeat(userGameRecord.levels[currentLevel.levelNumber].stars)}
                    </div>
                  )}
                </div>
              </div>

              {/* Pedagogical insight */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '8px',
                  textAlign: 'left',
                  fontSize: '12px',
                  color: '#1E40AF',
                  lineHeight: 1.6,
                  marginBottom: '20px',
                }}
              >
                <strong>💡 語意化核心觀念：</strong>
                <p style={{ margin: '4px 0 0' }}>{currentLevel.pedagogicalNotes}</p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleResetLevel}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  再次挑戰
                </button>

                {currentLevelIndex < WEB_BUILDER_LEVELS.length - 1 ? (
                  <button
                    onClick={() => setCurrentLevelIndex((prev) => prev + 1)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#2563EB',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>下一關</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={goToGameCenter}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#059669',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    返回遊戲中心
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <GameBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        config={GAME_BRIEFING_CONFIGS['web-builder']}
      />

      <Footer />
    </div>
  );
};
