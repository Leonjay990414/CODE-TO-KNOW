/**
 * CODE TO KNOW (碼上學) Prototype - Navigation & Header Logic
 * Standard ES5/Vanilla script supporting file:// protocol directly.
 */

(function () {
  'use strict';

  function initNavigation() {
    var navbar = document.querySelector('.glass-nav');
    var mobileToggle = document.querySelector('.mobile-toggle-btn');
    var mobileMenu = document.querySelector('.mobile-menu-drawer');
    var navLinks = document.querySelectorAll('.nav-link-item');

    // 1. Scroll listener for glassmorphism navbar
    if (navbar) {
      window.addEventListener('scroll', function () {
        if (window.scrollY > 20) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }, { passive: true });
    }

    // 2. Active link highlight based on current filename
    var currentPath = window.location.pathname;
    var filename = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

    navLinks.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var linkFile = href.substring(href.lastIndexOf('/') + 1);

      if (linkFile === filename || (filename === '' && linkFile === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // 3. Mobile menu drawer toggle
    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener('click', function () {
        var isOpen = mobileMenu.classList.contains('open');
        if (isOpen) {
          mobileMenu.classList.remove('open');
          mobileToggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        } else {
          mobileMenu.classList.add('open');
          mobileToggle.setAttribute('aria-expanded', 'true');
          document.body.style.overflow = 'hidden';
        }
      });

      // Close when clicking outside or clicking any link inside
      mobileMenu.addEventListener('click', function (e) {
        if (e.target === mobileMenu || e.target.tagName === 'A') {
          mobileMenu.classList.remove('open');
          mobileToggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    }

    // 4. Smooth scroll for on-page hash anchors
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (targetId && targetId !== '#') {
          var targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }
})();

