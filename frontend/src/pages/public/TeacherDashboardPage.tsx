import React, { useState, useEffect } from 'react';
import {
  School,
  Users,
  Award,
  AlertCircle,
  Download,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  BookOpen,
  FileCheck2,
  Search,
  Layers,
  Bell,
  CheckSquare,
  Copy,
  Trash2,
  Info,
  X,
  Check,
  UserCheck,
  Gamepad2,
  Star,
  Edit3,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { StatCard, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  teacherApi,
  TeacherApplication,
  classroomApi,
  ClassroomItem,
  ClassroomMemberItem,
} from '../../services/api';
import { ALL_OFFICIAL_THEORY_QUESTIONS } from '../../data/questionBankAdapter';
import {
  UNIFIED_PRACTICAL_CURRICULUM_MAP,
  UnifiedTaskCurriculum,
  TaskStep,
} from '../../data/unifiedPracticalCurriculumData';
import {
  GameTypeKey,
  TeacherGameTask,
  GAME_TYPE_METADATA,
  getAssignedGameTasks,
  assignGameTask,
  updateGameTask,
  revokeGameTask,
  hasTeacherAssignmentPermission,
} from '../../utils/teacherGameTaskManager';

const UNIFIED_PRACTICAL_TASKS: UnifiedTaskCurriculum[] = Object.values(UNIFIED_PRACTICAL_CURRICULUM_MAP);

interface TeacherDashboardPageProps {
  onOpenTeacherApply?: () => void;
}

export const TeacherDashboardPage: React.FC<TeacherDashboardPageProps> = ({ onOpenTeacherApply }) => {
  const { user, openAuth } = useAuth();
  const { goToHome } = useNavigation();

  const userId = user?.id || 'demo-teacher';

  // Active view tab ('roster' | 'benchmark' | 'curriculum' | 'announcements' | 'game-tasks')
  const [activeTab, setActiveTab] = useState<'roster' | 'benchmark' | 'curriculum' | 'announcements' | 'game-tasks'>('roster');

  // Game Task Assignment States (P14-GAM-014 Local Prototype)
  const [assignedGameTasks, setAssignedGameTasks] = useState<TeacherGameTask[]>([]);
  const [selectedGameType, setSelectedGameType] = useState<GameTypeKey>('puzzle');
  const [selectedGameLevel, setSelectedGameLevel] = useState<number>(1);
  const [selectedTargetStars, setSelectedTargetStars] = useState<number>(2);
  const [taskDueDate, setTaskDueDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editStars, setEditStars] = useState<number>(2);
  const [editDueDate, setEditDueDate] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');

  // Teacher Application Status State
  const [application, setApplication] = useState<TeacherApplication | null>(null);
  const [loadingApp, setLoadingApp] = useState<boolean>(true);
  const [appError, setAppError] = useState<string | null>(null);

  // Classroom Management States
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState<boolean>(false);
  const [classroomsError, setClassroomsError] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Student Roster States
  const [members, setMembers] = useState<ClassroomMemberItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState<string>('');

  // Modals & Forms
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [createClassName, setCreateClassName] = useState('');
  const [createClassDesc, setCreateClassDesc] = useState('');
  const [createClassCertId, setCreateClassCertId] = useState('web-design-c');
  const [creatingClass, setCreatingClass] = useState(false);
  const [createClassError, setCreateClassError] = useState<string | null>(null);

  const [removeTargetMember, setRemoveTargetMember] = useState<ClassroomMemberItem | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  // Future feature notice modal
  const [futureNoticeTitle, setFutureNoticeTitle] = useState<string | null>(null);
  const [futureNoticeDesc, setFutureNoticeDesc] = useState<string | null>(null);

  // Immediate UI feedback
  const [copiedJoinCode, setCopiedJoinCode] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Curriculum Inspector Filter State
  const [curriculumMode, setCurriculumMode] = useState<'theory' | 'practical'>('theory');
  const [questionSearch, setQuestionSearch] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number>(0);

  // Announcements State with LocalStorage Persistence
  const ANNOUNCEMENTS_KEY = `ctk_teacher_announcements:${userId}`;
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; content: string; date: string }>>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(ANNOUNCEMENTS_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch {}
    return [
      {
        id: 'ann-1',
        title: '【檢定備戰】17300 網頁設計丙級第 1 梯次模擬測驗公告',
        content: '請全體修課同學於本週完成學科 605 題基礎題目自測，及格門檻為 60 分。',
        date: '2026-11-12',
      },
      {
        id: 'ann-2',
        title: '【術科提醒】題組一版型與跑馬燈自評查核重點',
        content: '請務必參照 35 項自評表，確認跑馬燈 31 字完全無錯漏字、字型為標楷體、顏色為藍色 (#0000FF)。',
        date: '2026-11-14',
      },
    ];
  });
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');

  // 1. Fetch Teacher Application
  const fetchApplication = async () => {
    setLoadingApp(true);
    setAppError(null);
    try {
      const res = await teacherApi.getMyApplication();
      if (res.success && res.data?.application) {
        setApplication(res.data.application);
      } else {
        setApplication(null);
      }
    } catch {
      setAppError('無法載入教師資格審核狀態，請檢查網路連線或稍後再試。');
    } finally {
      setLoadingApp(false);
    }
  };

  // 2. Fetch Teaching Classrooms
  const fetchTeachingClassrooms = async () => {
    setLoadingClassrooms(true);
    setClassroomsError(null);
    try {
      const res = await classroomApi.getMyTeachingClassrooms();
      if (res.success && res.data?.classrooms) {
        const list = res.data.classrooms;
        setClassrooms(list);
        if (list.length > 0) {
          setSelectedClassId((prev) => (prev && list.some((c) => c.id === prev) ? prev : list[0].id));
        } else {
          setSelectedClassId(null);
        }
      } else {
        setClassrooms([]);
        setSelectedClassId(null);
      }
    } catch {
      setClassroomsError('無法連線載入班級列表，請檢查網路連線或重整頁面。');
    } finally {
      setLoadingClassrooms(false);
    }
  };

  // 3. Fetch Members of Selected Classroom
  const fetchClassroomMembers = async (classId: string) => {
    if (!classId) {
      setMembers([]);
      return;
    }
    setLoadingMembers(true);
    setMembersError(null);
    try {
      const res = await classroomApi.getClassroomMembers(classId);
      if (res.success && res.data?.members) {
        setMembers(res.data.members);
      } else {
        setMembers([]);
      }
    } catch {
      setMembersError('無法載入學生名冊，請稍後再試。');
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchApplication();
    fetchTeachingClassrooms();
  }, [user]);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassroomMembers(selectedClassId);
    } else {
      setMembers([]);
    }
  }, [selectedClassId]);

  // 4. Create Classroom Handler
  const handleCreateClassroom = async () => {
    if (!createClassName.trim()) {
      setCreateClassError('請輸入班級名稱');
      return;
    }
    setCreatingClass(true);
    setCreateClassError(null);
    try {
      const res = await classroomApi.createClassroom({
        name: createClassName.trim(),
        description: createClassDesc.trim() || undefined,
        certificationId: createClassCertId,
      });
      if (res.success && res.data?.classroom) {
        const created = res.data.classroom;
        setClassrooms((prev) => [created, ...prev]);
        setSelectedClassId(created.id);
        setIsCreateClassModalOpen(false);
        setCreateClassName('');
        setCreateClassDesc('');
        setFeedbackMessage(`✓ 班級「${created.name}」建立成功！班級代碼為 ${created.joinCode}`);
        setTimeout(() => setFeedbackMessage(null), 4000);
      } else {
        setCreateClassError(res.error?.message || '建立班級失敗，請重試');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '建立班級發生錯誤';
      setCreateClassError(msg);
    } finally {
      setCreatingClass(false);
    }
  };

  // 5. Remove Student Member Handler
  const handleRemoveMember = async () => {
    if (!selectedClassId || !removeTargetMember) return;
    setRemovingMember(true);
    try {
      const res = await classroomApi.removeMember(selectedClassId, removeTargetMember.studentId);
      if (res.success) {
        setMembers((prev) => prev.filter((m) => m.studentId !== removeTargetMember.studentId));
        setClassrooms((prev) =>
          prev.map((c) =>
            c.id === selectedClassId ? { ...c, memberCount: Math.max(0, (c.memberCount || 1) - 1) } : c
          )
        );
        setFeedbackMessage(`✓ 已將學員「${removeTargetMember.displayName}」自班級移除。`);
        setTimeout(() => setFeedbackMessage(null), 3000);
        setRemoveTargetMember(null);
      } else {
        alert(res.error?.message || '移除學員失敗');
      }
    } catch {
      alert('移除學員失敗，請稍後再試。');
    } finally {
      setRemovingMember(false);
    }
  };

  // 6. Copy Join Code Helper
  const handleCopyJoinCode = (code: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(code);
      }
    } catch {}
    setCopiedJoinCode(code);
    setTimeout(() => setCopiedJoinCode(null), 2500);
  };

  // 7. Save Announcement Helper
  const handleSaveAnnouncement = () => {
    if (!newAnnTitle.trim() || !newAnnContent.trim()) {
      alert('請填寫公告主旨與內容');
      return;
    }
    const newEntry = {
      id: 'ann-' + Date.now(),
      title: newAnnTitle.trim(),
      content: newAnnContent.trim(),
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [newEntry, ...announcements];
    setAnnouncements(updated);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(updated));
      }
    } catch {}
    setNewAnnTitle('');
    setNewAnnContent('');
    setFeedbackMessage('✓ 教學備忘已儲存為本機草稿（尚未連線雲端公告廣播服務）');
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const isTeacherApproved = user?.roles.includes('TEACHER') || application?.status === 'APPROVED';

  // Game Task Handlers (P14-GAM-014 Local Prototype)
  useEffect(() => {
    if (selectedClassId) {
      setAssignedGameTasks(getAssignedGameTasks(selectedClassId, userId));
    } else {
      setAssignedGameTasks([]);
    }
  }, [selectedClassId, userId, activeTab]);

  const handleAssignGameTask = () => {
    if (!selectedClassId) {
      alert('請先選擇或建立教學班級！');
      return;
    }
    const hasPermission = hasTeacherAssignmentPermission(
      user?.roles?.includes('TEACHER') ? 'TEACHER' : ((user as any)?.role || 'STUDENT'),
      application?.status
    );
    if (!hasPermission && !isTeacherApproved) {
      alert('權限不足：僅有經認證核准之教師可指派班級遊戲作業！');
      return;
    }

    try {
      const task = assignGameTask(selectedClassId, {
        gameType: selectedGameType,
        levelId: selectedGameLevel,
        targetStars: selectedTargetStars,
        dueDate: taskDueDate,
        description: taskDescription.trim() || undefined,
        teacherId: userId,
      });
      setAssignedGameTasks((prev) => [task, ...prev.filter((t) => t.id !== task.id)]);
      setTaskDescription('');
      setFeedbackMessage(`✓ 成功為班級指派【${task.gameTitle} · 第 ${task.levelId} 關】作業！`);
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err) {
      console.error(err);
      alert('指派作業失敗');
    }
  };

  const handleUpdateGameTask = (taskId: string) => {
    if (!selectedClassId) return;
    const updated = updateGameTask(
      selectedClassId,
      taskId,
      {
        targetStars: editStars,
        dueDate: editDueDate,
        description: editDescription,
      },
      userId
    );
    if (updated) {
      setAssignedGameTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setEditingTaskId(null);
      setFeedbackMessage('✓ 作業設定已成功更新！');
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  const handleRevokeGameTask = (taskId: string) => {
    if (!selectedClassId) return;
    if (confirm('確定要撤銷此項遊戲作業嗎？')) {
      const success = revokeGameTask(selectedClassId, taskId, userId);
      if (success) {
        setAssignedGameTasks((prev) => prev.filter((t) => t.id !== taskId));
        setFeedbackMessage('✓ 該項遊戲作業已撤銷！');
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    }
  };

  // Derived current selected classroom
  const currentClass = classrooms.find((c) => c.id === selectedClassId);

  // Total students sum
  const totalStudentsCount = classrooms.reduce((sum, c) => sum + (c.memberCount || 0), 0);

  // Filtered members by search
  const filteredMembers = members.filter((m) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.trim().toLowerCase();
    return (
      m.displayName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.seatNumber && m.seatNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-base)' }}>
      <Navbar onOpenAuth={openAuth} onOpenTeacherApply={onOpenTeacherApply} />

      <main style={{ flex: 1, paddingBottom: 'var(--space-16)' }}>
        {/* Header Breadcrumbs */}
        <section style={{ backgroundColor: 'var(--surface-base)', borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-8) 0' }}>
          <div className="container">
            <nav className="breadcrumb-nav" aria-label="導覽路徑" style={{ marginBottom: '12px' }}>
              <a href="#hero" onClick={(e) => { e.preventDefault(); goToHome(); }}>首頁</a>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>教師教學管理中心 (Educator Dashboard)</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-brand-deep-slate)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 700,
                  }}
                  aria-hidden="true"
                >
                  <School size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                      {user?.displayName || '認證教師教學主控台'}
                    </h1>
                    {isTeacherApproved ? (
                      <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} />
                        <span>認證教師資格</span>
                      </span>
                    ) : application?.status === 'PENDING' ? (
                      <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        <span>資格審核中</span>
                      </span>
                    ) : application?.status === 'REJECTED' ? (
                      <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={12} />
                        <span>資格未核准</span>
                      </span>
                    ) : (
                      <span className="badge badge-neutral">一般學員</span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    負責檢定科目：17300 網頁設計丙級 <span aria-hidden="true">·</span> 11900 軟體設計丙級
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    fetchApplication();
                    fetchTeachingClassrooms();
                  }}
                  disabled={loadingApp || loadingClassrooms}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  title="重新整理班級與狀態"
                  aria-label="重新整理教師審核狀態與班級列表"
                >
                  <RefreshCw size={14} className={loadingApp || loadingClassrooms ? 'animate-spin' : ''} />
                  <span>整理狀態</span>
                </button>

                {isTeacherApproved && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setIsCreateClassModalOpen(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <PlusCircle size={15} />
                      <span>建立新教學班級</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setFutureNoticeTitle('班級模擬測驗派卷功能');
                        setFutureNoticeDesc('後端測驗指派 API（P15-TCH-006）目前待正式資料庫連線授權。現階段您可以透過班級公告，引導學員於「學生中心」直接進行全真 80 題計時模考驗收。');
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FileCheck2 size={15} />
                      <span>指派模擬測驗</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setFutureNoticeTitle('學生成績報表匯出功能');
                        setFutureNoticeDesc('後端個人成績同步端點（P15-TCH-007）開發中。此功能後續將提供班級各工作項目平均成績、及格率分析與 CSV / Excel 匯出。');
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Download size={15} />
                      <span>匯出成績報表</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Feedback Banner */}
        {feedbackMessage && (
          <div className="container" style={{ marginTop: '16px' }}>
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="#15803D" />
              <span>{feedbackMessage}</span>
            </div>
          </div>
        )}

        {/* Application Status Alert Card */}
        <div className="container" style={{ marginTop: '20px' }}>
          {loadingApp && (
            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F8FAFC' }}>
              <div style={{ width: '18px', height: '18px', border: '2px solid #CBD5E1', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: '13px', color: '#64748B' }}>正在檢查教師身分與申請審核狀態...</span>
            </div>
          )}

          {!loadingApp && appError && (
            <div className="card" style={{ padding: '16px 20px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#991B1B', fontSize: '13px' }}>
                <AlertCircle size={18} />
                <span>{appError}</span>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={fetchApplication} style={{ fontSize: '12px', padding: '4px 8px' }}>
                重試
              </button>
            </div>
          )}

          {!loadingApp && application && application.status === 'PENDING' && (
            <div className="card" style={{ padding: '18px 24px', backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Clock size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#92400E', margin: '0 0 6px 0' }}>
                    教師資格審核中 (Pending Verification)
                  </h3>
                  <p style={{ fontSize: '13px', color: '#78350F', margin: '0 0 8px 0', lineHeight: 1.6 }}>
                    您於 <strong>{new Date(application.createdAt).toLocaleDateString()}</strong> 提交的 <strong>{application.schoolName} ({application.subject})</strong> 教師資格申請已送達。管理員正於 1-3 個工作天內核對教師身分，審核通過後將自動啟用完整班級管理與測驗指派權限。
                  </p>
                  <div style={{ fontSize: '12px', color: '#B45309' }}>
                    申請理由：{application.reason}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loadingApp && application && application.status === 'APPROVED' && (
            <div className="card" style={{ padding: '16px 20px', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle2 size={20} color="#15803D" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }}>
                    教師資格已核准 <span aria-hidden="true">·</span> {application.schoolName} ({application.subject})
                  </span>
                  {application.reviewNote && (
                    <span style={{ fontSize: '12px', color: '#15803D', marginLeft: '12px' }}>
                      審核備註：{application.reviewNote}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {!loadingApp && application && application.status === 'REJECTED' && (
            <div className="card" style={{ padding: '18px 24px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <XCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#991B1B', margin: '0 0 6px 0' }}>
                    教師資格審核未通過
                  </h3>
                  <p style={{ fontSize: '13px', color: '#7F1D1D', margin: '0 0 10px 0' }}>
                    退回原因：{application.reviewNote || '請提供更完整的在職學校證明文件'}
                  </p>
                  {onOpenTeacherApply && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={onOpenTeacherApply}
                      style={{ fontSize: '12px' }}
                    >
                      重新提交申請
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {!loadingApp && !application && !isTeacherApproved && (
            <div className="card" style={{ padding: '18px 24px', backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <BookOpen size={20} color="var(--color-brand-deep-slate)" />
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      您目前為一般學員帳號，尚未開通教師權限
                    </span>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      各級學校、職訓機構與補習班教師可申請認證，取得班級學員學習進度追蹤與試卷指派功能。
                    </p>
                  </div>
                </div>
                {onOpenTeacherApply && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={onOpenTeacherApply}
                    style={{ fontSize: '12px' }}
                  >
                    申請教師資格
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Overview Stats Row */}
        <div className="container" style={{ marginTop: '20px' }}>
          <div className="stats-row">
            <StatCard
              label="已建立教學班級"
              value={String(classrooms.length)}
              unit="班"
              icon={School}
              iconColor="var(--color-brand-deep-slate)"
              subText="教學班級即時統計"
            />
            <StatCard
              label="指導修課人次"
              value={String(totalStudentsCount)}
              unit="人次"
              icon={Users}
              iconColor="var(--color-brand-gold)"
              subText="全班級加入學員累計人次（非獨立人數）"
            />
            <StatCard
              label="輔導證照項目"
              value="17300"
              subText="預設輔導職類（網頁設計丙級）"
              icon={Award}
              iconColor="#2E7D32"
            />
            <StatCard
              label="教學備忘草稿"
              value={String(announcements.length)}
              unit="則"
              icon={Bell}
              iconColor="var(--color-brand-deep-slate)"
              subText="本機草稿與備忘統計"
            />
          </div>
        </div>

        {/* View Selection Tabs */}
        <div className="container" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'roster' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('roster')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Users size={14} />
              <span>教學班級與學生名冊 ({classrooms.length} 班)</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'benchmark' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('benchmark')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FileCheck2 size={14} />
              <span>檢定常模分析與失分熱點 (Exam Diagnostics)</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'curriculum' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('curriculum')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Layers size={14} />
              <span>官方題庫與術科教材備課 (全 605 題)</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'announcements' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('announcements')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Bell size={14} />
              <span>教學備忘與草稿 ({announcements.length} 則)</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'game-tasks' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('game-tasks')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Gamepad2 size={14} />
              <span>遊戲化作業指派 (P14-GAM-014 展示原型)</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Classroom Management & Student Roster (Batch 2 & 3 Completion) */}
        {activeTab === 'roster' && (
          <div className="container" style={{ marginTop: '24px' }}>
            {loadingClassrooms ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <div>正在載入班級列表...</div>
              </div>
            ) : classroomsError ? (
              <div className="card" style={{ padding: '24px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} />
                    <span>{classroomsError}</span>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm" onClick={fetchTeachingClassrooms}>
                    重試
                  </button>
                </div>
              </div>
            ) : classrooms.length === 0 ? (
              <EmptyState
                icon={School}
                title="尚未建立任何教學班級"
                description="點擊下方按鈕即可建立您的第一個教學班級，系統將自動生成專屬的 8 位加入碼，提供給修課學生輸入加入！"
                actionLabel="立即建立教學班級"
                onAction={() => setIsCreateClassModalOpen(true)}
                actionIcon={PlusCircle}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }} className="teacher-grid">
                {/* Left Column: Classrooms List */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>我的教學班級</h3>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => setIsCreateClassModalOpen(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <PlusCircle size={13} />
                      <span>建班</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {classrooms.map((cls) => {
                      const isSelected = cls.id === selectedClassId;
                      return (
                        <div
                          key={cls.id}
                          onClick={() => setSelectedClassId(cls.id)}
                          style={{
                            padding: '16px',
                            borderRadius: 'var(--radius-md)',
                            border: isSelected ? '2px solid var(--color-brand-gold)' : '1px solid var(--border-default)',
                            backgroundColor: isSelected ? 'rgba(189, 167, 126, 0.08)' : 'var(--surface-base)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-charcoal)' }}>
                              {cls.name}
                            </span>
                            <span className="badge badge-slate" style={{ fontSize: '10px' }}>
                              代碼 {cls.joinCode}
                            </span>
                          </div>
                          {cls.description && (
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                              {cls.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <UserCheck size={13} />
                              <span>{cls.memberCount || 0} 位學員</span>
                            </span>
                            <span>{new Date(cls.createdAt).toLocaleDateString()} 建立</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Selected Classroom Roster & Details */}
                <div>
                  {currentClass ? (
                    <div>
                      {/* Class Details Banner */}
                      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--color-brand-charcoal)' }}>
                                {currentClass.name}
                              </h2>
                              <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                                {currentClass.certification?.name || '17300 網頁設計丙級'}
                              </span>
                            </div>
                            {currentClass.description && (
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 6px 0' }}>
                                {currentClass.description}
                              </p>
                            )}
                          </div>

                          {/* Join Code Card with Copy Action */}
                          <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--border-default)', textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>學生加入代碼</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontFamily: 'Consolas, monospace', fontSize: '18px', fontWeight: 800, color: 'var(--color-brand-deep-slate)', letterSpacing: '1px' }}>
                                {currentClass.joinCode}
                              </span>
                              <button
                                type="button"
                                className="btn btn-outline btn-xs"
                                onClick={() => handleCopyJoinCode(currentClass.joinCode)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                title="複製加入代碼"
                              >
                                {copiedJoinCode === currentClass.joinCode ? (
                                  <>
                                    <Check size={12} color="#15803D" />
                                    <span style={{ color: '#15803D' }}>已複製</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>複製</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                          <span>班級總人數：<strong>{members.length}</strong> 人</span>
                          <span>建立時間：{new Date(currentClass.createdAt).toLocaleDateString()}</span>
                          <span>狀態：<strong style={{ color: '#15803D' }}>進行中 (Active)</strong></span>
                        </div>
                      </div>

                      {/* Student Roster Section */}
                      <div className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={18} color="var(--color-brand-deep-slate)" />
                            <span>班級學員名冊 ({filteredMembers.length} 人)</span>
                          </h3>

                          {/* Member Search */}
                          <div style={{ position: 'relative', width: '220px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                              type="text"
                              placeholder="搜尋學員姓名、座號..."
                              value={memberSearch}
                              onChange={(e) => setMemberSearch(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 10px 6px 30px',
                                fontSize: '12px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-default)',
                              }}
                            />
                          </div>
                        </div>

                        {loadingMembers ? (
                          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                            <div style={{ fontSize: '13px' }}>正在載入學員名冊...</div>
                          </div>
                        ) : membersError ? (
                          <div style={{ padding: '16px', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: '4px', fontSize: '13px' }}>
                            {membersError}
                          </div>
                        ) : filteredMembers.length === 0 ? (
                          <div style={{ padding: '32px 16px', textAlign: 'center', backgroundColor: 'var(--surface-sunken)', borderRadius: '6px' }}>
                            <Users size={32} color="var(--color-brand-gold)" style={{ margin: '0 auto 10px', opacity: 0.7 }} />
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-charcoal)', marginBottom: '4px' }}>
                              {memberSearch ? '查無符合條件的學員' : '此班級目前尚無學員加入'}
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto', lineHeight: 1.6 }}>
                              {memberSearch
                                ? '請嘗試清除搜尋關鍵字。'
                                : `請將上方 8 碼班級加入代碼【${currentClass.joinCode}】發送給學生，學生登入後於「學生中心」輸入代碼即可自動完成班級綁定！`}
                            </p>
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                  <th style={{ padding: '10px 8px', width: '70px' }}>座號</th>
                                  <th style={{ padding: '10px 8px' }}>學員姓名</th>
                                  <th style={{ padding: '10px 8px' }}>登入帳號 / Email</th>
                                  <th style={{ padding: '10px 8px' }}>加入時間</th>
                                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>管理操作</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredMembers.map((m, idx) => (
                                  <tr key={m.enrollmentId || m.studentId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td style={{ padding: '12px 8px', fontFamily: 'Consolas, monospace', color: 'var(--text-secondary)' }}>
                                      {m.seatNumber || `#${idx + 1}`}
                                    </td>
                                    <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--color-brand-charcoal)' }}>
                                      {m.displayName}
                                    </td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                                      {m.email}
                                    </td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                                      {new Date(m.joinedAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                      <button
                                        type="button"
                                        className="btn btn-outline btn-xs"
                                        onClick={() => setRemoveTargetMember(m)}
                                        style={{ color: '#DC2626', borderColor: 'rgba(220, 38, 38, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                        title="自班級移除學員"
                                      >
                                        <Trash2 size={12} />
                                        <span>移出</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Benchmark Diagnostics & Error Hotspots */}
        {activeTab === 'benchmark' && (
          <div className="container" style={{ marginTop: '24px' }}>
            <div className="demo-banner" style={{ marginBottom: '24px' }}>
              <Sparkles size={16} />
              <span>
                <strong>17300 網頁設計丙級·歷屆常模統計基準：</strong>以下數據為全國檢定考場與試題常模診斷指標，提供授課教師作為班級弱點診斷與重點複習之教學參考，非單一特定班級之真實成績。
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }} className="teacher-grid">
              <div className="card" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} color="#C62828" />
                  <span>學科常模高頻失分題型統計 (Top Error Hotspots)</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'var(--surface-sunken)', padding: '16px', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #C62828' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', marginBottom: '6px' }}>
                      <span>#058 box-sizing 盒模型寬高計算</span>
                      <span style={{ color: '#C62828' }}>常模錯誤率 47%</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                      學生常將 padding 與 border 重複向外加，混淆了 <code>box-sizing: border-box</code> 與 <code>content-box</code> 的差異。建議課堂以彩色框線實作示範。
                    </p>
                  </div>

                  <div style={{ background: 'var(--surface-sunken)', padding: '16px', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #C62828' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', marginBottom: '6px' }}>
                      <span>#305 1024px 水平置中宣告</span>
                      <span style={{ color: '#C62828' }}>常模錯誤率 36%</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                      多數學生誤填 <code>text-align: center</code> 或想像中的 <code>float: center</code>。需再強調區塊元素定義寬度後使用 <code>margin: 0 auto</code> 的原理。
                    </p>
                  </div>

                  <div style={{ background: 'var(--surface-sunken)', padding: '16px', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #D97706' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', marginBottom: '6px' }}>
                      <span>#112 色彩十六進位代碼解析 (#RRGGBB)</span>
                      <span style={{ color: '#D97706' }}>常模錯誤率 28%</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                      學生對 RGB 數值與十六進位對應不熟練（如 #FF0000 為紅色、#00FF00 為綠色、#0000FF 為藍色）。
                    </p>
                  </div>
                </div>
              </div>

              <aside>
                <div className="card" style={{ padding: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={16} color="var(--color-brand-deep-slate)" />
                    <span>勞動部官方評分規範與教材參考</span>
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                    所有教材資料皆對齊勞動部勞動力發展署技能檢定中心 17300 網頁設計技術士評審手冊：
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'var(--surface-sunken)', borderRadius: '4px' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>173003B12 術科評分要點</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>扣分與零分嚴格查核清單</div>
                      </div>
                      <span className="badge badge-neutral" style={{ fontSize: '11px' }}>已內建於系統</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'var(--surface-sunken)', borderRadius: '4px' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>173003A17 學科 605 題解析庫</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>全量單選、複選官方題庫</div>
                      </div>
                      <span className="badge badge-gold" style={{ fontSize: '11px' }}>100% 完整收錄</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* Tab 3: Curriculum & Question Bank Inspector */}
        {activeTab === 'curriculum' && (
          <div className="container" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${curriculumMode === 'theory' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setCurriculumMode('theory')}
                >
                  學科 605 題題庫檢視
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${curriculumMode === 'practical' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setCurriculumMode('practical')}
                >
                  術科五大題組教材檢視
                </button>
              </div>

              {curriculumMode === 'theory' && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="搜尋題目關鍵字..."
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px 6px 30px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-default)',
                      }}
                    />
                  </div>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border-default)' }}
                  >
                    <option value="all">所有工作項目分類 (全 605 題)</option>
                    <option value="01">工作項目 01：作業準備 (236 題)</option>
                    <option value="02">工作項目 02：應用軟體安裝及使用 (233 題)</option>
                    <option value="03">工作項目 03：系統軟體安裝及使用 (71 題)</option>
                    <option value="04">工作項目 04：資訊及安全 (65 題)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Theory Questions List */}
            {curriculumMode === 'theory' && (
              <div>
                {(() => {
                  const filtered = ALL_OFFICIAL_THEORY_QUESTIONS.filter((q) => {
                    const matchSearch =
                      questionSearch === '' ||
                      q.question.toLowerCase().includes(questionSearch.toLowerCase()) ||
                      q.explanation.toLowerCase().includes(questionSearch.toLowerCase()) ||
                      String(q.officialNumber).includes(questionSearch);
                    const matchTopic = selectedTopic === 'all' || q.officialSection === selectedTopic;
                    return matchSearch && matchTopic;
                  });

                  if (filtered.length === 0) {
                    return (
                      <EmptyState
                        icon={BookOpen}
                        title="查無符合條件的學科題目"
                        description="請嘗試調整關鍵字或選擇其他工作項目分類。"
                      />
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        官方有效學科試題共 <strong>605</strong> 題（符合條件 <strong>{filtered.length}</strong> 題，顯示前 20 題供教師備課）：
                      </div>
                      {filtered.slice(0, 20).map((q) => (
                        <div key={q.id} className="card" style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span className="badge badge-gold" style={{ fontSize: '11px' }}>
                                官方題號 #{q.officialNumber}
                              </span>
                              <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                                工作項目 {q.officialSection}：{q.sectionName}
                              </span>
                              <span className="badge" style={{ fontSize: '11px', backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                                卷面頁次 P.{q.officialPage}
                              </span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#15803D', fontWeight: 700 }}>
                              官方正解：{q.correctAnswer}
                            </span>
                          </div>

                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.6 }}>
                            {q.question}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                            {q.options.map((opt) => (
                              <div
                                key={opt.key}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  backgroundColor: q.correctAnswer === opt.key ? 'rgba(21, 128, 61, 0.08)' : 'var(--surface-sunken)',
                                  border: q.correctAnswer === opt.key ? '1px solid #86EFAC' : '1px solid transparent',
                                  color: q.correctAnswer === opt.key ? '#166534' : 'var(--text-secondary)',
                                }}
                              >
                                <strong>({opt.key})</strong> {opt.text}
                              </div>
                            ))}
                          </div>

                          {q.explanation && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', backgroundColor: 'var(--surface-sunken)', padding: '10px 14px', borderRadius: '4px', lineHeight: 1.5 }}>
                              <strong>【教學解析導引】：</strong>{q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Practical Task Curriculum */}
            {curriculumMode === 'practical' && (
              <div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {UNIFIED_PRACTICAL_TASKS.map((t: UnifiedTaskCurriculum, idx: number) => (
                    <button
                      key={t.taskId}
                      type="button"
                      className={`btn btn-sm ${selectedTaskIndex === idx ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setSelectedTaskIndex(idx)}
                    >
                      {t.code} {t.title}
                    </button>
                  ))}
                </div>

                {(() => {
                  const task = UNIFIED_PRACTICAL_TASKS[selectedTaskIndex];
                  if (!task) return null;
                  const version = task.versionA;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                            {task.code}｜{task.title}（{version.subtitle}）
                          </h3>
                          <span className="badge badge-gold">
                            標準解題步驟：共 {version.steps.length} 階段 <span aria-hidden="true">·</span> 自評核對：{version.selfChecklist?.length || 0} 考點
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                          {version.sourceDescription}
                        </p>
                      </div>

                      {/* Step by step */}
                      <div className="card" style={{ padding: '24px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Layers size={16} />
                          <span>解題步驟教學大綱與驗證指標</span>
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {version.steps.map((st: TaskStep) => (
                            <div key={st.stepNumber} style={{ padding: '14px', borderRadius: '4px', backgroundColor: 'var(--surface-sunken)', borderLeft: '4px solid var(--color-brand-deep-slate)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                                <span>步驟 {st.stepNumber}：{st.title}</span>
                                <span style={{ color: 'var(--color-brand-gold-text)', fontSize: '12px' }}>教學目標</span>
                              </div>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.5 }}>
                                {st.purpose}
                              </p>
                              {st.verificationPoint && (
                                <div style={{ fontSize: '11px', color: '#15803D', fontWeight: 600 }}>
                                  ✓ 評分查核點：{st.verificationPoint}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Checklist */}
                      {version.selfChecklist && version.selfChecklist.length > 0 && (
                        <div className="card" style={{ padding: '24px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckSquare size={16} color="var(--color-brand-gold)" />
                            <span>全真評審查核清單 (Self Checklist <span aria-hidden="true">·</span> 共 {version.selfChecklist.length} 項)</span>
                          </h4>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                            {version.selfChecklist.map((item: string, i: number) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', padding: '8px 12px', backgroundColor: 'var(--surface-sunken)', borderRadius: '4px' }}>
                                <span style={{ color: 'var(--color-brand-deep-slate)', fontWeight: 700 }}>{i + 1}.</span>
                                <span style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Announcements & Teaching Notes */}
        {activeTab === 'announcements' && (
          <div className="container" style={{ marginTop: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }} className="teacher-grid">
              {/* Left: Published Announcements */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid #FACC15', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#854D0E', lineHeight: 1.5 }}>
                  <strong>【本機備忘與草稿功能提示】</strong> 目前公告僅儲存於當前瀏覽器本機（LocalStorage），供教師個人備課與記錄備忘，學生端尚未能直接同步讀取。全校/班級雲端公告推播功能將於後續波次對接後端 API。
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={18} color="var(--color-brand-gold)" />
                  <span>本機教學備忘與草稿清單 ({announcements.length} 則)</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {announcements.map((ann) => (
                    <div key={ann.id} style={{ padding: '16px', borderRadius: '6px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-sunken)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>{ann.title}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ann.date}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                        {ann.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Compose draft */}
              <aside>
                <div className="card" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
                    新增本機教學備忘草稿
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        備忘主旨標題：
                      </label>
                      <input
                        type="text"
                        value={newAnnTitle}
                        onChange={(e) => setNewAnnTitle(e.target.value)}
                        placeholder="例如：第三次模考指派與注意事項"
                        style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border-default)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        備忘內文說明：
                      </label>
                      <textarea
                        value={newAnnContent}
                        onChange={(e) => setNewAnnContent(e.target.value)}
                        placeholder="填寫教學備忘、應試提醒或作業繳交截止時間..."
                        rows={4}
                        style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border-default)' }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleSaveAnnouncement}
                      style={{ width: '100%', marginTop: '4px' }}
                    >
                      儲存本機備忘草稿
                    </button>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      提示：本資料持久化儲存於當前瀏覽器本機。後續雲端發布 API 連通後，將支援同步推播至班級學員端。
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* Tab 5: Game Task Assignment (P14-GAM-014 Local Prototype) */}
        {activeTab === 'game-tasks' && (
          <div className="container" style={{ marginTop: '24px' }}>
            {/* Prototype Transparency Notice Banner */}
            <div
              className="card"
              style={{
                padding: '16px 20px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Info size={20} color="#1D4ED8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1E40AF', margin: '0 0 4px 0' }}>
                    【本機展示原型】教師遊戲關卡作業指派系統 (P14-GAM-014)
                  </h4>
                  <p style={{ fontSize: '12px', color: '#1E3A8A', margin: 0, lineHeight: 1.6 }}>
                    此介面為教育遊戲作業指派之本機互動原型。作業資料以 <code>ctk_teacher_game_tasks:{'{teacherId}'}:{'{classroomId}'}</code> 格式實施教師與班級本機隔離存儲。本原型尚未介接雲端 Supabase 資料庫與班級即時推播 API，一般學員端展示模式亦不會受未授權指派干擾。
                  </p>
                </div>
              </div>
            </div>

            {/* Current Classroom Selection Header */}
            <div
              className="card"
              style={{
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <School size={18} color="var(--color-brand-deep-slate)" />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>目前作業指派目標班級：</span>
                <select
                  value={selectedClassId || ''}
                  onChange={(e) => setSelectedClassId(e.target.value || null)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-default)',
                    fontWeight: 600,
                  }}
                  aria-label="選擇目標班級"
                >
                  {classrooms.length === 0 && <option value="">(尚未建立任何教學班級)</option>}
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.memberCount || 0} 位學員)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                該班級目前已指派 <strong>{assignedGameTasks.length}</strong> 項關卡任務
              </div>
            </div>

            {/* Main Assignment Workspace Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px' }}>
              {/* Left Column: New Task Assignment Form */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <PlusCircle size={18} color="var(--color-brand-gold-text)" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    指派新遊戲關卡任務
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Select Game Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      選擇教育遊戲項目：
                    </label>
                    <select
                      value={selectedGameType}
                      onChange={(e) => {
                        const gt = e.target.value as GameTypeKey;
                        setSelectedGameType(gt);
                        setSelectedGameLevel(1);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '13px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      {(Object.keys(GAME_TYPE_METADATA) as GameTypeKey[]).map((key) => (
                        <option key={key} value={key}>
                          {GAME_TYPE_METADATA[key].name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Level */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      指派目標關卡（第 1 ～ {GAME_TYPE_METADATA[selectedGameType]?.maxLevel || 4} 關）：
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {Array.from({ length: GAME_TYPE_METADATA[selectedGameType]?.maxLevel || 4 }, (_, i) => i + 1).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          className={`btn btn-sm ${selectedGameLevel === lvl ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setSelectedGameLevel(lvl)}
                          style={{ flex: 1, minHeight: '44px' }}
                        >
                          第 {lvl} 關
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Stars */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      過關星級門檻要求：
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`btn btn-sm ${selectedTargetStars === star ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setSelectedTargetStars(star)}
                          style={{ flex: 1, minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <Star size={14} fill={selectedTargetStars === star ? 'currentColor' : 'none'} />
                          <span>{star} 星滿星</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      作業繳交截止日期：
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '13px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-default)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Notes / Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      學習重點與備註提示（選填）：
                    </label>
                    <textarea
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="例如：請同學注意排版浮動塌陷問題，嘗試以兩星以上過關..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '13px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-default)',
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAssignGameTask}
                    style={{
                      width: '100%',
                      minHeight: '44px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 600,
                    }}
                  >
                    <CheckSquare size={16} />
                    <span>確認發布指派至目前班級</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Currently Assigned Tasks List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    班級已發布遊戲作業清單
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    依時間倒序排列
                  </span>
                </div>

                {assignedGameTasks.length === 0 ? (
                  <div
                    className="card"
                    style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--surface-sunken)',
                    }}
                  >
                    <Gamepad2 size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                      此班級尚未指派任何遊戲關卡任務
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      請從左側表單選取關卡與目標星級，一鍵派送給全班學員自主演練。
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {assignedGameTasks.map((task) => {
                      const isEditing = editingTaskId === task.id;
                      return (
                        <div
                          key={task.id}
                          className="card"
                          style={{
                            padding: '18px 20px',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--surface-base)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: '#EFF6FF',
                                    color: '#1D4ED8',
                                  }}
                                >
                                  {task.gameTitle}
                                </span>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: '#FEF3C7',
                                    color: '#B45309',
                                  }}
                                >
                                  第 {task.levelId} 關
                                </span>
                              </div>
                              <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                目標：達成 {task.targetStars} 星通關
                              </h4>
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                              {!isEditing && (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => {
                                    setEditingTaskId(task.id);
                                    setEditStars(task.targetStars);
                                    setEditDueDate(task.dueDate);
                                    setEditDescription(task.description || '');
                                  }}
                                  style={{ fontSize: '11px', padding: '4px 8px', minHeight: '32px' }}
                                  aria-label="編輯作業"
                                >
                                  <Edit3 size={13} />
                                  <span>編輯</span>
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => handleRevokeGameTask(task.id)}
                                style={{ fontSize: '11px', padding: '4px 8px', minHeight: '32px', color: '#DC2626', borderColor: '#FCA5A5' }}
                                aria-label="撤銷作業"
                              >
                                <Trash2 size={13} />
                                <span>撤銷</span>
                              </button>
                            </div>
                          </div>

                          {isEditing ? (
                            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--surface-sunken)', borderRadius: '4px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>
                                    調整星級門檻：
                                  </label>
                                  <select
                                    value={editStars}
                                    onChange={(e) => setEditStars(Number(e.target.value))}
                                    style={{ width: '100%', padding: '4px 8px', fontSize: '12px' }}
                                  >
                                    <option value={1}>1 星即可</option>
                                    <option value={2}>2 星及格</option>
                                    <option value={3}>3 星滿星</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>
                                    調整截止日期：
                                  </label>
                                  <input
                                    type="date"
                                    value={editDueDate}
                                    onChange={(e) => setEditDueDate(e.target.value)}
                                    style={{ width: '100%', padding: '4px 8px', fontSize: '12px' }}
                                  />
                                </div>
                              </div>
                              <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>
                                  調整說明：
                                </label>
                                <input
                                  type="text"
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  style={{ width: '100%', padding: '4px 8px', fontSize: '12px' }}
                                />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => setEditingTaskId(null)}
                                  style={{ fontSize: '11px', minHeight: '32px' }}
                                >
                                  取消
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleUpdateGameTask(task.id)}
                                  style={{ fontSize: '11px', minHeight: '32px' }}
                                >
                                  儲存更新
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {task.description && (
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                                  {task.description}
                                </p>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                                <span>截止日期：{task.dueDate}</span>
                                <span>發布時間：{new Date(task.assignedAt).toLocaleDateString()}</span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Classroom */}
        {isCreateClassModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px',
            }}
            onClick={() => setIsCreateClassModalOpen(false)}
          >
            <div
              className="card"
              style={{
                maxWidth: '480px',
                width: '100%',
                padding: '28px',
                backgroundColor: 'var(--surface-base)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-brand-charcoal)' }}>
                  建立新教學班級
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateClassModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  aria-label="關閉建立班級視窗"
                >
                  <X size={18} />
                </button>
              </div>

              {createClassError && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '4px', fontSize: '12px', marginBottom: '16px' }}>
                  {createClassError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    班級名稱 <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={createClassName}
                    onChange={(e) => setCreateClassName(e.target.value)}
                    placeholder="例如：高一資訊科技甲班、114秋季輔導班"
                    style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border-default)' }}
                    autoFocus
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    輔導檢定科目
                  </label>
                  <select
                    value={createClassCertId}
                    onChange={(e) => setCreateClassCertId(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border-default)' }}
                  >
                    <option value="web-design-c">17300 網頁設計丙級技術士</option>
                    <option value="software-design-c">11900 軟體設計丙級技術士</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    班級說明（選填）
                  </label>
                  <textarea
                    value={createClassDesc}
                    onChange={(e) => setCreateClassDesc(e.target.value)}
                    placeholder="例如：第一梯次檢定專用輔導班，每週四實習課..."
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border-default)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setIsCreateClassModalOpen(false)}
                  disabled={creatingClass}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleCreateClassroom}
                  disabled={creatingClass}
                >
                  {creatingClass ? '建立中...' : '確認建立班級'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirm Remove Student */}
        {removeTargetMember && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px',
            }}
            onClick={() => setRemoveTargetMember(null)}
          >
            <div
              className="card"
              style={{
                maxWidth: '420px',
                width: '100%',
                padding: '24px',
                backgroundColor: 'var(--surface-base)',
                borderRadius: 'var(--radius-lg)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#DC2626', marginBottom: '14px' }}>
                <AlertCircle size={22} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  確認將學員移出班級？
                </h3>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                確定要將學員 <strong>【{removeTargetMember.displayName}】</strong>（{removeTargetMember.email}）自目前班級中移除嗎？此操作將解除該學生與此教學班級之綁定。
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setRemoveTargetMember(null)}
                  disabled={removingMember}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleRemoveMember}
                  disabled={removingMember}
                  style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
                >
                  {removingMember ? '處理中...' : '確認移出'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Feature Notice (Explaining features in roadmap rather than alert) */}
        {futureNoticeTitle && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px',
            }}
            onClick={() => setFutureNoticeTitle(null)}
          >
            <div
              className="card"
              style={{
                maxWidth: '440px',
                width: '100%',
                padding: '24px',
                backgroundColor: 'var(--surface-base)',
                borderRadius: 'var(--radius-lg)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Info size={20} color="var(--color-brand-deep-slate)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-brand-charcoal)' }}>
                  {futureNoticeTitle}
                </h3>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                {futureNoticeDesc}
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setFutureNoticeTitle(null)}
                >
                  我知道了
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
