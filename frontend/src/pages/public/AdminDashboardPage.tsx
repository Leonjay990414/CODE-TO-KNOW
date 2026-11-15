import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  X,
  Database,
  Server,
  Lock,
  Search,
  School,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { StatCard, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  adminApi,
  AdminTeacherApplicationWithUser,
  AuditLogEntry,
  PaginationMeta,
  SystemHealthData,
} from '../../services/api';

interface AdminDashboardPageProps {
  onOpenTeacherApply?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onOpenTeacherApply }) => {
  const { openAuth } = useAuth();
  const { goToHome } = useNavigation();

  // Active Admin Subsystem Tab
  const [activeTab, setActiveTab] = useState<
    'applications' | 'governance' | 'classrooms' | 'audit' | 'health' | 'standards' | 'policies'
  >('applications');

  // Teacher Applications State
  const [appStatusFilter, setAppStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [appSearchQuery, setAppSearchQuery] = useState<string>('');
  const [applications, setApplications] = useState<AdminTeacherApplicationWithUser[]>([]);
  const [appPagination, setAppPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loadingApps, setLoadingApps] = useState<boolean>(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  // Review Action State
  const [reviewModalApp, setReviewModalApp] = useState<AdminTeacherApplicationWithUser | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNote, setReviewNote] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [auditPagination, setAuditPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // System Health State
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Feedback Notification
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // 1. Fetch Applications
  const fetchApplications = async (statusFilter = appStatusFilter, page = appPagination.page) => {
    setLoadingApps(true);
    setAppsError(null);
    try {
      const statusParam = statusFilter === 'ALL' ? undefined : statusFilter;
      const res = await adminApi.listTeacherApplications(statusParam, page, 10);
      if (res.success && res.data) {
        setApplications(res.data.applications);
        setAppPagination(res.data.pagination);
        if (statusFilter === 'PENDING') {
          setPendingCount(res.data.pagination.total);
        }
      } else {
        setAppsError(res.error?.message || '載入教師申請列表失敗');
      }
    } catch {
      setAppsError('無法連線至管理端 API，請確認管理員登入憑證有效性');
    } finally {
      setLoadingApps(false);
    }
  };

  // 2. Fetch Audit Logs
  const fetchAuditLogs = async (page = auditPagination.page) => {
    setLoadingAudit(true);
    setAuditError(null);
    try {
      const res = await adminApi.listAuditLogs(page, 20);
      if (res.success && res.data) {
        setAuditLogs(res.data.logs);
        setAuditPagination(res.data.pagination);
      } else {
        setAuditError(res.error?.message || '載入系統日誌失敗');
      }
    } catch {
      setAuditError('無法連線至審核日誌 API，請確認網路連線');
    } finally {
      setLoadingAudit(false);
    }
  };

  // 3. Fetch Health
  const fetchHealth = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const res = await adminApi.getHealth();
      if (res.success && res.data) {
        setHealthData(res.data);
      } else {
        setHealthError(res.error?.message || '無法取得系統營運指標');
      }
    } catch {
      setHealthError('健康檢查端點連線異常');
    } finally {
      setLoadingHealth(false);
    }
  };

  // Initial tab loading
  useEffect(() => {
    fetchHealth();
    fetchAuditLogs(1);
    fetchApplications('PENDING', 1);
  }, []);

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchApplications(appStatusFilter, 1);
    } else if (activeTab === 'audit') {
      fetchAuditLogs(1);
    } else if (activeTab === 'health') {
      fetchHealth();
    }
  }, [activeTab]);

  const handleApprove = (app: AdminTeacherApplicationWithUser) => {
    setReviewModalApp(app);
    setReviewAction('approve');
    setReviewNote('審核通過，已開通教師教學主控台權限');
    setReviewFeedback(null);
  };

  const handleReject = (app: AdminTeacherApplicationWithUser) => {
    setReviewModalApp(app);
    setReviewAction('reject');
    setReviewNote('資料不足，請補齊在職證明或檢定輔導聘書');
    setReviewFeedback(null);
  };

  const submitReviewDecision = async () => {
    if (!reviewModalApp) return;
    setSubmittingReview(true);
    setReviewFeedback(null);
    try {
      let res;
      if (reviewAction === 'approve') {
        res = await adminApi.approveTeacherApplication(reviewModalApp.id, reviewNote);
      } else {
        res = await adminApi.rejectTeacherApplication(reviewModalApp.id, reviewNote);
      }

      if (res.success) {
        setFeedbackMessage(
          reviewAction === 'approve'
            ? `✓ 已成功核准 ${reviewModalApp.user?.displayName || '教師'} 的教學資格`
            : `✓ 已退回 ${reviewModalApp.user?.displayName || '教師'} 的申請`
        );
        setTimeout(() => setFeedbackMessage(null), 3500);
        setReviewModalApp(null);
        fetchApplications(appStatusFilter, appPagination.page);
        fetchAuditLogs(1);
      } else {
        setReviewFeedback(res.error?.message || '審核操作失敗');
      }
    } catch {
      setReviewFeedback('網路連線逾時，無法提交審核');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filtered applications by search query
  const filteredApplications = applications.filter((app) => {
    if (!appSearchQuery.trim()) return true;
    const q = appSearchQuery.trim().toLowerCase();
    return (
      (app.user?.displayName && app.user.displayName.toLowerCase().includes(q)) ||
      (app.user?.email && app.user.email.toLowerCase().includes(q)) ||
      app.schoolName.toLowerCase().includes(q) ||
      app.subject.toLowerCase().includes(q)
    );
  });

  // Filtered audit logs by action
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditActionFilter === 'ALL') return true;
    return log.action.includes(auditActionFilter);
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
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>平台管理員與系統營運後台 (Admin Console)</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#1E293B',
                    color: '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 700,
                  }}
                  aria-hidden="true"
                >
                  <ShieldAlert size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                      平台管理員主控台 (Platform Admin Console)
                    </h1>
                    <span className="badge badge-gold">最高管理員角色 (ADMIN)</span>
                    <span className="badge badge-neutral">安全審核隔離區</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    負責教師人工審核、防篡改系統操作日誌查詢與即時營運健康度檢測（P16 平台管理員與系統營運）
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    fetchHealth();
                    fetchAuditLogs(auditPagination.page);
                    fetchApplications(appStatusFilter, appPagination.page);
                  }}
                  disabled={loadingApps || loadingAudit || loadingHealth}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  aria-label="重新整理管理面板資料"
                >
                  <RefreshCw size={14} className={loadingApps || loadingAudit || loadingHealth ? 'animate-spin' : ''} />
                  <span>整理全站數據</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Global Feedback Banner */}
        {feedbackMessage && (
          <div className="container" style={{ marginTop: '16px' }}>
            <div
              style={{
                backgroundColor: 'rgba(21, 128, 61, 0.1)',
                border: '1px solid #86EFAC',
                color: '#166534',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              role="alert"
            >
              <CheckCircle2 size={16} />
              <span>{feedbackMessage}</span>
            </div>
          </div>
        )}

        {/* Top Overview Stats Row (Batch 1 Architecture) */}
        <div className="container" style={{ marginTop: '20px' }}>
          <div className="stats-row">
            <StatCard
              label="待審核教師申請"
              value={loadingApps ? '...' : String(pendingCount)}
              unit="件"
              icon={Clock}
              iconColor="var(--color-brand-gold)"
              subText="待人工資格審核 (真實 API)"
            />
            <StatCard
              label="系統安全日誌"
              value={loadingAudit ? '...' : String(auditPagination.total)}
              unit="筆"
              icon={FileText}
              iconColor="var(--color-brand-deep-slate)"
              subText="不可竄改稽核事件 (真實 API)"
            />
            <StatCard
              label="資料庫連線探針"
              value={
                loadingHealth
                  ? '檢測中...'
                  : healthData?.database.status === 'connected'
                  ? '連線正常'
                  : '中斷或離線'
              }
              icon={Database}
              iconColor={healthData?.database.status === 'connected' ? '#2E7D32' : '#C62828'}
              subText={
                healthData?.database.latencyMs != null
                  ? `即時延遲 ${healthData.database.latencyMs}ms (SELECT 1)`
                  : '公開健康檢查探針'
              }
            />
            <StatCard
              label="全平台會員與班級"
              value="暫無統計"
              icon={Server}
              iconColor="var(--text-muted)"
              subText="全站帳號與班級大數據（需後端 API 支援）"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'applications' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('applications')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Users size={14} />
              <span>教師資格人工審核 (P16-ADM-001)</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'governance' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('governance')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ShieldAlert size={14} />
              <span>全平台帳號治理 (P16-ADM-007)</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'classrooms' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('classrooms')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <School size={14} />
              <span>全平台班級治理 (P16-ADM-008)</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('audit')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={14} />
              <span>系統操作安全日誌 (P16-ADM-005)</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'health' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('health')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Activity size={14} />
              <span>系統健康度探針 (P16-ADM-006)</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'standards' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('standards')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={14} />
              <span>題庫上架規範 (P16-ADM-002)</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'policies' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('policies')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Lock size={14} />
              <span>維運事件通報 (P16-ADM-004)</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Teacher Applications Review */}
        {activeTab === 'applications' && (
          <div className="container" style={{ marginTop: '24px' }}>
            {/* Filter and Search controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`btn btn-sm ${appStatusFilter === st ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => {
                      setAppStatusFilter(st);
                      fetchApplications(st, 1);
                    }}
                    style={{ fontSize: '12px' }}
                  >
                    {st === 'PENDING' && `待審核 (${pendingCount})`}
                    {st === 'APPROVED' && '已核准'}
                    {st === 'REJECTED' && '已退回'}
                    {st === 'ALL' && '全部申請'}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="搜尋申請人、學校或科目..."
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px 6px 30px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-default)',
                    }}
                  />
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  共 {appPagination.total} 筆申請記錄 (第 {appPagination.page} / {appPagination.totalPages} 頁)
                </span>
              </div>
            </div>

            {loadingApps && (
              <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                <div style={{ width: '24px', height: '24px', border: '3px solid #CBD5E1', borderTopColor: '#2563EB', borderRadius: '50%', margin: '0 auto 12px auto', animation: 'spin 0.8s linear infinite' }} />
                <span>正在載入教師申請列表...</span>
              </div>
            )}

            {!loadingApps && appsError && (
              <div className="card" style={{ padding: '20px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={20} />
                  <span>{appsError}</span>
                </div>
              </div>
            )}

            {!loadingApps && !appsError && filteredApplications.length === 0 && (
              <EmptyState
                icon={Users}
                title="查無符合條件的教師申請"
                description={`目前沒有符合「${appStatusFilter === 'PENDING' ? '待審核' : appStatusFilter}」或搜尋條件的教師身分申請案件。`}
              />
            )}

            {!loadingApps && !appsError && filteredApplications.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredApplications.map((app) => (
                  <div key={app.id} className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
                            {app.user?.displayName || '申請人姓名'}
                          </h3>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            ({app.user?.email || '無電子郵件'})
                          </span>
                          {app.status === 'PENDING' && (
                            <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={11} />
                              <span>待審核</span>
                            </span>
                          )}
                          {app.status === 'APPROVED' && (
                            <span className="badge badge-neutral" style={{ color: '#15803D', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={11} />
                              <span>已核准</span>
                            </span>
                          )}
                          {app.status === 'REJECTED' && (
                            <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={11} />
                              <span>已退回</span>
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.6 }}>
                          <div><strong>任教學校機構：</strong>{app.schoolName}</div>
                          <div><strong>專長授課科目：</strong>{app.subject}</div>
                          <div><strong>申請用途理由：</strong>{app.reason}</div>
                          {app.proofUrl && (
                            <div style={{ marginTop: '4px' }}>
                              <strong>證明文件連結：</strong>
                              <a
                                href={app.proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}
                              >
                                <span>檢視上傳證明文件</span>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                          {app.reviewNote && (
                            <div style={{ marginTop: '6px', color: '#B45309' }}>
                              <strong>管理員審核備註：</strong>{app.reviewNote}
                            </div>
                          )}
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          申請提交時間：{new Date(app.createdAt).toLocaleString()}
                        </div>
                      </div>

                      {/* Action buttons */}
                      {app.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApprove(app)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Check size={14} />
                            <span>核准資格</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleReject(app)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#DC2626' }}
                          >
                            <X size={14} />
                            <span>退回申請</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {appPagination.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => fetchApplications(appStatusFilter, appPagination.page - 1)}
                      disabled={appPagination.page <= 1}
                    >
                      <ChevronLeft size={14} />
                      <span>上一頁</span>
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                      第 {appPagination.page} / {appPagination.totalPages} 頁
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => fetchApplications(appStatusFilter, appPagination.page + 1)}
                      disabled={appPagination.page >= appPagination.totalPages}
                    >
                      <span>下一頁</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Platform Account Governance (P16-ADM-007) */}
        {activeTab === 'governance' && (
          <div className="container" style={{ marginTop: '24px' }}>
            <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <ShieldAlert size={20} color="var(--color-brand-deep-slate)" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  全平台帳號安全治理與權限覆蓋規範 (P16-ADM-007)
                </h3>
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid #BFDBFE',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: '#1E40AF',
                  lineHeight: 1.6,
                }}
              >
                <strong>【帳號安全邊界原則】</strong>
                全平台學生與教師帳號之註銷、停用、凍結或手動角色升級，屬於高影響資安行為。依據專案最小權限架構，高影響權限變更必須依賴伺服端專屬 User Governance API 與審計日誌保護。目前平台不提供未受保護之純前端假操作按鈕，確保資料庫與會員身分安全。
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '20px 0 12px 0' }}>
                平台已認證教師名冊（依據審核核准記錄）
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 8px' }}>教師姓名</th>
                      <th style={{ padding: '10px 8px' }}>帳號 Email</th>
                      <th style={{ padding: '10px 8px' }}>任教學校機構</th>
                      <th style={{ padding: '10px 8px' }}>專長領域</th>
                      <th style={{ padding: '10px 8px' }}>身分權限狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications
                      .filter((a) => a.status === 'APPROVED')
                      .map((app) => (
                        <tr key={app.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 600 }}>{app.user?.displayName || '教師'}</td>
                          <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{app.user?.email || 'N/A'}</td>
                          <td style={{ padding: '12px 8px' }}>{app.schoolName}</td>
                          <td style={{ padding: '12px 8px' }}>{app.subject}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span className="badge badge-neutral" style={{ color: '#15803D' }}>
                              已核准授權 (TEACHER)
                            </span>
                          </td>
                        </tr>
                      ))}
                    {applications.filter((a) => a.status === 'APPROVED').length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          目前清單中尚無已核准之教師記錄（請切換至教師資格審核分頁進行審閱）
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Platform Classroom Governance (P16-ADM-008) */}
        {activeTab === 'classrooms' && (
          <div className="container" style={{ marginTop: '24px' }}>
            <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <School size={20} color="var(--color-brand-deep-slate)" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  全平台班級治理與架構邊界 (P16-ADM-008)
                </h3>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid #FACC15',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#854D0E',
                  lineHeight: 1.6,
                }}
              >
                <strong>【班級數據治理與 Anti-IDOR 隔離原則】</strong>
                目前班級管理模組遵循嚴格的租戶數據隔離（Tenant Isolation）。為防止未授權越權，後端 <code>/api/classrooms</code> 僅允許各班建立者（導師）存取其所屬班級名冊。管理員全域跨班級審查端點（<code>GET /api/admin/classrooms</code>）為後續架構規劃項目；本主控台嚴格遵循後端授權規範，絕不以不安全的前端越權繞過伺服端防護。
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
                全平台班級治理模型規範（Classroom Governance Schema Spec）
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                後續版本開通全平台班級管理 API 時，管理員將可統一檢視並治理以下欄位結構：
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 8px' }}>欄位名稱</th>
                      <th style={{ padding: '10px 8px' }}>型別定義</th>
                      <th style={{ padding: '10px 8px' }}>管理員治理權限與用途說明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>班級唯一 ID (id)</td>
                      <td style={{ padding: '10px 8px' }}><code>UUID / String</code></td>
                      <td style={{ padding: '10px 8px' }}>班級主鍵，供後台精確檢索與違規封存</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>班級名稱 (name)</td>
                      <td style={{ padding: '10px 8px' }}><code>String(1..100)</code></td>
                      <td style={{ padding: '10px 8px' }}>如「資訊科 113-1 丙級檢定輔導班」</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>輔導職類 (certificationId)</td>
                      <td style={{ padding: '10px 8px' }}><code>String</code></td>
                      <td style={{ padding: '10px 8px' }}>對應 17300 網頁設計技術士職類</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>8 碼加入代碼 (joinCode)</td>
                      <td style={{ padding: '10px 8px' }}><code>String(8, Upper)</code></td>
                      <td style={{ padding: '10px 8px' }}>防混淆代碼，管理員具備重置代碼以防外洩之權限</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>班級導師 (creatorId)</td>
                      <td style={{ padding: '10px 8px' }}><code>User Relation</code></td>
                      <td style={{ padding: '10px 8px' }}>關聯至教師身分，確保責任明確</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>修課學員數 (memberCount)</td>
                      <td style={{ padding: '10px 8px' }}><code>Integer</code></td>
                      <td style={{ padding: '10px 8px' }}>即時修課人次統計，防止班級人數超出上限</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: System Audit Logs (P16-ADM-005) */}
        {activeTab === 'audit' && (
          <div className="container" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(['ALL', 'APPROVED', 'REJECTED', 'SECURITY'] as const).map((act) => (
                  <button
                    key={act}
                    type="button"
                    className={`btn btn-sm ${auditActionFilter === act ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setAuditActionFilter(act)}
                    style={{ fontSize: '12px' }}
                  >
                    {act === 'ALL' && '全部日誌'}
                    {act === 'APPROVED' && '核准事件'}
                    {act === 'REJECTED' && '退回事件'}
                    {act === 'SECURITY' && '安全警報'}
                  </button>
                ))}
              </div>

              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                共 {auditPagination.total} 筆防篡改稽核紀錄 (第 {auditPagination.page} / {auditPagination.totalPages} 頁)
              </span>
            </div>

            {loadingAudit && (
              <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                <div style={{ width: '24px', height: '24px', border: '3px solid #CBD5E1', borderTopColor: '#2563EB', borderRadius: '50%', margin: '0 auto 12px auto', animation: 'spin 0.8s linear infinite' }} />
                <span>正在讀取系統防篡改安全日誌...</span>
              </div>
            )}

            {!loadingAudit && auditError && (
              <div className="card" style={{ padding: '20px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={20} />
                  <span>{auditError}</span>
                </div>
              </div>
            )}

            {!loadingAudit && !auditError && filteredAuditLogs.length === 0 && (
              <EmptyState
                icon={FileText}
                title="目前尚無稽核日誌紀錄"
                description="系統中目前尚未產生符合篩選條件的操作稽核事件。"
              />
            )}

            {!loadingAudit && !auditError && filteredAuditLogs.length > 0 && (
              <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 8px' }}>操作時間</th>
                      <th style={{ padding: '10px 8px' }}>操作人員</th>
                      <th style={{ padding: '10px 8px' }}>安全動作 (Action)</th>
                      <th style={{ padding: '10px 8px' }}>客戶端 IP / 裝置</th>
                      <th style={{ padding: '10px 8px' }}>脫敏細節 (Details)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600 }}>{log.user?.displayName || '系統程序 / 訪客'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.user?.email || log.userId || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>
                          <span
                            className="badge badge-neutral"
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              backgroundColor: log.action.includes('APPROVED')
                                ? '#DCFCE7'
                                : log.action.includes('REJECTED')
                                ? '#FEE2E2'
                                : '#F1F5F9',
                              color: log.action.includes('APPROVED')
                                ? '#166534'
                                : log.action.includes('REJECTED')
                                ? '#991B1B'
                                : '#334155',
                            }}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <div>{log.ipAddress || '127.0.0.1'}</div>
                          <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px' }} title={log.userAgent || ''}>
                            {log.userAgent || 'Unknown UA'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <pre
                            style={{
                              margin: 0,
                              padding: '6px 10px',
                              backgroundColor: 'var(--surface-sunken)',
                              borderRadius: '4px',
                              fontSize: '11px',
                              maxHeight: '80px',
                              overflowY: 'auto',
                              maxWidth: '320px',
                            }}
                          >
                            {log.details ? JSON.stringify(log.details, null, 2) : '無額外參數'}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Audit Pagination */}
                {auditPagination.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => fetchAuditLogs(auditPagination.page - 1)}
                      disabled={auditPagination.page <= 1}
                    >
                      <ChevronLeft size={14} />
                      <span>上一頁</span>
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                      第 {auditPagination.page} / {auditPagination.totalPages} 頁
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => fetchAuditLogs(auditPagination.page + 1)}
                      disabled={auditPagination.page >= auditPagination.totalPages}
                    >
                      <span>下一頁</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: System Health & Availability (P16-ADM-006) */}
        {activeTab === 'health' && (
          <div className="container" style={{ marginTop: '24px' }}>
            <div
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid #BFDBFE',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#1E40AF',
                lineHeight: 1.6,
              }}
            >
              <strong>【健康檢查探針範疇說明】</strong>
              本健康檢查為伺服端公開匿名探針（<code>/api/health</code>，包含資料庫 <code>SELECT 1</code> 即時存活檢測與延遲回報）。本端點採最小資訊洩露原則，不暴露伺服器內部機密、連線字串或環境變數；本探針非分布式 APM 營運監控系統，未提供之獨立服務狀態不予虛報。
            </div>

            {loadingHealth && (
              <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                <div style={{ width: '24px', height: '24px', border: '3px solid #CBD5E1', borderTopColor: '#2563EB', borderRadius: '50%', margin: '0 auto 12px auto', animation: 'spin 0.8s linear infinite' }} />
                <span>正在檢測後端系統與資料庫連線健康度...</span>
              </div>
            )}

            {!loadingHealth && healthError && (
              <div className="card" style={{ padding: '20px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={20} />
                  <span>{healthError}</span>
                </div>
              </div>
            )}

            {!loadingHealth && !healthError && healthData && (
              <div>
                <div className="stats-row" style={{ marginBottom: '24px' }}>
                  <StatCard
                    label="系統整體健康狀態"
                    value={healthData.status === 'healthy' ? '正常運作 (Healthy)' : '降級運作 (Degraded)'}
                    icon={Activity}
                    iconColor={healthData.status === 'healthy' ? '#2E7D32' : '#C62828'}
                    subText={healthData.service}
                  />

                  <StatCard
                    label="資料庫連線狀態"
                    value={healthData.database.status}
                    icon={Database}
                    iconColor="var(--color-brand-deep-slate)"
                    subText="PostgreSQL 17 / SSL verify-full"
                  />

                  <StatCard
                    label="資料庫查詢往返延遲"
                    value={healthData.database.latencyMs !== null ? `${healthData.database.latencyMs}` : 'N/A'}
                    unit={healthData.database.latencyMs !== null ? 'ms' : ''}
                    icon={Server}
                    iconColor="var(--color-brand-gold)"
                    subText="即時 SELECT 1 探針"
                  />
                </div>

                <div className="card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                    伺服器節點環境資訊
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div><strong>服務識別：</strong>{healthData.service}</div>
                    <div><strong>伺服器回報時間戳：</strong>{new Date(healthData.timestamp).toLocaleString()}</div>
                    <div><strong>健康檢查探針端點：</strong><code>/api/health</code> (公開匿名狀態檢查，最小資訊洩露防護)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Question Bank & Curriculum Standards Audit (P16-ADM-002, P16-ADM-003) */}
        {activeTab === 'standards' && (
          <div className="container" style={{ marginTop: '24px' }}>
            <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={20} color="#15803D" />
                    <span>官方證照題庫與教材上架品質審核 (P16-ADM-002 / P16-ADM-003)</span>
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                    依據平台收錄原則：嚴格核對勞動部技能檢定中心官方測試參考資料，禁止未經授權第三方非官方版權資料或未核實 AI 題目直接上架。
                  </p>
                </div>
                <span className="badge badge-gold">合規審核基準：勞動部 113/114 現行版本</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '6px', backgroundColor: 'var(--surface-sunken)', borderLeft: '4px solid #15803D' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', marginBottom: '6px' }}>
                    17300 網頁設計丙級·學科題庫
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <div>• 官方試題代號：173003A17（全量 605 題）</div>
                    <div>• 單選 525 題 + 複選 80 題，工作項目 01~04 完整收錄</div>
                    <div>• 審核狀態：<span style={{ color: '#15803D', fontWeight: 700 }}>✓ 官方核實完成 (100%)</span></div>
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '6px', backgroundColor: 'var(--surface-sunken)', borderLeft: '4px solid #15803D' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', marginBottom: '6px' }}>
                    17300 網頁設計丙級·術科五大題組
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <div>• 官方試題代號：173003B12（題組 104301~104305）</div>
                    <div>• 包含官方 173003B13 素材索引（合計 114 個檔案完整校對）</div>
                    <div>• 審核狀態：<span style={{ color: '#15803D', fontWeight: 700 }}>✓ 官方素材與考點檢核表就緒（唯讀保護中）</span></div>
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '6px', backgroundColor: 'var(--surface-sunken)', borderLeft: '4px solid var(--color-brand-gold)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', marginBottom: '6px' }}>
                    90011 共通科目（職業安全衛生/資訊道德等）
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <div>• 官方代號：90006~90009 共同科目（4 科）</div>
                    <div>• 平台模考抽題演算法包含 16 題共同科目比率配置</div>
                    <div>• 審核狀態：<span style={{ color: 'var(--color-brand-gold)', fontWeight: 700 }}>● 依主管機關公佈題庫每年同步審核</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
                題庫上架發布防呆準則 (Publishing Guardrails)
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li><strong>禁止偽冒官方標籤：</strong> AI 生成練習題一律標示 <code>ai_practice</code>，嚴格禁止標註為 <code>official_verified</code>。</li>
                <li><strong>防竄改版本鎖定：</strong> 任何官方題目勘誤或題號調整，必須留存審查日誌（Audit Log）並註明出處 PDF 頁碼。</li>
                <li><strong>無障礙支援標準：</strong> 術科版型範例程式碼必須符合 W3C HTML5 語意化架構與 WCAG 2.1 AA 無障礙對比度規範。</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 7: Platform Policies & Escalation Matrix (P16-ADM-004, P16-ADM-010) */}
        {activeTab === 'policies' && (
          <div className="container" style={{ marginTop: '24px' }}>
            <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={20} color="var(--color-brand-deep-slate)" />
                <span>維運事件分級通報矩陣 (Operational Incident Escalation Matrix · P16-ADM-004)</span>
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
                針對教育科技平台之資安事件、服務異常與會員隱私洩露風險，制定嚴格之 4 級事件分級處理機制：
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '16px', borderRadius: '6px', borderLeft: '4px solid #DC2626', backgroundColor: 'var(--surface-sunken)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#DC2626' }}>P0 - 災難級 (Critical Data Breach / Full Outage)</span>
                    <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>通報時限：15 分鐘</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong>定義：</strong> 資料庫未授權外洩、認證憑證洩露、全站無法存取。<br />
                    <strong>行動：</strong> 立即啟動唯讀隔離，輪換 JWT Secret 與資料庫憑證，主動通報主管機關與受影響會員。
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '6px', borderLeft: '4px solid #EA580C', backgroundColor: 'var(--surface-sunken)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#EA580C' }}>P1 - 重大級 (Core Workflow Impaired)</span>
                    <span className="badge" style={{ backgroundColor: '#FFEDD5', color: '#EA580C' }}>通報時限：1 小時</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong>定義：</strong> 學生無法提交測驗成績、教師審核流程中斷、第三方郵件發信連續失敗。<br />
                    <strong>行動：</strong> 指派工程輪值調查 API 錯誤率，啟用離線降級緩存，每 30 分鐘更新進度。
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '6px', borderLeft: '4px solid #CA8A04', backgroundColor: 'var(--surface-sunken)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#CA8A04' }}>P2 - 次要級 (Non-Critical Function Anomaly)</span>
                    <span className="badge" style={{ backgroundColor: '#FEF9C3', color: '#854D0E' }}>通報時限：4 小時</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong>定義：</strong> AI 助教延遲超過 10 秒、題庫常模圖表渲染延遲、非關鍵 CSS 跑版。<br />
                    <strong>行動：</strong> 降級至靜態規則提示庫，納入次期 Patch 修正。
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '6px', borderLeft: '4px solid #2563EB', backgroundColor: 'var(--surface-sunken)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#2563EB' }}>P3 - 建議級 (Cosmetic / Improvement)</span>
                    <span className="badge" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>通報時限：24 小時</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong>定義：</strong> 文字錯別字、介面按鈕微互動未平滑、文檔標籤更新。<br />
                    <strong>行動：</strong> 進入一般 Sprint 迭代排程。
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
                維運降級與主動保護機制 (Degradation & Safeguards · P16-ADM-010)
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                當外部相依服務（如 Gemini API、外部 SMTP 或 CDN）發生網路中斷或配額耗盡時，平台將自動啟動 <strong>Graceful Degradation（平緩降級）</strong>：
                AI 助教切換為本地預置 4 階段認知鷹架提示，信件驗證保留驗證碼於安全日誌由管理員人工核對，確保存取不中斷，杜絕 500 內部伺服器崩潰。
              </p>
            </div>
          </div>
        )}

        {/* Modal: Review Decision */}
        {reviewModalApp && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-decision-title"
          >
            <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '24px', backgroundColor: '#FFFFFF' }}>
              <h3 id="review-decision-title" style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0' }}>
                {reviewAction === 'approve' ? '核准教師資格申請' : '退回教師資格申請'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                申請人：<strong>{reviewModalApp.user?.displayName}</strong> ({reviewModalApp.schoolName} - {reviewModalApp.subject})
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  審核備註與通知理由：
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-default)',
                    fontSize: '13px',
                  }}
                  maxLength={500}
                />
              </div>

              {reviewFeedback && (
                <div style={{ fontSize: '12px', color: '#DC2626', marginBottom: '12px' }}>
                  {reviewFeedback}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setReviewModalApp(null)}
                  disabled={submittingReview}
                >
                  取消
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${reviewAction === 'approve' ? 'btn-primary' : 'btn-outline'}`}
                  style={reviewAction === 'reject' ? { color: '#DC2626', borderColor: '#DC2626' } : {}}
                  onClick={submitReviewDecision}
                  disabled={submittingReview}
                >
                  {submittingReview ? '處理中...' : reviewAction === 'approve' ? '確認核准' : '確認退回'}
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
