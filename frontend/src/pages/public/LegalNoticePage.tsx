import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Sparkles,
  ArrowLeft,
  Scale,
  HelpCircle,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useNavigation } from '../../context/NavigationContext';

export type LegalTab = 'privacy' | 'terms' | 'ethics';

interface LegalNoticePageProps {
  initialTab?: LegalTab;
  onOpenTeacherApply?: () => void;
}

export const LegalNoticePage: React.FC<LegalNoticePageProps> = ({
  initialTab = 'privacy',
  onOpenTeacherApply,
}) => {
  const { route, goToHome } = useNavigation();
  const [activeTab, setActiveTab] = useState<LegalTab>(() => {
    return route.legalTab || initialTab;
  });

  useEffect(() => {
    if (route.legalTab) {
      setActiveTab(route.legalTab);
    }
  }, [route.legalTab]);

  const handleTabChange = (tab: LegalTab) => {
    setActiveTab(tab);
    if (tab === 'privacy') {
      window.location.hash = '#privacy';
    } else if (tab === 'terms') {
      window.location.hash = '#terms';
    } else {
      window.location.hash = '#legal';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-ivory, #F5F2EA)' }}>
      <Navbar onOpenTeacherApply={onOpenTeacherApply} />

      <main style={{ flex: 1, paddingTop: 'calc(var(--navbar-height, 72px) + 24px)', paddingBottom: '64px' }}>
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* Back & Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-muted, #526B7B)' }}>
            <button
              onClick={() => goToHome()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted, #526B7B)',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '14px',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-brand-slate, #2C3E50)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted, #526B7B)')}
            >
              <ArrowLeft size={16} />
              返回首頁
            </button>
            <span>/</span>
            <span style={{ color: 'var(--color-brand-slate, #2C3E50)', fontWeight: 600 }}>平台政策與法規聲明</span>
          </div>

          {/* Header Banner */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '36px 32px',
              marginBottom: '32px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(143, 169, 184, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', backgroundColor: 'rgba(189, 167, 126, 0.15)', color: 'var(--color-brand-gold, #BDA77E)', width: 'fit-content', fontSize: '13px', fontWeight: 600 }}>
              <Scale size={16} />
              資訊透明・個資保護・教學倫理
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-brand-charcoal, #1E293B)', margin: 0, lineHeight: 1.3 }}>
              碼上學｜平台政策與使用條款
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary, #526B7B)', lineHeight: 1.7, margin: 0, maxWidth: '850px' }}>
              歡迎參閱碼上學（CODE TO KNOW）的隱私權政策、使用者服務條款與 AI 使用倫理聲明。我們堅持以最高資安標準保護您的學習資產與個人隱私，並秉持「AI 輔助思考，不取代思考」之核心理念。
            </p>
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-muted, #8FA9B8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={14} />
              版本：v1.0 初稿（待正式法律顧問審閱）｜最後更新日期：2026 年 11 月 13 日
            </div>
          </div>

          {/* Tabs Navigation */}
          <div
            role="tablist"
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '28px',
              borderBottom: '2px solid rgba(143, 169, 184, 0.2)',
              paddingBottom: '2px',
              overflowX: 'auto',
            }}
          >
            <button
              role="tab"
              aria-selected={activeTab === 'privacy'}
              onClick={() => handleTabChange('privacy')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                fontSize: '15px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                backgroundColor: activeTab === 'privacy' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'privacy' ? 'var(--color-brand-charcoal, #1E293B)' : 'var(--color-text-muted, #526B7B)',
                borderBottom: activeTab === 'privacy' ? '3px solid var(--color-brand-gold, #BDA77E)' : '3px solid transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <ShieldCheck size={18} color={activeTab === 'privacy' ? 'var(--color-brand-gold, #BDA77E)' : 'currentColor'} />
              隱私權保護政策 (Privacy Policy)
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'terms'}
              onClick={() => handleTabChange('terms')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                fontSize: '15px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                backgroundColor: activeTab === 'terms' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'terms' ? 'var(--color-brand-charcoal, #1E293B)' : 'var(--color-text-muted, #526B7B)',
                borderBottom: activeTab === 'terms' ? '3px solid var(--color-brand-gold, #BDA77E)' : '3px solid transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <FileText size={18} color={activeTab === 'terms' ? 'var(--color-brand-gold, #BDA77E)' : 'currentColor'} />
              使用者服務條款 (Terms of Service)
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'ethics'}
              onClick={() => handleTabChange('ethics')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                fontSize: '15px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                backgroundColor: activeTab === 'ethics' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'ethics' ? 'var(--color-brand-charcoal, #1E293B)' : 'var(--color-text-muted, #526B7B)',
                borderBottom: activeTab === 'ethics' ? '3px solid var(--color-brand-gold, #BDA77E)' : '3px solid transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Sparkles size={18} color={activeTab === 'ethics' ? 'var(--color-brand-gold, #BDA77E)' : 'currentColor'} />
              AI 使用倫理聲明 (AI Ethics)
            </button>
          </div>

          {/* Tab Content Body */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '40px 36px',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.03)',
              border: '1px solid rgba(143, 169, 184, 0.2)',
              fontSize: '15px',
              lineHeight: 1.8,
              color: 'var(--color-brand-charcoal, #2C3E50)',
            }}
          >
            {activeTab === 'privacy' && <PrivacyPolicyContent />}
            {activeTab === 'terms' && <TermsOfServiceContent />}
            {activeTab === 'ethics' && <AIEthicsContent />}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

/* --- TAB 1: PRIVACY POLICY --- */
const PrivacyPolicyContent: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>
          一、平台與政策適用範圍
        </h2>
        <p>
          本隱私權政策適用於「碼上學」（CODE TO KNOW，以下簡稱本平台）所提供之官方網站、公開展示預覽系統、學科題庫、術科實作工作區、AI 智慧助教及教師教學管理後台。
        </p>
        <p>
          若您點選本平台頁面中由第三方獨立經營之外部連結（如考照主管機關官網、外部參考資源），該等網站之個人資料蒐集與處理應適用其個別隱私權條款，非本政策涵蓋範疇。
        </p>
      </div>

      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>
          二、我們蒐集的個人資料類型
        </h2>
        <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong>基本帳號資料</strong>：電子郵件地址（Email）、使用者顯示名稱、密碼（系統使用 bcrypt 單向安全雜湊加鹽保存，無明文存檔）。</li>
          <li><strong>身分角色與審核資料</strong>：學員（STUDENT）、認證教師（TEACHER）及教師審核申請資訊（機構名稱、專業證明）。</li>
          <li><strong>學習歷程與互動資訊</strong>：學科作答選項、模擬考交卷成績、術科程式碼暫存、錯題本、收藏題及學習時數統計。</li>
          <li><strong>系統與連線技術紀錄</strong>：連線 IP 位址、瀏覽器類型、裝置解析度及伺服器端操作稽核日誌（Audit Log，機敏資訊自動遮蔽）。</li>
        </ul>
      </div>

      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>
          三、個人資料儲存架構與透明揭露（工程現況）
        </h2>
        <div style={{ backgroundColor: '#F8FAFC', padding: '16px 20px', borderRadius: '10px', borderLeft: '4px solid #8FA9B8', marginBottom: '12px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#334155' }}>
            <strong>【現況誠實揭露】</strong>：本平台目前公開預覽站（GitHub Pages）主要採用本地展示模式（Demo Mode），示範角色與題庫進度僅儲存於您的瀏覽器本地（LocalStorage/SessionStorage），關閉瀏覽器即可清除。正式後端 API 與雲端資料庫（Supabase/Render）尚處於隔離測試階段，未對外開放大規模生產寫入。
          </p>
        </div>
        <p>
          正式資料庫採用嚴格的角色存取控制（RBAC）與物件屬主檢查（IDOR 防護），所有正式備份均依 C2KB 規格實施 AES-256-GCM 密碼學加密儲存。
        </p>
      </div>

      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>
          四、Cookie 與本地儲存技術之用途
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F1F5F9', textAlign: 'left' }}>
              <th style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>技術名稱</th>
              <th style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>代表鍵值</th>
              <th style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>實際用途</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>HTTP Cookie</td>
              <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}><code>c2k_session</code>, <code>c2k_csrf</code></td>
              <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>維持使用者登入狀態與 CSRF 資安跨站防護</td>
            </tr>
            <tr>
              <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>LocalStorage</td>
              <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}><code>ctk_demo_user</code></td>
              <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>於靜態預覽站中暫存示範學員／教師切換狀態</td>
            </tr>
            <tr>
              <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>SessionStorage</td>
              <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}><code>intended_route</code></td>
              <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>記錄登入前目標路由，於驗證後自動導回原頁面</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>
          五、使用者個人資料權利與未成年人保護
        </h2>
        <p>
          依個人資料保護法規定，您得隨時向本平台申請查詢、閱覽、製給複製本、補充、更正、停止處理利用或請求刪除您的個人帳號及相關紀錄。
        </p>
        <p>
          未成年人使用本平台應由法定代理人或學校師長陪同指導。本平台絕不將學生個人資料轉作任何外部商業廣告或行銷分析用途。
        </p>
      </div>

      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', fontSize: '13px', color: '#64748B' }}>
        聯絡窗口：<code>contact@codetoknow.edu</code>（官方預留信箱）｜詳細完整條款請參閱 <code>docs/legal/PRIVACY_POLICY.md</code>。
      </div>
    </div>
  );
};

/* --- TAB 2: TERMS OF SERVICE --- */
const TermsOfServiceContent: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>
          一、服務接受與五層架構說明
        </h2>
        <p>
          歡迎使用碼上學（CODE TO KNOW）。本服務條款為您與本平台間之正式規範。
          本平台劃分為五層服務架構：公開宣傳網站（第 1 層）、學生學習平台（第 2 層）、教師管理後台（第 3 層）、平台管理後台（第 4 層）及系統營運中心（第 5 層）。不同層級均有獨立角色驗證與權限邊界。
        </p>
      </div>

      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>
          二、使用者守則與禁止事項
        </h2>
        <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong>學術誠信守則</strong>：嚴禁在正式測驗或認證考試中利用外掛程式、機器人腳本自動化答題或竄改交卷成績。</li>
          <li><strong>系統與資安防護</strong>：嚴禁對本平台執行任何未經授權之滲透掃描、DDoS 阻斷攻擊或利用越權漏洞存取他人資料。</li>
          <li><strong>帳號管理責任</strong>：個人帳號嚴禁轉借、轉售或與他人共用，使用者應對其帳號發生之一切操作承擔責任。</li>
          <li><strong>智慧財產權尊重</strong>：未經許可不得擅自批次爬取、重製或商業轉售本平台自編教材與介面原始碼。</li>
        </ul>
      </div>

      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>
          三、智慧財產權歸屬與官方試題合理使用
        </h2>
        <p>
          本平台引用之各類國家檢定試題（如網頁設計丙級技術士學術科題目），其版權與出處屬相關政府主管機關所有。本平台本於教學推廣與輔導之合理使用原則進行學習化編排，非屬商業轉售商品。使用者自撰之實作程式碼，著作權仍歸使用者本人所有。
        </p>
      </div>

      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>
          四、服務中斷、免責聲明與準據法
        </h2>
        <p>
          本平台依「現況」及「現有技術」提供服務。我們將盡合理努力維持系統穩定與數據安全，但因伺服器例行維護、網路故障或不可抗力事件所生之暫時性中斷，本平台不負衍生之損害賠償責任。
        </p>
        <p>
          本條款以中華民國法律為準據法。若因本服務產生爭端，雙方同意以臺灣臺北地方法院為第一審管轄法院。
        </p>
      </div>

      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', fontSize: '13px', color: '#64748B' }}>
        詳細完整條款請參閱 <code>docs/legal/TERMS_OF_SERVICE.md</code>。
      </div>
    </div>
  );
};

