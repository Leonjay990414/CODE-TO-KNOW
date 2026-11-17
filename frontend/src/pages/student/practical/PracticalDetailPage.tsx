import React, { useState } from 'react';
import {
  ArrowLeft,
  Code2,
  Play,
  AlertTriangle,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { TeachingModuleData, getTaskTeachingModule } from '../../../data/practicalTeachingModules';

interface PracticalDetailPageProps {
  taskId: number;
  onBackToHome: () => void;
  onOpenLesson: (taskId: number, stepNumber?: number) => void;
  onOpenSandbox: (taskId: number) => void;
}

export const PracticalDetailPage: React.FC<PracticalDetailPageProps> = ({
  taskId,
  onBackToHome,
  onOpenLesson,
  onOpenSandbox,
}) => {
  const moduleData: TeachingModuleData = getTaskTeachingModule(taskId);

  // Active module tab: 1 to 13
  const [activeTab, setActiveTab] = useState<number>(1);

  // Interactive Quiz state for Module 12
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  // Self-checklist state
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const handleSelectQuizOption = (quizIndex: number, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [quizIndex]: optionIndex }));
  };

  const handleToggleChecklist = (index: number) => {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const tabsConfig = [
    { id: 1, label: '1. 題組介紹' },
    { id: 2, label: '2. 學習目標' },
    { id: 3, label: '3. 網站架構' },
    { id: 4, label: '4. 製作準備' },
    { id: 5, label: '5. 分步教學' },
    { id: 6, label: '6. HTML 解析' },
    { id: 7, label: '7. CSS 樣式' },
    { id: 8, label: '8. JS 與動態' },
    { id: 9, label: '9. 講義補充' },
    { id: 10, label: '10. 影音考點' },
    { id: 11, label: '11. 扣分排查' },
    { id: 12, label: '12. 測驗檢核' },
    { id: 13, label: '13. 成果驗證' },
  ];

  return (
    <div className="practical-detail-container" style={{ padding: '16px 0 40px' }}>
      {/* 導覽列與操作按鈕 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button
          onClick={onBackToHome}
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
          <span>返回題組清單</span>
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onOpenLesson(taskId, 1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#5A7D6C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Play size={14} />
            <span>開始分步引導學習</span>
          </button>

          <button
            onClick={() => onOpenSandbox(taskId)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#FAF8F2',
              color: '#26343D',
              border: '1px solid #BDA77E',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Code2 size={14} color="#BDA77E" />
            <span>進入多頁 HTML 沙盒</span>
          </button>
        </div>
      </div>

      {/* 題組 Header 資訊卡 */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D9E2EA',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ backgroundColor: '#EBF2EE', color: '#5A7D6C', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>
            {moduleData.taskCode}
          </span>
          <span style={{ color: '#BDA77E', fontWeight: 600, fontSize: '13px' }}>
            難度：{moduleData.difficulty}
          </span>
          <span style={{ color: '#8FA9B8', fontSize: '13px' }}>
            預估實作時間：{moduleData.estimatedMinutes} 分鐘
          </span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#26343D', margin: '0 0 10px 0' }}>
          {moduleData.title}
        </h1>
        <p style={{ fontSize: '14px', color: '#526B7B', lineHeight: 1.6, margin: 0 }}>
          {moduleData.module1_Introduction.overview}
        </p>
      </div>

      {/* 13 大教學模組導航分頁 (橫向滑動) */}
      <div
        className="tabs-nav-bar"
        style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '6px',
          paddingBottom: '8px',
          marginBottom: '20px',
          borderBottom: '2px solid #E2E8F0',
        }}
      >
        {tabsConfig.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 14px',
                whiteSpace: 'nowrap',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#5A7D6C' : '#526B7B',
                backgroundColor: isActive ? '#EBF2EE' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 模組內容區域 */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D9E2EA',
          borderRadius: '12px',
          padding: '24px',
          minHeight: '400px',
        }}
      >
        {/* 模組 1: 題組介紹 */}
        {activeTab === 1 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', marginBottom: '16px' }}>
              模組一：題組介紹與官方硬性要求
            </h2>
            <div style={{ backgroundColor: '#FAF8F2', padding: '16px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #BDA77E' }}>
              <div style={{ fontWeight: 600, color: '#26343D', marginBottom: '6px' }}>畫布與版面規格</div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#526B7B', fontSize: '13px', lineHeight: 1.8 }}>
                <li>整體尺寸：{moduleData.canvasSpec.width}，{moduleData.canvasSpec.centering}</li>
                <li>標題橫幅：{moduleData.canvasSpec.header}</li>
                <li>功能選單：{moduleData.canvasSpec.menu}</li>
                <li>主要內容：{moduleData.canvasSpec.content}</li>
                <li>頁尾版權：{moduleData.canvasSpec.footer}</li>
              </ul>
            </div>

            <div style={{ fontWeight: 600, color: '#26343D', marginBottom: '8px' }}>勞動部試題評定關鍵指標</div>
            <ul style={{ paddingLeft: '20px', color: '#526B7B', fontSize: '13px', lineHeight: 1.8 }}>
              {moduleData.module1_Introduction.requirements.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 模組 2: 學習目標 */}
        {activeTab === 2 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', marginBottom: '16px' }}>
              模組二：本單元學習目標與核心能力
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {moduleData.module2_LearningGoals.map((goal, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                  }}
                >
                  <CheckCircle2 size={18} color="#5A7D6C" />
                  <span style={{ fontSize: '14px', color: '#26343D', fontWeight: 500 }}>{goal}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 模組 3: 網站架構 */}
        {activeTab === 3 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', marginBottom: '16px' }}>
              模組三：網站完整架構與檔案配置樹
            </h2>
            <p style={{ fontSize: '14px', color: '#526B7B', marginBottom: '16px' }}>
              {moduleData.module3_SiteArchitecture.description}
            </p>
            <div style={{ backgroundColor: '#26343D', borderRadius: '8px', padding: '16px', color: '#FAF8F2', fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.8 }}>
              <div style={{ color: '#BDA77E', fontWeight: 700, marginBottom: '6px' }}>📁 webXX/ (網站主目錄)</div>
              {moduleData.module3_SiteArchitecture.fileTree.map((item, idx) => (
                <div key={idx} style={{ paddingLeft: '16px', display: 'flex', gap: '16px' }}>
                  <span style={{ color: '#8FA9B8', minWidth: '160px' }}>├── {item.path}</span>
                  <span style={{ color: '#CBD5E1' }}>// {item.purpose}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 模組 4: 製作前準備 */}
        {activeTab === 4 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', marginBottom: '16px' }}>
              模組四：製作前準備、目錄規範與素材索引
            </h2>
            <div style={{ backgroundColor: '#EBF2EE', padding: '12px 16px', borderRadius: '8px', color: '#5A7D6C', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
              目錄規範：{moduleData.module4_Preparation.directorySpec}
            </div>
            <div style={{ fontWeight: 600, color: '#26343D', marginBottom: '8px' }}>官方素材檔案檢核表</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAF8F2', borderBottom: '2px solid #D9D2C4', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>檔案名稱</th>
                  <th style={{ padding: '8px' }}>類型</th>
                  <th style={{ padding: '8px' }}>用途說明</th>
                  <th style={{ padding: '8px' }}>官方出處</th>
                </tr>
              </thead>
              <tbody>
                {moduleData.module4_Preparation.assets.map((asset, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 600, color: '#2D4E5E' }}>{asset.filename}</td>
                    <td style={{ padding: '8px', color: '#526B7B' }}>{asset.category}</td>
                    <td style={{ padding: '8px', color: '#26343D' }}>{asset.purpose}</td>
                    <td style={{ padding: '8px', color: '#8FA9B8' }}>{asset.officialSource}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 模組 5: 分步操作教學快速發射台 */}
        {activeTab === 5 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', margin: 0 }}>
                模組五：分步操作教學清單 ({moduleData.module5_StepByStepGuide.length} 個標準步驟)
              </h2>
              <button
                onClick={() => onOpenLesson(taskId, 1)}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#5A7D6C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                進入全功能步驟引導器
              </button>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              {moduleData.module5_StepByStepGuide.map((step) => (
                <div
                  key={step.stepNumber}
                  style={{
                    border: '1px solid #D9E2EA',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#FAF8F2',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ backgroundColor: '#BDA77E', color: '#FFFFFF', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                        {step.stepNumber}
                      </span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#26343D' }}>{step.title}</span>
                      <span style={{ fontSize: '11px', backgroundColor: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', color: '#526B7B' }}>
                        [{step.tag}]
                      </span>
                    </div>
                    <button
                      onClick={() => onOpenLesson(taskId, step.stepNumber)}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E0',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#5A7D6C',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      研讀本步驟
                    </button>
                  </div>
                  <p style={{ fontSize: '13px', color: '#526B7B', margin: '0 0 8px 0' }}>{step.learningGoal}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 模組 6: HTML 解析 */}
        {activeTab === 6 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', marginBottom: '16px' }}>
              模組六：HTML 結構與核心標籤深度剖析
            </h2>
            <p style={{ fontSize: '14px', color: '#526B7B', lineHeight: 1.6, marginBottom: '20px' }}>
              {moduleData.module6_HtmlDeepDive.content}
            </p>
            {moduleData.module6_HtmlDeepDive.codeExamples.map((ex, idx) => (
              <div key={idx} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#26343D', marginBottom: '6px' }}>{ex.title}</div>
                <pre style={{ backgroundColor: '#26343D', color: '#FAF8F2', padding: '12px', borderRadius: '6px', overflowX: 'auto', fontSize: '12px', margin: 0 }}>
                  <code>{ex.code}</code>
                </pre>
                <div style={{ fontSize: '12px', color: '#526B7B', marginTop: '6px' }}>{ex.explanation}</div>
              </div>
            ))}
          </div>
        )}

        {/* 模組 7: CSS 樣式 */}
        {activeTab === 7 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', marginBottom: '16px' }}>
              模組七：CSS 樣式規則與尺寸排版解析
            </h2>
            <p style={{ fontSize: '14px', color: '#526B7B', lineHeight: 1.6, marginBottom: '20px' }}>
              {moduleData.module7_CssDeepDive.content}
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAF8F2', borderBottom: '2px solid #D9D2C4', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>選擇器 (Selector)</th>
                  <th style={{ padding: '8px' }}>屬性設定 (Properties)</th>
                  <th style={{ padding: '8px' }}>用途與考點目的</th>
                </tr>
              </thead>
              <tbody>
                {moduleData.module7_CssDeepDive.rules.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px', fontFamily: 'monospace', color: '#5A7D6C', fontWeight: 600 }}>{r.selector}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace', color: '#26343D' }}>{r.properties}</td>
                    <td style={{ padding: '8px', color: '#526B7B' }}>{r.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 模組 8: JS 互動 */}
        {activeTab === 8 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', marginBottom: '16px' }}>
              模組八：JavaScript DOM 操作與事件互動機制
            </h2>
            <p style={{ fontSize: '14px', color: '#526B7B', lineHeight: 1.6, marginBottom: '16px' }}>
              {moduleData.module8_JsInteractive.description}
            </p>
            {moduleData.module8_JsInteractive.codeSnippet && (
              <pre style={{ backgroundColor: '#26343D', color: '#FAF8F2', padding: '14px', borderRadius: '6px', fontSize: '13px' }}>
                <code>{moduleData.module8_JsInteractive.codeSnippet}</code>
              </pre>
            )}
          </div>
        )}

        {/* 模組 9: 講義補充 */}
        {activeTab === 9 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', marginBottom: '16px' }}>
              模組九：PDF 講義未涵蓋之現代技術知識補充
            </h2>
            <div style={{ display: 'grid', gap: '14px' }}>
              {moduleData.module9_PdfGaps.map((gap, idx) => (
                <div key={idx} style={{ border: '1px solid #D9E2EA', borderRadius: '8px', padding: '16px', backgroundColor: '#FAF8F2' }}>
                  <div style={{ fontWeight: 700, color: '#26343D', marginBottom: '8px' }}>📌 {gap.topic}</div>
                  <div style={{ fontSize: '13px', color: '#C05621', marginBottom: '6px' }}>
                    <strong>講義盲區：</strong>{gap.whatPdfMissed}
                  </div>
                  <div style={{ fontSize: '13px', color: '#2E7D32' }}>
                    <strong>現代標準：</strong>{gap.modernStandard}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 模組 10: 影音觀念補充 */}
        {activeTab === 10 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', marginBottom: '16px' }}>
              模組十：影音教學核心觀念與解題口訣
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {moduleData.module10_VideoInsights.map((vi, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: vi.status === 'VERIFIED_INSIGHT' ? '#EBF2EE' : '#F8FAFC',
                    border: '1px solid #CBD5E1',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#BDA77E', color: '#FFFFFF' }}>
                      [{vi.provenanceTag}]
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#26343D' }}>{vi.tip}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{vi.context}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 模組 11: 扣分排查 */}
        {activeTab === 11 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', marginBottom: '16px' }}>
              模組十一：考場常見錯誤與扣分防呆排查手冊
            </h2>
            <div style={{ display: 'grid', gap: '14px' }}>
              {moduleData.module11_TrapsAndTroubleshooting.map((trap, idx) => (
                <div key={idx} style={{ border: '1px solid #FED7D7', backgroundColor: '#FFF5F5', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#C53030', fontWeight: 700 }}>
                    <AlertTriangle size={16} />
                    <span>地雷點：{trap.trapTitle}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#742A2A', marginBottom: '6px' }}>
                    <strong>扣分後果：</strong>{trap.penalty}
                  </div>
                  <div style={{ fontSize: '13px', color: '#4A5568', marginBottom: '4px' }}>
                    <strong>檢測方式：</strong>{trap.detection}
                  </div>
                  <div style={{ fontSize: '13px', color: '#2E7D32', fontWeight: 600 }}>
                    <strong>修復方法：</strong>{trap.fix}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 模組 12: 測驗檢核 */}
        {activeTab === 12 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', marginBottom: '16px' }}>
              模組十二：自主檢核清單與單元即時隨堂測驗
            </h2>

            {/* 自我檢核表 */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontWeight: 700, color: '#26343D', marginBottom: '10px' }}>考前自我查核清單</div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {moduleData.module12_QuizzesAndChecklist.checklist.map((item, idx) => (
                  <label
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      backgroundColor: checkedItems[idx] ? '#EBF2EE' : '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#26343D',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedItems[idx]}
                      onChange={() => handleToggleChecklist(idx)}
                    />
                    <span>{item.replace(/^\[ \]\s*/, '')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 即時測驗 */}
            <div>
              <div style={{ fontWeight: 700, color: '#26343D', marginBottom: '10px' }}>重點小測驗</div>
              {moduleData.module12_QuizzesAndChecklist.quizzes.map((quiz, qIdx) => {
                const userAns = selectedAnswers[qIdx];
                const isAnswered = typeof userAns === 'number';
                const isCorrect = isAnswered && userAns === quiz.answerIndex;

                return (
                  <div
                    key={qIdx}
                    style={{
                      border: '1px solid #D9E2EA',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#26343D', marginBottom: '10px' }}>
                      Q{qIdx + 1}. {quiz.question}
                    </div>
                    <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
                      {quiz.options.map((opt, oIdx) => {
                        const isSelected = userAns === oIdx;
                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleSelectQuizOption(qIdx, oIdx)}
                            style={{
                              textAlign: 'left',
                              padding: '8px 12px',
                              backgroundColor: isSelected ? '#FAF8F2' : '#FFFFFF',
                              border: isSelected ? '2px solid #BDA77E' : '1px solid #CBD5E1',
                              borderRadius: '6px',
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
                    {isAnswered && (
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          backgroundColor: isCorrect ? '#EBF2EE' : '#FFF5F5',
                          color: isCorrect ? '#2E7D32' : '#C53030',
                          fontSize: '13px',
                        }}
                      >
                        <strong>{isCorrect ? '✓ 回答正確！' : '✗ 答錯了！'}</strong> {quiz.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 模組 13: 成果驗證 */}
        {activeTab === 13 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', marginBottom: '16px' }}>
              模組十三：最終成果預覽與檢定合格審查
            </h2>
            <div style={{ backgroundColor: '#FAF8F2', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 600, color: '#26343D', marginBottom: '6px' }}>合格標準</div>
              <p style={{ margin: 0, fontSize: '13px', color: '#526B7B' }}>
                {moduleData.module13_FinalPreviewAndAudit.passingScoreRule}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: 600, color: '#26343D', marginBottom: '8px' }}>繳交前最後確認</div>
              <ul style={{ paddingLeft: '20px', color: '#526B7B', fontSize: '13px', lineHeight: 1.8 }}>
                {moduleData.module13_FinalPreviewAndAudit.completionChecklist.map((chk, idx) => (
                  <li key={idx}>{chk}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => onOpenSandbox(taskId)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#5A7D6C',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Eye size={16} />
              <span>啟動多頁沙盒驗證成果</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
