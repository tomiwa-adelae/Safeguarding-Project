// ═══════════════════════════════════════════════════════════════
// Project STAR Safeguarding Course — API Communication
// ═══════════════════════════════════════════════════════════════

/**
 * Generic API call wrapper
 * @param {string} method - HTTP method (GET, POST, DELETE, etc.)
 * @param {string} path - API endpoint path
 * @param {Object} body - Request body (optional)
 * @returns {Promise<Object>} - Response JSON
 */
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);

  const data = await res.json();

  // Check for HTTP errors (401, 400, 500, etc.)
  if (!res.ok) {
    // Throw with server error message if available, otherwise use status
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
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
