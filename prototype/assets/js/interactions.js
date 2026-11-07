/**
 * CODE TO KNOW (碼上學) Prototype - Interactive Behaviors
 * Compatible with local file:// execution without ES modules or external fetch.
 */

(function () {
  'use strict';

  // 1. Prototype Toast Notification Helper
  var toastTimer = null;
  window.showPrototypeToast = function (message) {
    var toast = document.getElementById('prototype-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'prototype-toast';
      toast.className = 'prototype-toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML = '<span>✦ <strong>原型展示提示</strong>：' + (message || '此功能在正式版中將連接完整雲端運算與資料庫。') + '</span>';
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 3500);
  };

  // 2. IntersectionObserver for Soft Fade-In Animations
  function initFadeInObserver() {
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
            }
          });
        },
        { threshold: 0.08 }
      );

      document.querySelectorAll('.fade-in-section').forEach(function (section) {
        observer.observe(section);
      });
    } else {
      // Fallback for older browsers
      document.querySelectorAll('.fade-in-section').forEach(function (section) {
        section.classList.add('is-visible');
      });
    }
  }

  // 3. AI Scaffolding 4-Step Interactive Switcher (Homepage)
  function initScaffoldingDemo() {
    var tabList = document.querySelector('.scaffolding-level-grid');
    if (!tabList || !window.PROTOTYPE_DATA || !window.PROTOTYPE_DATA.scaffoldingSteps) return;

    var steps = window.PROTOTYPE_DATA.scaffoldingSteps;
    var tabs = tabList.querySelectorAll('[role="tab"]');
    var statusTitle = document.getElementById('scaffolding-title');
    var promptEl = document.getElementById('scaffolding-prompt');
    var replyEl = document.getElementById('scaffolding-reply');
    var benefitEl = document.getElementById('scaffolding-benefit');

    function selectStep(stepNumber) {
      var stepData = steps[stepNumber - 1];
      if (!stepData) return;

      tabs.forEach(function (tab, idx) {
        var isTarget = idx === (stepNumber - 1);
        tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
        tab.tabIndex = isTarget ? 0 : -1;
        if (isTarget) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      if (statusTitle) statusTitle.textContent = '分階段引導情境模擬：' + stepData.name;
      if (promptEl) promptEl.textContent = '“' + stepData.question + '”';
      if (replyEl) replyEl.textContent = stepData.reply;
      if (benefitEl) benefitEl.textContent = '教育設計目標：' + stepData.benefit;
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        selectStep(index + 1);
      });

      tab.addEventListener('keydown', function (e) {
        var newIndex = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          newIndex = (index + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          newIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
          newIndex = 0;
        } else if (e.key === 'End') {
          newIndex = tabs.length - 1;
        }

        if (newIndex !== -1) {
          e.preventDefault();
          tabs[newIndex].focus();
          selectStep(newIndex + 1);
        }
      });
    });
  }

  // 4. Dual Audience Switcher (Homepage)
  function initDualAudienceToggle() {
    var studentBtn = document.getElementById('toggle-student-btn');
    var teacherBtn = document.getElementById('toggle-teacher-btn');
    var studentPanel = document.getElementById('panel-student-experience');
    var teacherPanel = document.getElementById('panel-teacher-experience');

    if (!studentBtn || !teacherBtn || !studentPanel || !teacherPanel) return;

    studentBtn.addEventListener('click', function () {
      studentBtn.classList.add('active');
      teacherBtn.classList.remove('active');
      studentPanel.style.display = 'block';
      teacherPanel.style.display = 'none';
    });

    teacherBtn.addEventListener('click', function () {
      teacherBtn.classList.add('active');
      studentBtn.classList.remove('active');
      studentPanel.style.display = 'none';
      teacherPanel.style.display = 'block';
    });
  }

  // 5. Certification Center Search & Filter Engine (certifications.html)
  function initCertificationsEngine() {
    var container = document.getElementById('certifications-cards-grid');
    var searchInput = document.getElementById('cert-search-input');
    var categoryPills = document.querySelectorAll('.cert-category-pill');
    var disciplinePills = document.querySelectorAll('.cert-discipline-pill');
    var countBadge = document.getElementById('cert-total-count');
    var emptyState = document.getElementById('cert-empty-state');
    var resetBtn = document.getElementById('cert-reset-filters');

    if (!container || !window.PROTOTYPE_DATA || !window.PROTOTYPE_DATA.certifications) return;

    var allCerts = window.PROTOTYPE_DATA.certifications;
    var currentCategory = 'all';
    var currentDiscipline = 'all';
    var searchKeyword = '';

    // Relative path helper based on whether we are at root or in /pages/
    var isInsidePages = window.location.pathname.indexOf('/pages/') !== -1;
    var pathPrefix = isInsidePages ? '' : 'pages/';

    function renderCards(certs) {
      if (!certs || certs.length === 0) {
        container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        if (countBadge) countBadge.textContent = '0';
        return;
      }

      container.style.display = 'grid';
      if (emptyState) emptyState.style.display = 'none';
      if (countBadge) countBadge.textContent = certs.length;

      var html = '';
      certs.forEach(function (c) {
        var detailHref = pathPrefix + (c.detailLink ? c.detailLink.replace('pages/', '') : 'certification-detail.html?id=' + c.id);
        var mockExamHref = pathPrefix + (c.mockExamLink ? c.mockExamLink.replace('pages/', '') : 'mock-exam.html?id=' + c.id);
        var practicalHref = pathPrefix + (c.practicalLink ? c.practicalLink.replace('pages/', '') : 'practical-learning.html?id=' + c.id);

        html += '<div class="cert-card ' + (c.isFeatured ? 'featured' : '') + '">';
        html += '  <div>';
        html += '    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">';
        if (c.isComingSoon) {
          html += '      <span class="badge badge-slate" style="font-size: 11px;">COMING SOON</span>';
        } else {
          html += '      <span class="badge badge-gold" style="font-size: 11px;">' + c.badgeText + '</span>';
        }
        html += '      <span style="font-size: 11px; font-weight: 700; color: var(--color-brand-deep-slate); font-family: var(--font-mono);">' + c.code + '</span>';
        html += '    </div>';
        html += '    <h3 class="text-h3" style="font-size: 18px; margin-bottom: 6px;">' + c.name + '</h3>';
        html += '    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">等級標準：' + c.level + ' · ' + c.categoryName + '</div>';
        html += '    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 14px;">' + c.shortDesc + '</p>';
        html += '  </div>';

        if (c.isComingSoon) {
          // Coming Soon presentation: No fake stats, no fake progress, single introduction entry
          html += '  <div>';
          html += '    <div style="background-color: var(--surface-sunken); border: 1px dashed var(--border-default); border-radius: var(--radius-sm); padding: 12px 14px; margin: var(--space-4) 0; font-size: 12px; color: var(--text-muted); display: flex; align-items: center; justify-content: space-between;">';
          html += '      <span>✦ 官方考綱數位化中</span>';
          html += '      <span style="font-weight: 600; color: var(--color-brand-deep-slate);">即將開放</span>';
          html += '    </div>';
          html += '    <div style="margin-bottom: 16px; font-size: 12px; color: var(--text-muted); display: flex; gap: 6px; flex-wrap: wrap;">';
          (c.tags || []).slice(0, 3).forEach(function (tag) {
            html += '      <span style="background-color: var(--surface-sunken); padding: 3px 8px; border-radius: 4px; font-size: 11px; color: var(--text-secondary);">' + tag + '</span>';
          });
          html += '    </div>';
          html += '    <div style="display: flex;">';
          html += '      <a href="' + detailHref + '" class="btn btn-outline btn-sm" style="width: 100%; text-align: center; font-size: 12px;">查看證照介紹</a>';
          html += '    </div>';
          html += '  </div>';
        } else {
          // Active demonstration: 網頁設計丙級
          html += '  <div>';
          html += '    <div class="cert-stats-box">';
          html += '      <div>';
          html += '        <div style="color: var(--text-muted);">學科題庫</div>';
          html += '        <div style="font-size: 14px; font-weight: 700; color: var(--color-brand-deep-slate);">' + c.subjectsCount + ' 題</div>';
          html += '      </div>';
          html += '      <div>';
          html += '        <div style="color: var(--text-muted);">術科實作</div>';
          html += '        <div style="font-size: 14px; font-weight: 700; color: var(--color-brand-deep-slate);">' + c.practicalsCount + ' 大題組</div>';
          html += '      </div>';
          html += '    </div>';

          html += '    <div style="margin-bottom: 16px;">';
          html += '      <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">';
          html += '        <span>學習完成度</span>';
          html += '        <span style="font-weight: 600; color: var(--text-primary);">' + c.progress + '%</span>';
          html += '      </div>';
          html += '      <div class="progress-track">';
          html += '        <div class="progress-bar" style="width: ' + c.progress + '%;"></div>';
          html += '      </div>';
          html += '    </div>';

          html += '    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">';
          html += '      <a href="' + detailHref + '" class="btn btn-outline btn-sm" style="font-size: 12px;">查看大綱</a>';
          html += '      <a href="' + practicalHref + '" class="btn btn-primary btn-sm" style="font-size: 12px;">進入學習</a>';
          html += '    </div>';
          html += '  </div>';
        }
        html += '</div>';
      });

      // Teaser card for future certifications
      html += '<div class="cert-card" style="border: 2px dashed var(--border-strong); background-color: var(--surface-sunken); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 32px 20px;">';
      html += '  <div style="width: 44px; height: 44px; border-radius: 50%; background-color: var(--color-brand-ice-slate); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; color: var(--color-brand-deep-slate);">';
      html += '    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>';
      html += '  </div>';
      html += '  <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 6px; color: var(--color-brand-charcoal);">陸續新增國家級與國際檢定</h4>';
      html += '  <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.5;">包含電腦硬體裝修、資通安全工程師、Linux LPI 等認證題庫整合中。</p>';
      html += '  <button type="button" class="btn btn-secondary btn-sm" onclick="showPrototypeToast(\'已收到您的關注！新證照題庫上線時系統將發送通知。\')">許願想考的證照</button>';
      html += '</div>';

      container.innerHTML = html;
    }

    function filterAndRender() {
      var filtered = allCerts.filter(function (c) {
        // Category filter
        var matchCategory = (currentCategory === 'all') || (c.category === currentCategory);

        // Discipline filter
        var matchDiscipline = true;
        if (currentDiscipline === 'theory') {
          matchDiscipline = (c.subjectsCount > 0) || c.isComingSoon;
        } else if (currentDiscipline === 'practical') {
          matchDiscipline = (c.practicalsCount > 0) || c.isComingSoon;
        }

        // Keyword filter
        var matchKeyword = true;
        if (searchKeyword) {
          var kw = searchKeyword.toLowerCase();
          var inName = c.name.toLowerCase().indexOf(kw) !== -1;
          var inCode = c.code.toLowerCase().indexOf(kw) !== -1;
          var inDesc = c.shortDesc.toLowerCase().indexOf(kw) !== -1;
          var inTags = (c.tags || []).some(function (t) { return t.toLowerCase().indexOf(kw) !== -1; });
          matchKeyword = inName || inCode || inDesc || inTags;
        }

        return matchCategory && matchDiscipline && matchKeyword;
      });

      renderCards(filtered);
    }

    // Category pills events
    categoryPills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        categoryPills.forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        currentCategory = pill.getAttribute('data-category') || 'all';
        filterAndRender();
      });
    });

    // Discipline pills events
    disciplinePills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        disciplinePills.forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        currentDiscipline = pill.getAttribute('data-discipline') || 'all';
        filterAndRender();
      });
    });

    // Search input event (debounced)
    var searchTimer = null;
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
          searchKeyword = (e.target.value || '').trim();
          filterAndRender();
        }, 150);
      });
    }

    // Reset button event
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        currentCategory = 'all';
        currentDiscipline = 'all';
        searchKeyword = '';
        if (searchInput) searchInput.value = '';
        categoryPills.forEach(function (p) {
          if (p.getAttribute('data-category') === 'all') p.classList.add('active');
          else p.classList.remove('active');
        });
        disciplinePills.forEach(function (p) {
          if (p.getAttribute('data-discipline') === 'all') p.classList.add('active');
          else p.classList.remove('active');
        });
        filterAndRender();
      });
    }

    // Initial render
    filterAndRender();
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initFadeInObserver();
      initScaffoldingDemo();
      initDualAudienceToggle();
      initCertificationsEngine();
    });
  } else {
    initFadeInObserver();
    initScaffoldingDemo();
    initDualAudienceToggle();
    initCertificationsEngine();
  }
})();

