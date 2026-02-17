// ═══════════════════════════════════════════════════════════════
// Loading State Management
// ═══════════════════════════════════════════════════════════════

let loadingCount = 0;
let loadingTimeout = null;
let safetyTimeout = null;

/**
 * Show loading overlay with optional message
 * @param {string} message - Loading message to display
 */
function showLoading(message = 'Loading...') {
  loadingCount++;
  const overlay = document.getElementById('loadingOverlay');
  const textEl = document.getElementById('loadingText');
  
  if (overlay && textEl) {
    textEl.textContent = message;
    
    // Clear any existing timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      loadingTimeout = null;
    }
    
    // Clear any existing safety timeout
    if (safetyTimeout) {
      clearTimeout(safetyTimeout);
      safetyTimeout = null;
    }
    
    // Show overlay with a small delay to prevent flickering on fast operations
    loadingTimeout = setTimeout(() => {
      if (loadingCount > 0) {
        overlay.style.display = 'flex';
      }
    }, 150);
    
    // Safety timeout: force hide loading after 30 seconds to prevent stuck states
    safetyTimeout = setTimeout(() => {
      console.warn('[Loading] Safety timeout triggered - forcing hide');
      loadingCount = 0;
      if (overlay) {
        overlay.style.display = 'none';
      }
    }, 30000);
  }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  
  if (loadingCount === 0) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      // Clear timeout if still pending
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      
      // Clear safety timeout
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
        safetyTimeout = null;
      }
      
      overlay.style.display = 'none';
    }
  }
}

/**
 * Force hide loading overlay (emergency use)
 */
function forceHideLoading() {
  loadingCount = 0;
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      loadingTimeout = null;
    }
    if (safetyTimeout) {
      clearTimeout(safetyTimeout);
      safetyTimeout = null;
    }
    overlay.style.display = 'none';
  }
}

/**
 * Wrap an async function with loading state
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} loadingMessage - Message to show while loading
 * @returns {Function} - Wrapped function
 */
function withLoading(asyncFn, loadingMessage = 'Loading...') {
  return async function(...args) {
    showLoading(loadingMessage);
    try {
      const result = await asyncFn(...args);
      return result;
    } finally {
      hideLoading();
    }
  };
}

/**
 * Execute async operation with loading state
 * @param {Function} asyncFn - Async function to execute
 * @param {string} loadingMessage - Message to show while loading
 * @returns {Promise} - Result of the async function
 */
async function executeWithLoading(asyncFn, loadingMessage = 'Loading...') {
  showLoading(loadingMessage);
  try {
    const result = await asyncFn();
    return result;
  } finally {
    hideLoading();
  }
}

// Export for use in other scripts
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.forceHideLoading = forceHideLoading;
window.withLoading = withLoading;
window.executeWithLoading = executeWithLoading;
