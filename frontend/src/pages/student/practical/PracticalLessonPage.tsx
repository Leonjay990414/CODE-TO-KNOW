import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Lightbulb,
  Code2,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  TeachingModuleData,
  TeachingStepDetail,
  getTaskTeachingModule,
} from '../../../data/practicalTeachingModules';
import {
  getPracticalProgress,
  toggleStepCompletion,
  PracticalTaskProgress,
} from '../../../utils/learningStorage';

interface PracticalLessonPageProps {
  taskId: number;
  initialStepNumber?: number;
  onBackToDetail: () => void;
  onOpenSandbox: (taskId: number) => void;
}

export const PracticalLessonPage: React.FC<PracticalLessonPageProps> = ({
  taskId,
  initialStepNumber = 1,
  onBackToDetail,
  onOpenSandbox,
}) => {
  const { user } = useAuth();
  const userId = user?.id || 'guest-anonymous';

  const moduleData: TeachingModuleData = getTaskTeachingModule(taskId);
  const steps: TeachingStepDetail[] = moduleData.module5_StepByStepGuide;

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(() => {
    const idx = steps.findIndex((s) => s.stepNumber === initialStepNumber);
    return idx >= 0 ? idx : 0;
  });

  const [copied, setCopied] = useState<boolean>(false);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);

  // Read progress from learningStorage
  const [progress, setProgress] = useState<PracticalTaskProgress>(() => {
    return getPracticalProgress(userId, taskId, 'A');
  });

  useEffect(() => {
    setProgress(getPracticalProgress(userId, taskId, 'A'));
  }, [userId, taskId]);

  // Reset quiz selection when step changes
  useEffect(() => {
    setSelectedQuizAnswer(null);
    setCopied(false);
  }, [currentStepIndex]);

  const currentStep = steps[currentStepIndex] || steps[0];
  const isCompleted = progress.completedSteps.includes(currentStep.stepNumber);

  const handleToggleCurrentStep = () => {
    const updated = toggleStepCompletion(userId, taskId, 'A', currentStep.stepNumber);
    setProgress(updated);
  };

  const handleCopyCode = () => {
    if (navigator?.clipboard && currentStep.codeSnippet) {
      navigator.clipboard.writeText(currentStep.codeSnippet).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="practical-lesson-container" style={{ padding: '16px 0 40px' }}>
      {/* 頂部導覽列 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button
          onClick={onBackToDetail}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E0',
            borderRadius: '6px',
            color: '#26343D',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          <span>返回教材目錄</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onOpenSandbox(taskId)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: '#FAF8F2',
              color: '#26343D',
              border: '1px solid #BDA77E',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Code2 size={15} color="#BDA77E" />
            <span>開啟程式沙盒</span>
          </button>
        </div>
      </div>

      {/* 步驟橫向指示進度條 */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D9E2EA',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#5A7D6C' }}>
            {moduleData.title}・步驟 {currentStepIndex + 1} / {steps.length}
          </div>
          <div style={{ fontSize: '12px', color: '#8FA9B8' }}>
            已完成 {progress.completedSteps.length} / {steps.length} 步驟
          </div>
        </div>

        {/* 步驟按鈕列 */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {steps.map((s, idx) => {
            const isActive = idx === currentStepIndex;
            const isDone = progress.completedSteps.includes(s.stepNumber);
            return (
              <button
                key={s.stepNumber}
                onClick={() => setCurrentStepIndex(idx)}
                style={{
                  flex: '0 0 auto',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: isActive ? '2px solid #5A7D6C' : '1px solid #E2E8F0',
                  backgroundColor: isActive ? '#EBF2EE' : isDone ? '#F1F8E9' : '#FFFFFF',
                  color: isActive ? '#5A7D6C' : '#26343D',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isDone && <CheckCircle2 size={12} color="#2E7D32" />}
                <span>第 {s.stepNumber} 步</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 步驟核心卡片 (12 必備要素完整呈現) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D9E2EA',
          borderRadius: '12px',
          padding: '28px',
          marginBottom: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        }}
      >
        {/* 步驟標題與標籤 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ backgroundColor: '#BDA77E', color: 'var(--color-brand-charcoal, #26343D)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                {currentStep.stepNumber}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#E2E8F0', color: '#526B7B' }}>
                [{currentStep.tag}]
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#26343D', margin: 0 }}>
              {currentStep.title}
            </h2>
          </div>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: isCompleted ? '#EBF2EE' : '#F8FAFC',
              border: isCompleted ? '1px solid #5A7D6C' : '1px solid #CBD5E0',
              cursor: 'pointer',
              color: isCompleted ? '#2E7D32' : '#526B7B',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={handleToggleCurrentStep}
            />
            <span>{isCompleted ? '✓ 本步驟已完成' : '標記此步驟為完成'}</span>
          </label>
        </div>

        {/* 1. 學習目標 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#5A7D6C', marginBottom: '4px' }}>🎯 學習目標</div>
          <p style={{ fontSize: '14px', color: '#26343D', margin: 0, lineHeight: 1.6 }}>{currentStep.learningGoal}</p>
        </div>

        {/* 2. 操作前準備 */}
        <div style={{ marginBottom: '20px', backgroundColor: '#FAF8F2', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #BDA77E' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#26343D', marginBottom: '4px' }}>📋 操作前準備</div>
          <div style={{ fontSize: '13px', color: '#526B7B' }}>{currentStep.prerequisites}</div>
        </div>

        {/* 3. 詳細操作流程 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#26343D', marginBottom: '8px' }}>🛠️ 詳細操作流程</div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {currentStep.detailedProcess.map((proc, idx) => (
              <div key={idx} style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, paddingLeft: '8px' }}>
                {proc}
              </div>
            ))}
          </div>
        </div>

        {/* 4. 重要設定 */}
        {currentStep.criticalSettings.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#26343D', marginBottom: '8px' }}>⚙️ 重要關鍵設定</div>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#526B7B', fontSize: '13px', lineHeight: 1.8 }}>
              {currentStep.criticalSettings.map((setting, idx) => (
                <li key={idx} style={{ fontWeight: 600, color: '#C05621' }}>{setting}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 5. 必要程式碼範例 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#26343D' }}>
              💻 必要程式碼範例 ({currentStep.codeLanguage.toUpperCase()})
            </div>
            <button
              onClick={handleCopyCode}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E0',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#26343D',
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={14} color="#2E7D32" /> : <Copy size={14} />}
              <span>{copied ? '已複製！' : '複製程式碼'}</span>
            </button>
          </div>
          <pre
            style={{
              backgroundColor: '#1E293B',
              color: '#F8FAFC',
              padding: '16px',
              borderRadius: '8px',
              overflowX: 'auto',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '13px',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            <code>{currentStep.codeSnippet}</code>
          </pre>
        </div>

        {/* 6. 程式碼逐段解釋 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#26343D', marginBottom: '8px' }}>🔍 程式碼逐段解析</div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {currentStep.codeExplanation.map((exp, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                <code style={{ color: '#5A7D6C', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {exp.lineOrPart}
                </code>
                <span style={{ color: '#526B7B' }}>{exp.explanation}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7. 操作完成後的預期結果 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#26343D', marginBottom: '6px' }}>✨ 預期完成畫面與效果</div>
          <p style={{ margin: 0, fontSize: '13px', color: '#526B7B', lineHeight: 1.6 }}>{currentStep.expectedResult}</p>
        </div>

        {/* 8. 容易犯的錯誤 & 9. 錯誤排查方法 */}
        <div style={{ marginBottom: '24px', backgroundColor: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C53030', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
            <AlertTriangle size={16} />
            <span>考場容易犯的錯誤與排查技巧</span>
          </div>
          <div style={{ fontSize: '13px', color: '#742A2A', marginBottom: '8px' }}>
            <strong>常見地雷：</strong>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
              {currentStep.commonMistakes.map((mis, idx) => (
                <li key={idx}>{mis}</li>
              ))}
            </ul>
          </div>
          <div style={{ fontSize: '13px', color: '#2E7D32' }}>
            <strong>排查指南：</strong>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
              {currentStep.troubleshooting.map((trb, idx) => (
                <li key={idx}>{trb}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 10. 延伸知識 */}
        <div style={{ marginBottom: '24px', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369A1', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
            <Lightbulb size={16} />
            <span>延伸技術知識 (現代 Web 標準)</span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#0C4A6E', lineHeight: 1.6 }}>{currentStep.extendedKnowledge}</p>
        </div>

        {/* 11. 學習檢核 (小測驗) */}
        <div style={{ backgroundColor: '#FAF8F2', border: '1px solid #D9D2C4', borderRadius: '8px', padding: '18px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#26343D', marginBottom: '10px' }}>
            📝 步驟通關隨堂測驗：{currentStep.checkQuiz.question}
          </div>
          <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
            {currentStep.checkQuiz.options.map((opt, oIdx) => {
              const isSelected = selectedQuizAnswer === oIdx;
              return (
                <button
                  key={oIdx}
                  onClick={() => setSelectedQuizAnswer(oIdx)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: isSelected ? '2px solid #5A7D6C' : '1px solid #CBD5E0',
                    backgroundColor: isSelected ? '#EBF2EE' : '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#26343D',
                  }}
                >
                  {String.fromCharCode(65 + oIdx)}. {opt}
                </button>
              );
            })}
          </div>

          {selectedQuizAnswer !== null && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: selectedQuizAnswer === currentStep.checkQuiz.correctIndex ? '#EBF2EE' : '#FFF5F5',
                color: selectedQuizAnswer === currentStep.checkQuiz.correctIndex ? '#2E7D32' : '#C53030',
                fontSize: '13px',
              }}
            >
              <strong>{selectedQuizAnswer === currentStep.checkQuiz.correctIndex ? '✓ 恭喜答對！' : '✗ 答錯了！'}</strong>{' '}
              {currentStep.checkQuiz.explanation}
            </div>
          )}
        </div>
      </div>

      {/* 底部上一步/下一步換頁按鈕 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 18px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E0',
            borderRadius: '6px',
            color: currentStepIndex === 0 ? '#94A3B8' : '#26343D',
            cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <ChevronLeft size={16} />
          <span>上一步驟</span>
        </button>

        <button
          onClick={handleNext}
          disabled={currentStepIndex === steps.length - 1}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 18px',
            backgroundColor: currentStepIndex === steps.length - 1 ? '#E2E8F0' : '#5A7D6C',
            border: 'none',
            borderRadius: '6px',
            color: currentStepIndex === steps.length - 1 ? '#94A3B8' : '#FFFFFF',
            cursor: currentStepIndex === steps.length - 1 ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <span>下一步驟</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
