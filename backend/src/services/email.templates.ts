/**
 * CODE TO KNOW (碼上學) - 系統通知與交易型郵件模板引擎
 * 支援 Phase 10: P10-EML-005 與 P10-EML-006 規範
 *
 * 嚴格遵循 DevSecOps 安全防護標準：
 * 1. 雙格式輸出：純文字 (text) 與 HTML (html) 格式，避免純 HTML 注入或郵件用戶端阻擋。
 * 2. 嚴格轉義 (escapeHtml)：對所有動態代入參數（使用者姓名、驗證碼、IP、登入時間等）執行安全編碼。
 * 3. 零洩漏原則：郵件模板中絕不包含資料庫連線、內部密鑰或未授權之內部路由。
 * 4. 品牌視覺一致性：採用碼上學官方品牌調性（溫潤象牙白 #F5F2EA、霧面藍灰 #8FA9B8、香檳金 #BDA77E、深石墨 #26343D）。
 */

export interface EmailRenderOutput {
  subject: string;
  text: string;
  html: string;
}

/**
 * 簡易 HTML 實體轉義函數，防止郵件客戶端跨站腳本攻擊 (XSS)
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * URL Scheme 安全過濾函數，阻擋 javascript:、data: 等危險協定注入
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '#';
  const trimmed = url.trim();
  // 僅允許 http:// 與 https:// 協定
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return '#';
}

/**
 * 標頭防注入函數，移除 CRLF (\r, \n) 防止 Email Header Injection
 */
