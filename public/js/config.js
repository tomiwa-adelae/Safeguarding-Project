// ═══════════════════════════════════════════════════════════════
// Project STAR Safeguarding Course — Global Configuration
// ═══════════════════════════════════════════════════════════════

/**
 * Global namespace for Project STAR application
 * Contains admin authentication and module data
 */
const PSTAR = {
  ADMIN_KEY: null,      // Admin session key (set after admin login)
  MODULES: []           // Course modules (loaded from modules.json or defined inline)
};
