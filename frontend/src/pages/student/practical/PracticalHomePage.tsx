import React, { useState, useEffect } from 'react';
import {
  Layers,
  BookOpen,
  Code2,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Play,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ALL_PRACTICAL_TEACHING_MODULES, TeachingModuleData } from '../../../data/practicalTeachingModules';
import { getPracticalProgress, resetPracticalProgress, PracticalTaskProgress } from '../../../utils/learningStorage';

interface PracticalHomePageProps {
  onSelectTaskDetail: (taskId: number) => void;
  onOpenSandbox: (taskId: number) => void;
  onOpenLesson: (taskId: number, stepNumber?: number) => void;
}

export const PracticalHomePage: React.FC<PracticalHomePageProps> = ({
  onSelectTaskDetail,
  onOpenSandbox,
  onOpenLesson,
}) => {
  const { user } = useAuth();
  const userId = user?.id || 'guest-anonymous';

  // Task IDs: 1 to 5
  const taskIds = [1, 2, 3, 4, 5];
  const [taskProgresses, setTaskProgresses] = useState<Record<number, PracticalTaskProgress>>({});

  useEffect(() => {
    const loaded: Record<number, PracticalTaskProgress> = {};
    taskIds.forEach((id) => {
      loaded[id] = getPracticalProgress(userId, id, 'A');
    });
    setTaskProgresses(loaded);
  }, [userId]);

  // Total completed steps across all 5 tasks
  const totalCompletedSteps = Object.values(taskProgresses).reduce(
    (acc, p) => acc + (p?.completedSteps?.length || 0),
    0
  );

  const totalStepsAvailable = taskIds.reduce((acc, id) => {
    const mod = ALL_PRACTICAL_TEACHING_MODULES[id];
    return acc + (mod?.module5_StepByStepGuide?.length || 4);
  }, 0);

  const overallPercent = totalStepsAvailable > 0
    ? Math.round((totalCompletedSteps / totalStepsAvailable) * 100)
    : 0;

  const handleResetSingleProgress = (taskId: number, title: string) => {
    if (window.confirm(`確定要重設【${title}】的進度嗎？`)) {
      const reset = resetPracticalProgress(userId, taskId, 'A');
      setTaskProgresses((prev) => ({ ...prev, [taskId]: reset }));
    }
  };

  return (
    <div className="practical-home-container" style={{ padding: '24px 0' }}>
      {/* 頂部歡迎與進度總覽面板 */}
      <div
        className="hero-summary-card"
        style={{
          backgroundColor: '#FAF8F2',
          border: '1px solid #D9E2EA',
          borderRadius: '16px',
          padding: '28px 24px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px -2px rgba(38, 52, 61, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', backgroundColor: '#EBF2EE', color: '#5A7D6C', fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>
              <ShieldCheck size={14} />
              <span>勞動部 17300 網頁設計丙級術科・五大官方正式題組</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#26343D', margin: '0 0 8px 0' }}>
              術科實作互動教學工作區
            </h1>
            <p style={{ fontSize: '14px', color: '#526B7B', margin: 0, maxWidth: '640px', lineHeight: 1.6 }}>
              嚴格依照 173003B12 試題規範，將 11 冊官方講義轉化為 13 大標準模組之完整分步教學。支援線上即時多頁 HTML 沙盒演練，杜絕破圖、防範考場扣分陷阱。
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9D2C4',
              borderRadius: '12px',
              padding: '16px 20px',
              minWidth: '220px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '12px', color: '#8FA9B8', fontWeight: 600, marginBottom: '4px' }}>全站術科實作進度</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#5A7D6C', marginBottom: '8px' }}>
              {overallPercent}%
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${overallPercent}%`,
                  height: '100%',
                  backgroundColor: '#5A7D6C',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '11px', color: '#526B7B', marginTop: '6px' }}>
              已完成 {totalCompletedSteps} / {totalStepsAvailable} 個核心步驟
            </div>
          </div>
        </div>
      </div>

      {/* 五大題組卡片網格 */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={20} color="#BDA77E" />
          <span>五大正式題組學習路徑</span>
        </h2>

        <div
          className="task-cards-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {taskIds.map((taskId) => {
            const moduleData: TeachingModuleData = ALL_PRACTICAL_TEACHING_MODULES[taskId];
            const prog = taskProgresses[taskId];
            const stepsCount = moduleData.module5_StepByStepGuide.length;
            const completedCount = prog?.completedSteps?.length || 0;
            const percent = stepsCount > 0 ? Math.round((completedCount / stepsCount) * 100) : 0;

            return (
              <div
                key={taskId}
                className="task-card"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D9E2EA',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#EBF2EE',
                        color: '#5A7D6C',
                        padding: '3px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {moduleData.taskCode}
                    </span>
                    <span style={{ fontSize: '12px', color: '#7C663D', fontWeight: 600 }}>
                      難度：{moduleData.difficulty}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', margin: '0 0 6px 0' }}>
                    {moduleData.title}
                  </h3>

                  <p style={{ fontSize: '13px', color: '#526B7B', lineHeight: 1.5, margin: '0 0 14px 0', minHeight: '38px' }}>
                    {moduleData.theme}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#8FA9B8', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} />
                      <span>{moduleData.estimatedMinutes} 分鐘</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <BookOpen size={14} />
                      <span>{stepsCount} 個精解步驟</span>
                    </div>
                  </div>

                  {/* 進度條 */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#526B7B', marginBottom: '4px' }}>
                      <span>學習完成度</span>
                      <span>{percent}% ({completedCount}/{stepsCount})</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          backgroundColor: percent === 100 ? '#2E7D32' : '#5A7D6C',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '14px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => onOpenLesson(taskId, 1)}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '8px 10px',
                      backgroundColor: '#5A7D6C',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Play size={13} />
                    <span>分步學習</span>
                  </button>

                  <button
                    onClick={() => onSelectTaskDetail(taskId)}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '8px 10px',
                      backgroundColor: '#FFFFFF',
                      color: '#26343D',
                      border: '1px solid #CBD5E0',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span>13模組</span>
                    <ArrowRight size={13} />
                  </button>

                  <button
                    onClick={() => onOpenSandbox(taskId)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '8px 10px',
                      backgroundColor: '#FAF8F2',
                      color: '#26343D',
                      border: '1px solid #BDA77E',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title="進入雙欄 HTML Sandbox 編輯並預覽"
                  >
                    <Code2 size={13} color="#BDA77E" />
                    <span>沙盒</span>
                  </button>

                  {completedCount > 0 && (
                    <button
                      onClick={() => handleResetSingleProgress(taskId, moduleData.title)}
                      style={{
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: '1px solid #CBD5E0',
                        borderRadius: '6px',
                        color: '#64748B',
                        cursor: 'pointer',
                      }}
                      title="重設本科進度"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
