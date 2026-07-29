/* ============================================================
   KiAspire Aabroad — Admin Panel Shared Behavior
   ============================================================
   Included on every gated admin page (never on login.html).
   Handles: the auth guard, logout, mobile sidebar toggle, and
   populating the signed-in admin's name in the sidebar.
   ============================================================ */
(function () {
  'use strict';

  // ---- Auth guard: runs immediately, before the page paints ----
  if (!window.KiAspireAPI || !window.KiAspireAPI.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  document.addEventListener('DOMContentLoaded', function () {
    // ---- Logout ----
    var logoutBtns = document.querySelectorAll('[data-admin-logout]');
    logoutBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.KiAspireAPI.adminLogout().then(function () {
          window.location.href = 'login.html';
        });
      });
    });

    // ---- Mobile sidebar toggle ----
    var toggle = document.getElementById('adminMobileToggle');
    var sidebar = document.getElementById('adminSidebar');
    var scrim = document.getElementById('adminSidebarScrim');
    function closeSidebar() {
      if (sidebar) sidebar.classList.remove('is-open');
      if (scrim) scrim.classList.remove('is-open');
    }
    if (toggle && sidebar) {
      toggle.addEventListener('click', function () {
        sidebar.classList.toggle('is-open');
        if (scrim) scrim.classList.toggle('is-open');
      });
    }
    if (scrim) scrim.addEventListener('click', closeSidebar);

    // ---- Sidebar admin name: paint from cache immediately, refresh from server ----
    var nameEl = document.getElementById('sidebarAdminName');
    var cached = window.KiAspireAPI.getCachedAdmin();
    if (nameEl && cached && cached.name) nameEl.textContent = cached.name;

    window.KiAspireAPI.getAdminProfile()
      .then(function (admin) {
        if (nameEl && admin && admin.name) nameEl.textContent = admin.name;
      })
      .catch(function (err) {
        console.error('getAdminProfile failed:', err);
        // Token likely stale/invalid — request() already redirects to
        // login on a 401, so nothing further to do here.
      });
  });
})();