/* --- TAB 3: AI ETHICS DISCLOSURE --- */
const AIEthicsContent: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Sparkles size={22} color="var(--color-brand-gold, #BDA77E)" />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
            核心原則：AI 輔助思考，不取代思考
          </h2>
        </div>
        <p style={{ fontSize: '16px', color: '#334155', fontWeight: 500 }}>
          「碼上學，學無止境。｜Learn Beyond Limits.」—— 真正的軟體工程能力來自深入的理解與反覆除錯實踐，而非複製貼上 AI 生成的現成代碼。
        </p>
      </div>

      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>
          一、四階段引導法（Cognitive Scaffolding）
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>第 1 階：觀念聚焦</div>
            <div style={{ fontSize: '14px', color: '#64748B' }}>釐清計算思維與核心定義，定位問題發生之本質。</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>第 2 階：思考破題</div>
            <div style={{ fontSize: '14px', color: '#64748B' }}>引導學習者回顧排版與邏輯結構，提出自我反思。</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>第 3 階：邊界提點</div>
            <div style={{ fontSize: '14px', color: '#64748B' }}>指出考場規格陷阱、解析度適應與常見扣分細節。</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>第 4 階：完整解構</div>
            <div style={{ fontSize: '14px', color: '#64748B' }}>在充分思考後提供完整代碼範例與現代化最佳實踐。</div>
          </div>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>
          二、AI 生成內容之侷限性與真實查核
        </h2>
        <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong>可能存在幻覺（Hallucination）</strong>：大型語言模型生成之內容具備機率性，可能存在語法過時或解答不精確之情況，學習者應以實際執行結果與官方手冊為準。</li>
          <li><strong>隱私與安全防護</strong>：請勿在 AI 對話介面中輸入個人機敏資料（如帳號、密碼、個資）。</li>
          <li><strong>示範原型誠實揭露</strong>：本平台展示站目前使用精選考題本地引導示範，在正式商業 API 連線完成前，絕不虛假宣稱具備全雲端即時即答功能。</li>
        </ul>
      </div>

      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', fontSize: '13px', color: '#64748B' }}>
        詳細完整規範請參閱 <code>docs/legal/AI_ETHICS_DISCLOSURE.md</code>。
      </div>
    </div>
  );
};
