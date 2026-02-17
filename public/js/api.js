// ═══════════════════════════════════════════════════════════════
// Project STAR Safeguarding Course — API Communication
// ═══════════════════════════════════════════════════════════════

/**
 * Generic API call wrapper
 * @param {string} method - HTTP method (GET, POST, DELETE, etc.)
 * @param {string} path - API endpoint path
 * @param {Object} body - Request body (optional)
 * @param {Object} options - Additional options { showLoading: boolean, loadingMessage: string }
 * @returns {Promise<Object>} - Response JSON
 */
async function api(method, path, body, options = {}) {
  const { showLoading: shouldShowLoading = false, loadingMessage = 'Loading...' } = options;
  
  // Show loading for operations that typically take time
  if (shouldShowLoading && typeof window.showLoading === 'function') {
    window.showLoading(loadingMessage);
  }
  
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const res = await fetch(path, { ...opts, signal: controller.signal });
    clearTimeout(timeoutId);

    // Check if response is JSON before parsing
    const contentType = res.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      // If not JSON, try to get text
      const text = await res.text();
      throw new Error(`Unexpected response format: ${text.substring(0, 100)}`);
    }

    // Check for HTTP errors (401, 400, 500, etc.)
    if (!res.ok) {
      // Throw with server error message if available, otherwise use status
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err) {
    // Handle network errors, timeouts, etc.
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    // Re-throw other errors
    throw err;
  } finally {
    if (shouldShowLoading && typeof window.hideLoading === 'function') {
      window.hideLoading();
    }
  }
}

/**
 * Save module completion progress to server
 * @param {string} moduleId - Module identifier
 * @param {number} score - Quiz score
 * @param {number} total - Total quiz questions
 * @param {boolean} passed - Whether user passed the quiz
 */
async function saveModuleProgress(moduleId, score, total, passed) {
  if (!PSTAR_STATE.currentUser) return;
  await api('POST', '/api/progress', {
    staffId: PSTAR_STATE.currentUser.staffId, moduleId, score, total, passed
  });
}

/**
 * Save quiz answers to server (for resume capability)
 * @param {string} moduleId - Module identifier
 * @param {Object} answers - Quiz answers object { q0: 1, q1: 2, ... }
 */
async function saveQuizAnswersToServer(moduleId, answers) {
  if (!PSTAR_STATE.currentUser) return;
  await api('POST', '/api/quiz-answers', {
    staffId: PSTAR_STATE.currentUser.staffId, moduleId, answers
  });
}
