import React, { useState, useEffect } from 'react';
import {
  Palette,
  RotateCcw,
  CheckCircle2,
  Lightbulb,
  Star,
  Trophy,
  ArrowRight,
  Code2,
  Sparkles,
  AlertCircle,
  Eye,
  Sliders,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  CSS_DESIGNER_LEVELS,
  CSSDesignerLevel,
  validateCSSDesignerLevel,
} from '../../data/cssDesignerData';
import {
  getUserGameRecord,
  saveLevelCompletion,
  UserGameRecord,
} from '../../utils/gameStorage';

interface CSSDesignerPageProps {
  onOpenTeacherApply?: () => void;
}

export const CSSDesignerPage: React.FC<CSSDesignerPageProps> = ({ onOpenTeacherApply }) => {
  const { user, openAuth } = useAuth();
  const { goToHome, goToStudentDashboard } = useNavigation();

  const userId = user?.id || 'guest-anonymous';
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [gameRecord, setGameRecord] = useState<UserGameRecord>(() =>
    getUserGameRecord(userId, 'css-designer')
  );

  const currentLevel: CSSDesignerLevel =
    CSS_DESIGNER_LEVELS.find((l) => l.levelId === selectedLevelId) || CSS_DESIGNER_LEVELS[0];

  // Initialize user CSS values from level controls
  const initValues = () => {
    const vals: Record<string, any> = {};
    currentLevel.controls.forEach((c) => {
      vals[c.property] = c.defaultValue;
    });
    return vals;
  };

  const [userValues, setUserValues] = useState<Record<string, any>>(initValues);
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
    setUserValues(initValues());
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
    setGameRecord(getUserGameRecord(userId, 'css-designer'));
  }, [userId]);

  const handleControlChange = (property: string, val: any) => {
    setUserValues((prev) => ({
      ...prev,
      [property]: val,
    }));
    setValidationResult((prev) => ({ ...prev, tested: false }));
  };

  const handleReset = () => {
    setUserValues(initValues());
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
    const check = validateCSSDesignerLevel(currentLevel.levelId, userValues);

    if (check.isCorrect) {
      let stars = 3;
      if (hintsRevealed === 1) stars = 2;
      else if (hintsRevealed >= 2) stars = 1;

      const score = 100 + stars * 50;

      // Save to local storage safely
      const updatedRecord = saveLevelCompletion(
        userId,
        'css-designer',
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
        message: check.feedback,
      });
    } else {
      setValidationResult({
        tested: true,
        isCorrect: false,
        starsEarned: 0,
        scoreEarned: 0,
        message: check.feedback,
      });
    }
  };

  const handleNextLevel = () => {
    const nextLevel = CSS_DESIGNER_LEVELS.find((l) => l.levelId === currentLevel.levelId + 1);
    if (nextLevel) {
      setSelectedLevelId(nextLevel.levelId);
    } else {
      window.location.hash = '#games';
    }
  };

  // Convert userValues to scoped inline styles
  const generateInlineStyles = (vals: Record<string, any>): React.CSSProperties => {
    const styles: React.CSSProperties = {
      transition: 'all 0.25s ease-out',
      boxSizing: 'border-box',
    };

    if (currentLevel.levelId === 1) {
      styles.color = vals.color;
      styles.backgroundColor = vals.backgroundColor;
      styles.borderRadius = `${vals.borderRadius}px`;
      styles.padding = '12px 28px';
      styles.border = 'none';
      styles.fontWeight = 700;
      styles.fontSize = '15px';
      styles.cursor = 'pointer';
      styles.display = 'inline-block';
    } else if (currentLevel.levelId === 2) {
      styles.width = `${vals.width}px`;
      styles.padding = `${vals.padding}px`;
      styles.margin = `${vals.margin}px`;
      styles.border = `${vals.borderWidth}px solid ${vals.borderColor}`;
      styles.backgroundColor = '#FFFFFF';
      styles.borderRadius = '6px';
      styles.fontSize = '14px';
      styles.color = '#1E293B';
      styles.lineHeight = 1.5;
    } else if (currentLevel.levelId === 3) {
      styles.display = vals.display;
      styles.justifyContent = vals.justifyContent;
      styles.alignItems = vals.alignItems;
      styles.gap = `${vals.gap}px`;
      styles.padding = '20px';
      styles.backgroundColor = '#FFFFFF';
      styles.borderRadius = '8px';
      styles.border = '1px solid #E2E8F0';
      styles.minHeight = '100px';
    } else if (currentLevel.levelId === 4) {
      styles.maxWidth = `${vals.maxWidth}px`;
      styles.width = '100%';
      styles.display = 'flex';
      styles.flexDirection = vals.flexDirection;
      styles.padding = `${vals.padding}px`;
      styles.borderRadius = `${vals.borderRadius}px`;
      styles.boxShadow = vals.boxShadow;
      styles.gap = `${vals.gap}px`;
      styles.backgroundColor = '#FFFFFF';
      styles.border = vals.boxShadow === 'none' ? '1px solid #E2E8F0' : 'none';
    }

    return styles;
  };

  // Render preview content based on level
  const renderPreviewContent = (styles: React.CSSProperties) => {
    if (currentLevel.levelId === 1) {
      return (
        <button type="button" style={styles}>
          立即探索課程
        </button>
      );
    }

    if (currentLevel.levelId === 2) {
      return (
        <div style={styles}>
          <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--color-brand-gold)' }}>
            學習提醒 (Box Model)
          </div>
          <div>考前請務必掌握 padding 與 margin 留白定位，避免排版溢出！</div>
        </div>
      );
    }

    if (currentLevel.levelId === 3) {
      const badgeStyle: React.CSSProperties = {
        padding: '6px 14px',
        borderRadius: '20px',
        backgroundColor: '#F1F5F9',
        color: '#2563EB',
        fontWeight: 600,
        fontSize: '13px',
        border: '1px solid #E2E8F0',
      };
      return (
        <div style={styles}>
          <span style={badgeStyle}>HTML5 語意</span>
          <span style={badgeStyle}>CSS3 Flexbox</span>
          <span style={badgeStyle}>JavaScript</span>
        </div>
      );
    }

    if (currentLevel.levelId === 4) {
      return (
        <div style={styles}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="badge badge-gold" style={{ fontSize: '11px' }}>技能檢定</span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>熱門</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
            網頁設計丙級實戰課程
          </div>
          <div style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.4 }}>
            涵蓋學科 605 題與五大術科題組全真通關解析，助您輕鬆考取國家證照。
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-brand-gold)' }}>
              NT$ 0 <span style={{ fontSize: '11px', fontWeight: 400, color: '#94A3B8' }}>(公益免費)</span>
            </span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              立即選課
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Live CSS Code Representation string
  const renderCodeSnippet = () => {
    const lines: string[] = [];
    if (currentLevel.levelId === 1) {
      lines.push(`.cta-button {`);
      lines.push(`  color: ${userValues.color};`);
      lines.push(`  background-color: ${userValues.backgroundColor};`);
      lines.push(`  border-radius: ${userValues.borderRadius}px;`);
      lines.push(`}`);
    } else if (currentLevel.levelId === 2) {
      lines.push(`.info-box {`);
      lines.push(`  width: ${userValues.width}px;`);
      lines.push(`  padding: ${userValues.padding}px;`);
      lines.push(`  margin: ${userValues.margin}px;`);
      lines.push(`  border: ${userValues.borderWidth}px solid ${userValues.borderColor};`);
      lines.push(`}`);
    } else if (currentLevel.levelId === 3) {
      lines.push(`.badge-container {`);
      lines.push(`  display: ${userValues.display};`);
      lines.push(`  justify-content: ${userValues.justifyContent};`);
      lines.push(`  align-items: ${userValues.alignItems};`);
      lines.push(`  gap: ${userValues.gap}px;`);
      lines.push(`}`);
    } else if (currentLevel.levelId === 4) {
      lines.push(`.product-card {`);
      lines.push(`  max-width: ${userValues.maxWidth}px;`);
      lines.push(`  display: flex;`);
      lines.push(`  flex-direction: ${userValues.flexDirection};`);
      lines.push(`  padding: ${userValues.padding}px;`);
      lines.push(`  border-radius: ${userValues.borderRadius}px;`);
      lines.push(`  box-shadow: ${userValues.boxShadow};`);
      lines.push(`  gap: ${userValues.gap}px;`);
      lines.push(`}`);
    }
    return lines.join('\n');
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
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>CSS Designer (樣式排版設計師)</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <Palette size={28} color="#0284C7" />
                  <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    CSS Designer｜樣式排版設計師
                  </h1>
                  <span className="badge badge-gold">P14-GAM-005</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  透過即時滑桿與參數調校，直觀理解色彩對比、盒模型 (Box Model) 與 Flexbox 現代佈局。
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
                  <Trophy size={18} color="#0284C7" />
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
            {CSS_DESIGNER_LEVELS.map((level) => {
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
                    border: isSelected ? '2px solid #0284C7' : '1px solid var(--border-default)',
                    backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.08)' : 'var(--surface-sunken)',
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
                      backgroundColor: isSelected ? '#0284C7' : 'var(--border-default)',
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
                <p style={{ fontSize: '13px', color: '#0284C7', margin: 0, fontWeight: 600 }}>
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
                  <Lightbulb size={16} color="#0284C7" />
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
                  <span>重置參數</span>
                </button>
              </div>
            </div>

            {/* Hint Box (if any hint unlocked) */}
            {hintsRevealed > 0 && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px 18px',
                  backgroundColor: 'rgba(2, 132, 199, 0.08)',
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={16} color="#0284C7" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    思考引導提示（使用提示將影響該關獲得星星數）：
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

          {/* Interactive Workspace Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            {/* Left Column: CSS Controls & Live Code */}
            <div
              style={{
                backgroundColor: 'var(--surface-sunken)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Sliders size={20} color="#0284C7" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  屬性調校面板 (Controls)
                </h3>
              </div>

              {/* Dynamic Controls List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {currentLevel.controls.map((ctrl) => {
                  return (
                    <div
                      key={ctrl.property}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: 'var(--surface-base)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {ctrl.label}
                        </label>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#0284C7' }}>
                          {userValues[ctrl.property]}
                          {ctrl.unit || ''}
                        </span>
                      </div>

                      {ctrl.type === 'slider' && (
                        <div>
                          <input
                            type="range"
                            min={ctrl.min}
                            max={ctrl.max}
                            step={ctrl.step}
                            value={userValues[ctrl.property]}
                            onChange={(e) => handleControlChange(ctrl.property, Number(e.target.value))}
                            style={{ width: '100%', cursor: 'pointer', accentColor: '#0284C7' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span>{ctrl.min}{ctrl.unit}</span>
                            <span>{ctrl.max}{ctrl.unit}</span>
                          </div>
                        </div>
                      )}

                      {ctrl.type === 'select' && ctrl.options && (
                        <select
                          value={userValues[ctrl.property]}
                          onChange={(e) => handleControlChange(ctrl.property, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-default)',
                            backgroundColor: 'var(--surface-sunken)',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          {ctrl.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {ctrl.description && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {ctrl.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Monospace Generated CSS Code Preview */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Code2 size={16} color="var(--text-muted)" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    即時生成的 CSS 程式碼：
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: '#1E293B',
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px',
                    overflowX: 'auto',
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: '12.5px',
                      lineHeight: 1.5,
                      color: '#38BDF8',
                    }}
                  >
                    {renderCodeSnippet()}
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
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
                    backgroundColor: '#0284C7',
                    borderColor: '#0284C7',
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>提交驗證目標</span>
                </button>

                {validationResult.tested && validationResult.isCorrect && (
                  <button
                    type="button"
                    className="btn btn-gold"
                    onClick={handleNextLevel}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '15px' }}
                  >
                    <span>
                      {currentLevel.levelId < CSS_DESIGNER_LEVELS.length ? '挑戰下一關' : '返回遊戲中心'}
                    </span>
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Visual Comparison & Explanation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Target vs Live Preview Comparison Card */}
              <div
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Eye size={20} color="#0284C7" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    視覺比對與即時預覽 (Comparison)
                  </h3>
                </div>

                {/* Sub-block A: Target Goal View */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      [目標畫面 Target]
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-brand-gold)' }}>
                      {currentLevel.targetDescription}
                    </span>
                  </div>
                  <div
                    style={{
                      padding: '28px',
                      backgroundColor: 'var(--surface-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px dashed var(--border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '140px',
                      overflow: 'hidden',
                    }}
                  >
                    {renderPreviewContent(generateInlineStyles(currentLevel.targetStyles))}
                  </div>
                </div>

                {/* Sub-block B: User's Live Preview */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0284C7' }}>
                      [你的即時預覽 Your Live Preview]
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      (隨著左側控制項即時連動)
                    </span>
                  </div>
                  <div
                    style={{
                      padding: '28px',
                      backgroundColor: 'var(--surface-base)',
                      borderRadius: 'var(--radius-sm)',
                      border: '2px solid #0284C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '140px',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {renderPreviewContent(generateInlineStyles(userValues))}
                  </div>
                </div>
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
                        獲得評級：{'★'.repeat(validationResult.starsEarned)} (
                        {validationResult.starsEarned} 顆星)｜積分獎勵：+
                        {validationResult.scoreEarned} 分
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#BE123C' }}>
                        未達標提示：請觀察「目標畫面」與「你的預覽」差異，可點右上角提示獲取指引。
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comprehensive Post-Completion Explanation Card */}
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
                    <Sparkles size={20} color="#0284C7" />
                    <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      通關語法深度解析與原理教學
                    </h3>
                  </div>

                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    {currentLevel.explanation.overview}
                  </p>

                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    使用的 CSS 關鍵屬性：
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {currentLevel.explanation.propertiesUsed.map((p, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: '12.5px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--surface-base)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <code style={{ color: '#0284C7', fontWeight: 700 }}>{p.prop}</code>：{p.desc}
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <strong>其他可行寫法：</strong>{currentLevel.explanation.alternatives}
                  </div>

                  <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: '#BE123C' }}>
                    <strong>常見錯誤迷思：</strong>{currentLevel.explanation.commonMistakes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