export function sanitizeHeader(value: string): string {
  if (!value) return '';
  return value.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * 官方通用 Email HTML 骨架外框
 */
function wrapBrandEmailLayout(title: string, bodyContent: string, footerNote?: string): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif; background-color: #F5F2EA; margin: 0; padding: 24px; color: #26343D; line-height: 1.6; }
    .email-container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #D9E2EA; box-shadow: 0 4px 12px rgba(38, 52, 61, 0.05); }
    .email-header { background: #526B7B; padding: 24px 32px; text-align: center; color: #FFFFFF; }
    .email-header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .email-header .tagline { font-size: 12px; color: #D9E2EA; margin-top: 4px; }
    .email-body { padding: 32px; font-size: 15px; }
    .btn-action { display: inline-block; background-color: #BDA77E; color: #FFFFFF !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 20px 0; text-align: center; }
    .info-card { background: #FAF8F2; border-left: 4px solid #BDA77E; padding: 14px 18px; margin: 18px 0; border-radius: 0 6px 6px 0; font-size: 13px; color: #526B7B; }
    .email-footer { background: #EFECE3; padding: 20px 32px; font-size: 12px; color: #6C7F8C; text-align: center; border-top: 1px solid #D9D2C4; }
    .security-notice { font-size: 12px; color: #A24B46; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>碼上學｜CODE TO KNOW</h1>
      <div class="tagline">碼上學，學無止境 · Learn Beyond Limits</div>
    </div>
    <div class="email-body">
      ${bodyContent}
    </div>
    <div class="email-footer">
      <p style="margin: 0 0 8px 0;">此信件為系統自動發送，請勿直接回覆。</p>
      ${footerNote ? `<p style="margin: 0 0 8px 0;">${escapeHtml(footerNote)}</p>` : ''}
      <p style="margin: 0;">© ${new Date().getFullYear()} CODE TO KNOW 碼上學 AI 智慧學習與教育科技平台. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// =========================================================================
// P10-EML-005: 註冊驗證、密碼重設、登入安全提醒模板
// =========================================================================

export interface VerificationEmailParams {
  displayName: string;
  verificationUrl: string;
  expiresInMinutes?: number;
}

export function renderVerificationEmail(params: VerificationEmailParams): EmailRenderOutput {
  const name = escapeHtml(params.displayName || '親愛的學員');
  const safeUrl = sanitizeUrl(params.verificationUrl);
  const exp = params.expiresInMinutes || 30;

  const subject = sanitizeHeader(`【碼上學】請完成電子信箱驗證，開啟 AI 智慧學習之旅`);

  const text = `您好，${name}：\n\n感謝您註冊「碼上學 CODE TO KNOW」AI 智慧學習平台！\n請於 ${exp} 分鐘內點擊下方連結以啟用您的帳號：\n${safeUrl}\n\n若您未曾申請註冊，請忽略此信件。\n\n碼上學團隊 敬上`;

  const bodyContent = `
    <h2 style="font-size: 18px; color: #26343D; margin-top: 0;">歡迎加入碼上學！</h2>
    <p>親愛的 <strong>${name}</strong> 您好：</p>
    <p>感謝您註冊「碼上學 CODE TO KNOW」AI 智慧學習平台。為了保護您的帳號安全性，請於 <strong>${exp} 分鐘內</strong> 點擊下方按鈕以啟用帳號：</p>
    <div style="text-align: center;">
      <a href="${escapeHtml(safeUrl)}" class="btn-action" target="_blank" rel="noopener noreferrer">驗證我的電子郵件信箱</a>
    </div>
    <div class="info-card">
      <strong>連結無法點擊？</strong> 請複製以下網址至瀏覽器網址列開啟：<br>
      <span style="word-break: break-all; color: #526B7B;">${escapeHtml(safeUrl)}</span>
    </div>
    <p class="security-notice">⚠️ 若您並未註冊碼上學帳號，可能是他人誤填您的信箱，請忽略本信，您的帳號將不會被啟用。</p>
  `;

  return {
    subject,
    text,
    html: wrapBrandEmailLayout(subject, bodyContent),
  };
}

export interface PasswordResetEmailParams {
  displayName: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export function renderPasswordResetEmail(params: PasswordResetEmailParams): EmailRenderOutput {
  const name = escapeHtml(params.displayName || '使用者');
  const safeUrl = sanitizeUrl(params.resetUrl);
  const exp = params.expiresInMinutes || 15;

  const subject = sanitizeHeader(`【碼上學】重設您的帳號密碼請求`);

  const text = `您好，${name}：\n\n我們收到了重設您在碼上學帳號密碼的請求。\n請於 ${exp} 分鐘內點擊下方連結以設定新密碼：\n${safeUrl}\n\n若非您本人申請，請立即登入平台檢查帳號安全或聯繫客服。\n\n碼上學團隊 敬上`;

  const bodyContent = `
    <h2 style="font-size: 18px; color: #26343D; margin-top: 0;">密碼重設通知</h2>
    <p>親愛的 <strong>${name}</strong> 您好：</p>
    <p>我們收到了您要求重設「碼上學」帳號密碼的申請。請於 <strong>${exp} 分鐘內</strong> 點擊下方按鈕以重設新密碼：</p>
    <div style="text-align: center;">
      <a href="${escapeHtml(safeUrl)}" class="btn-action" target="_blank" rel="noopener noreferrer">前往重設帳號密碼</a>
    </div>
    <div class="info-card">
      <strong>安全提示：</strong> 密碼重設完成後，既有的所有裝置登入 Session 將自動失效以維護帳號安全。
    </div>
    <p class="security-notice">⚠️ 若非您本人申請重設密碼，請勿點擊連結，您的密碼仍然安全。</p>
  `;

  return {
    subject,
    text,
    html: wrapBrandEmailLayout(subject, bodyContent),
  };
}

export interface SecurityLoginAlertEmailParams {
  displayName: string;
  loginTime: string;
  ipAddress: string;
  userAgent: string;
  deviceType?: string;
}

export function renderSecurityLoginAlertEmail(params: SecurityLoginAlertEmailParams): EmailRenderOutput {
  const name = escapeHtml(params.displayName || '使用者');
  const time = escapeHtml(params.loginTime);
  const ip = escapeHtml(params.ipAddress);
  const ua = escapeHtml(params.userAgent);
  const device = escapeHtml(params.deviceType || '未識別裝置');

  const subject = `【安全警報】碼上學帳號在新裝置登入通知`;

  const text = `您好，${name}：\n\n您的碼上學帳號於 ${time} 在新環境登入成功。\n登入資訊：\n- 登入時間：${time}\n- 登入 IP：${ip}\n- 裝置環境：${ua}\n\n若非您本人操作，請儘速重設密碼以保護帳號安全。\n\n碼上學資安團隊 敬上`;

  const bodyContent = `
    <h2 style="font-size: 18px; color: #A24B46; margin-top: 0;">⚠️ 新登入活動安全提醒</h2>
    <p>親愛的 <strong>${name}</strong> 您好：</p>
    <p>您的碼上學帳號剛剛有一筆新的成功登入紀錄：</p>
    <div class="info-card" style="border-left-color: #A24B46;">
      <ul style="margin: 0; padding-left: 18px; line-height: 1.8;">
        <li><strong>登入時間：</strong>${time}</li>
        <li><strong>IP 位址：</strong>${ip}</li>
        <li><strong>登入裝置：</strong>${device}</li>
        <li><strong>用戶代理 (User Agent)：</strong><span style="font-size: 11px; word-break: break-all;">${ua}</span></li>
      </ul>
    </div>
    <p>若此登入為您本人操作，請安心使用，無需採取任何行動。</p>
    <p class="security-notice">⚠️ <strong>若您並未執行此操作</strong>，表示您的密碼可能已遭外洩！請立即前往平台修改密碼，並於個人設定中將所有登入連線強制登出。</p>
  `;

  return {
    subject,
    text,
    html: wrapBrandEmailLayout(subject, bodyContent),
  };
}

// =========================================================================
// P10-EML-006: 考試開始、補考、教師公告及系統維護通知模板
// =========================================================================

export interface ExamScheduledNotificationParams {
  studentName: string;
  examTitle: string;
  courseName: string;
  startTime: string;
  durationMinutes: number;
  examUrl: string;
}

export function renderExamScheduledEmail(params: ExamScheduledNotificationParams): EmailRenderOutput {
  const name = escapeHtml(params.studentName);
  const exam = escapeHtml(params.examTitle);
  const course = escapeHtml(params.courseName);
  const time = escapeHtml(params.startTime);
  const dur = params.durationMinutes;
  const safeUrl = sanitizeUrl(params.examUrl);

  const subject = sanitizeHeader(`【測驗通知】${params.examTitle || ''} 即將開始，請準時應考`);

  const text = `同學 ${name} 您好：\n\n您所修習的「${course}」已發布正式測驗：\n- 測驗名稱：${exam}\n- 開始時間：${time}\n- 作答限時：${dur} 分鐘\n\n應考連結：${safeUrl}\n請提早準備並確認網路連線穩定。\n\n碼上學教學團隊 敬上`;

  const bodyContent = `
    <h2 style="font-size: 18px; color: #26343D; margin-top: 0;">班級測驗發布通知</h2>
    <p>同學 <strong>${name}</strong> 您好：</p>
    <p>您所屬的「<strong>${course}</strong>」已排定線上測驗，詳情如下：</p>
    <div class="info-card">
      <ul style="margin: 0; padding-left: 18px; line-height: 1.8;">
        <li><strong>測驗科目：</strong>${exam}</li>
        <li><strong>開始時間：</strong>${time}</li>
        <li><strong>測驗限時：</strong>${dur} 分鐘（交卷後即時顯示診斷分析）</li>
      </ul>
    </div>
    <div style="text-align: center;">
      <a href="${escapeHtml(safeUrl)}" class="btn-action" target="_blank" rel="noopener noreferrer">前往線上測驗大廳</a>
    </div>
    <p style="font-size: 13px; color: #6C7F8C;">💡 考前叮嚀：測驗時請避免隨意切換分頁，系統具備切頁偵測與異常防作弊紀錄。</p>
  `;

  return {
    subject,
    text,
    html: wrapBrandEmailLayout(subject, bodyContent),
  };
}

export interface TeacherAnnouncementNotificationParams {
  recipientName: string;
  teacherName: string;
  className: string;
  announcementTitle: string;
  announcementContent: string;
  publishDate: string;
}

export function renderTeacherAnnouncementEmail(params: TeacherAnnouncementNotificationParams): EmailRenderOutput {
  const name = escapeHtml(params.recipientName);
  const teacher = escapeHtml(params.teacherName);
  const cls = escapeHtml(params.className);
  const title = escapeHtml(params.announcementTitle);
  const content = escapeHtml(params.announcementContent).replace(/\n/g, '<br>');
  const date = escapeHtml(params.publishDate);

  const cleanTitle = sanitizeHeader(params.announcementTitle || '');
  const subject = sanitizeHeader(`【班級公告】${params.className || ''} - ${cleanTitle}`);

  const text = `${name} 同學您好：\n\n指導教師 ${params.teacherName} 在「${params.className}」發布了重要公告：\n【${cleanTitle}】\n${params.announcementContent}\n\n發布日期：${date}\n\n碼上學班級學習中心`;

  const bodyContent = `
    <h2 style="font-size: 18px; color: #26343D; margin-top: 0;">班級教師重要公告</h2>
    <p>同學 <strong>${name}</strong> 您好：</p>
    <p>您的指導教師 <strong>${teacher}</strong> 在「<strong>${cls}</strong>」發布了最新公告：</p>
    <div class="info-card" style="border-left-color: #526B7B;">
      <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #26343D;">${title}</h3>
      <div style="color: #26343D; font-size: 14px; line-height: 1.7;">${content}</div>
      <div style="margin-top: 10px; font-size: 11px; color: #8FA9B8; text-align: right;">發布於：${date}</div>
    </div>
    <p style="font-size: 13px; color: #6C7F8C;">可直接登入碼上學學生學習中心檢視完整的課程與教學資源。</p>
  `;

  return {
    subject,
    text,
    html: wrapBrandEmailLayout(subject, bodyContent),
  };
}

export interface MaintenanceNotificationParams {
  recipientName: string;
  maintenanceTitle: string;
  startTime: string;
  endTime: string;
  affectedServices: string;
}

export function renderMaintenanceNotificationEmail(params: MaintenanceNotificationParams): EmailRenderOutput {
  const name = escapeHtml(params.recipientName);
  const title = escapeHtml(params.maintenanceTitle);
  const start = escapeHtml(params.startTime);
  const end = escapeHtml(params.endTime);
  const services = escapeHtml(params.affectedServices);

  const cleanTitle = sanitizeHeader(params.maintenanceTitle || '');
  const subject = sanitizeHeader(`【系統維護公告】${cleanTitle}`);

  const text = `親愛的會員 ${params.recipientName} 您好：\n\n為了提供更優質的學習體驗，碼上學平台將進行預定系統維護作業：\n- 維護時間：${start} 至 ${end}\n- 影響範圍：${services}\n\n維護期間相關服務可能暫時中斷，造成不便敬請見諒。\n\n碼上學營運團隊 敬上`;

  const bodyContent = `
    <h2 style="font-size: 18px; color: #B38634; margin-top: 0;">🛠️ 系統預定維護與升級公告</h2>
    <p>親愛的會員 <strong>${name}</strong> 您好：</p>
    <p>為了持續提升平台的穩定性與運算效能，我們將於以下時段進行系統升級維護：</p>
    <div class="info-card" style="border-left-color: #B38634; background: #FAF5EB;">
      <ul style="margin: 0; padding-left: 18px; line-height: 1.8;">
        <li><strong>維護項目：</strong>${title}</li>
        <li><strong>預計時間：</strong>${start} ～ ${end}</li>
        <li><strong>受影響服務：</strong>${services}</li>
      </ul>
    </div>
    <p style="font-size: 13px; color: #6C7F8C;">建議您提早保存進行中的程式沙盒練習進度與考試作答。維護完成後平台將立即恢復全功能運作。</p>
  `;

  return {
    subject,
    text,
    html: wrapBrandEmailLayout(subject, bodyContent),
  };
}
