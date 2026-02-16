// ═══════════════════════════════════════════════════════════════
// Project STAR Safeguarding Course — UI Utilities
// ═══════════════════════════════════════════════════════════════

/**
 * Toggle accordion item open/closed
 * @param {HTMLElement} el - The accordion header element clicked
 */
function toggleAcc(el) {
  el.parentElement.classList.toggle('open');
}

/**
 * Switch between tab panels
 * @param {HTMLElement} tabEl - The tab element clicked
 * @param {string} panelId - The ID of the panel to show
 */
function switchTab(tabEl, panelId) {
  const container = tabEl.closest('.content-section') || tabEl.closest('.module-view');
  container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  tabEl.classList.add('active');
  document.getElementById(panelId).classList.add('active');
}
