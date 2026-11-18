import React, { useState, useEffect } from 'react';
import {
  Activity,
  FileText,
  Database,
  Server,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { StatCard, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  adminApi,
  AuditLogEntry,
  PaginationMeta,
  SystemHealthData,
} from '../../services/api';

interface SystemOpsDashboardPageProps {
  onOpenTeacherApply?: () => void;
}

export const SystemOpsDashboardPage: React.FC<SystemOpsDashboardPageProps> = ({ onOpenTeacherApply }) => {
  const { openAuth } = useAuth();
  const { goToHome, goToAdminDashboard } = useNavigation();

  // Active Subsystem Tab: 'health' | 'audit'
  const [activeTab, setActiveTab] = useState<'health' | 'audit'>('health');

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

  const fetchAuditLogs = async (page = auditPagination.page) => {
    setLoadingAudit(true);
    setAuditError(null);
    try {
      const res = await adminApi.listAuditLogs(page, 20);
      if (res.success && res.data) {
        setAuditLogs(res.data.logs);
        setAuditPagination(res.data.pagination);
      } else {
        setAuditError(res.error?.message || '無法取得審核日誌清單');
      }
    } catch {
      setAuditError('無法連線至審核日誌 API，請確認網路連線');
    } finally {
      setLoadingAudit(false);
    }
  };

  const fetchHealth = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const res = await adminApi.getHealth();
      if (res.success && res.data) {
        setHealthData(res.data);
      } else {
        setHealthError(res.error?.message || '伺服端健康狀態異常');
      }
    } catch {
      setHealthError('無法連接後端健康檢查探針');
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchAuditLogs(1);
  }, []);

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditActionFilter === 'ALL') return true;
    if (auditActionFilter === 'APPROVED') return log.action.includes('APPROVED');
    if (auditActionFilter === 'REJECTED') return log.action.includes('REJECTED');
    if (auditActionFilter === 'SECURITY') return log.action.includes('SECURITY') || log.action.includes('ALERT');
    return true;
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
              <a href="#admin" onClick={(e) => { e.preventDefault(); goToAdminDashboard(); }}>平台管理後台 (Level 4)</a>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>系統營運與維運後台 (Level 5 System Ops)</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#0F172A',
                    color: '#38BDF8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 700,
                  }}
                  aria-hidden="true"
                >
                  <Activity size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                      系統營運與維運主控台 (System Ops Console)
                    </h1>
                    <span className="badge badge-gold">維運最高隔離區 (Level 5)</span>
                    <span className="badge badge-neutral">受 ADMIN / OPS 權限保護</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    負責基礎設施健康探針、資料庫連線即時遙測與不可竄改安全日誌監控
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    fetchHealth();
                    fetchAuditLogs(auditPagination.page);
                  }}
                  disabled={loadingAudit || loadingHealth}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={14} className={loadingAudit || loadingHealth ? 'animate-spin' : ''} />
                  <span>刷新維運遙測數據</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => goToAdminDashboard()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={14} />
                  <span>返回平台管理 (Level 4)</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Level 5 Architecture Notice */}
        <div className="container" style={{ marginTop: '20px' }}>
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderLeft: '4px solid #0284C7',
              borderRadius: '6px',
              padding: '16px 20px',
              fontSize: '13px',
              color: '#334155',
              lineHeight: 1.6,
            }}
          >
            <strong>【Level 5 系統維運分工說明】</strong>
            依據五層架構規範，本層級獨立負責伺服端底層連線、硬體探針與資安審計事件；教學業務審查、班級治理與課程政策歸屬於 Level 4 平台管理。目前後端依既有 ADMIN 權限隔離，未來可於資料庫新增獨立維運專屬角色（SYSTEM_OPERATOR）。
          </div>
        </div>

        {/* Telemetry Stats Row */}
        <div className="container" style={{ marginTop: '20px' }}>
          <div className="stats-row">
            <StatCard
              label="伺服端連線狀態"
              value={loadingHealth ? '探針連線中...' : healthData?.status === 'healthy' ? 'Healthy 正常' : 'Degraded 降級'}
              icon={Server}
              iconColor={healthData?.status === 'healthy' ? '#0284C7' : '#DC2626'}
              subText="公開健康探針 (/api/health)"
            />
            <StatCard
              label="資料庫 SELECT 1 探針"
              value={loadingHealth ? '測量中...' : healthData?.database.status === 'connected' ? '連線暢通' : '連線異常'}
              icon={Database}
              iconColor={healthData?.database.status === 'connected' ? '#16A34A' : '#DC2626'}
              subText={
                healthData?.database.latencyMs != null
                  ? `即時往返延遲 ${healthData.database.latencyMs} ms`
                  : 'PostgreSQL Session Pooler'
              }
            />
            <StatCard
              label="安全審計日誌總計"
              value={loadingAudit ? '...' : String(auditPagination.total)}
              unit="筆"
              icon={FileText}
              iconColor="#475569"
              subText="不可竄改事件 (真實 API)"
            />
            <StatCard
              label="平緩降級保護機制"
              value="已啟用"
              icon={ShieldCheck}
              iconColor="#16A34A"
              subText="外部相依失效時啟用離線緩存"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'health' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('health')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Activity size={14} />
              <span>系統健康探針與平緩降級 (P16-ADM-006)</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('audit')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={14} />
              <span>不可竄改安全日誌 (P16-ADM-005)</span>
            </button>
          </div>
        </div>

        {/* Tab 1: System Health */}
        {activeTab === 'health' && (
          <div className="container" style={{ marginTop: '24px' }}>
            {loadingHealth && (
              <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                <div style={{ width: '24px', height: '24px', border: '3px solid #CBD5E1', borderTopColor: '#0284C7', borderRadius: '50%', margin: '0 auto 12px auto', animation: 'spin 0.8s linear infinite' }} />
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Server size={18} color="#0284C7" />
                    <span>伺服端探針報告</span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '13px' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>服務識別名稱</div>
                      <div style={{ fontWeight: 600, marginTop: '4px' }}>{healthData.service || 'CODE TO KNOW API'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>整體健康狀態</div>
                      <div style={{ fontWeight: 600, marginTop: '4px', color: healthData.status === 'healthy' ? '#16A34A' : '#DC2626' }}>
                        {healthData.status}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>探針採樣時間戳記</div>
                      <div style={{ fontWeight: 600, marginTop: '4px' }}>{new Date(healthData.timestamp).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>資料庫連線狀態</div>
                      <div style={{ fontWeight: 600, marginTop: '4px', color: healthData.database.status === 'connected' ? '#16A34A' : '#DC2626' }}>
                        {healthData.database.status} ({healthData.database.latencyMs ?? 'N/A'} ms)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} color="#16A34A" />
                    <span>平緩降級 (Graceful Degradation) 策略說明</span>
                  </h3>
                  <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                    當外部雲端服務（如 LLM API、雲端資料庫或外部郵件閘道）發生暫時性斷線或配額耗盡時，CODE TO KNOW 系統將啟動本機降級保護模式：
                  </p>
                  <ul style={{ fontSize: '13px', lineHeight: 1.8, color: 'var(--text-secondary)', paddingLeft: '20px' }}>
                    <li><strong>AI 學習教練</strong>：即時切換至本機 4 階鷹架規則引擎，維持核心教學連續性。</li>
                    <li><strong>學科題庫與模擬考</strong>：直接由打包之靜態結構化題庫提供測驗，不中斷學員練習。</li>
                    <li><strong>學習歷程紀錄</strong>：優先寫入本機安全 LocalStorage 緩存，待連線復原後自動補傳同步。</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Audit Logs */}
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
                共 {auditPagination.total} 筆防竄改稽核紀錄 (第 {auditPagination.page} / {auditPagination.totalPages} 頁)
              </span>
            </div>

            {loadingAudit && (
              <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                <div style={{ width: '24px', height: '24px', border: '3px solid #CBD5E1', borderTopColor: '#0284C7', borderRadius: '50%', margin: '0 auto 12px auto', animation: 'spin 0.8s linear infinite' }} />
                <span>正在讀取系統防竄改安全日誌...</span>
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
                      style={{ minHeight: '44px', minWidth: '44px', padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
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
                      style={{ minHeight: '44px', minWidth: '44px', padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
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
      </main>

      <Footer />
    </div>
  );
};
