// ═══════════════════════════════════════════════════════════════
// Project STAR Safeguarding Course — Application State
// ═══════════════════════════════════════════════════════════════

/**
 * Global application state
 * Manages current user session and course progress
 */
const PSTAR_STATE = {
  currentUser: null,      // { staffId, name, role, firstLogin, lastActive }
  started: false,         // Whether course has been started
  currentModule: null,    // Currently active module ID
  completed: {},          // { moduleId: { score, total, passed, completedAt } }
  quizAnswers: {}         // { moduleId: { q0: 1, q1: 2, ... } }
};
