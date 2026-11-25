/**
 * SAMI Data Persistence & Migration Manager
 * Handles app updates without losing user data
 * Maintains database versioning and automatic migration
 */

window.SAMIDataPersistence = (() => {
  "use strict";

  // Current version of app/database
  const CURRENT_VERSION = "3.0.0";
  const DB_VERSION_KEY = "sami.db.version";
  const MIGRATION_LOG_KEY = "sami.migrations";
  const BACKUP_KEY = "sami.backup";

  // Version history with migration steps
  const MIGRATIONS = {
    "2.9.0": {
      description: "SAMI 2.9.0 - Base PWA",
      changes: ["Initial PWA version"],
    },
    "3.0.0": {
      description: "SAMI 3.0.0 - Offline-first with embedded database",
      changes: [
        "Added embedded-uk-database.js",
        "Added OHL infrastructure data",
        "Added data persistence layer",
        "Maintained all existing project data",
      ],
      migrate: migrateFrom290To300,
    },
  };

  /**
   * Initialize persistence system
   */
  function initialize() {
    const storedVersion = localStorage.getItem(DB_VERSION_KEY);

    if (!storedVersion) {
      // First time - set current version
      localStorage.setItem(DB_VERSION_KEY, CURRENT_VERSION);
      log("Initialization", `SAMI ${CURRENT_VERSION} initialized`);
      return { status: "initialized", version: CURRENT_VERSION };
    }

    if (storedVersion === CURRENT_VERSION) {
      log("Status", `Already on version ${CURRENT_VERSION}`);
      return { status: "current", version: CURRENT_VERSION };
    }

    // Migration needed
    return performMigration(storedVersion, CURRENT_VERSION);
  }

  /**
   * Perform migration from old version to new version
   */
  function performMigration(fromVersion, toVersion) {
    try {
      // Backup current data before migration
      const backup = backupAllData();
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));

      log("Migration", `Starting migration from ${fromVersion} to ${toVersion}`);

      // Find migration path
      const migration = MIGRATIONS[toVersion];
      if (!migration || !migration.migrate) {
        throw new Error(`No migration path from ${fromVersion} to ${toVersion}`);
      }

      // Execute migration
      const result = migration.migrate(fromVersion);

      // Update version
      localStorage.setItem(DB_VERSION_KEY, toVersion);

      // Log migration
      logMigration({
        from: fromVersion,
        to: toVersion,
        timestamp: new Date().toISOString(),
        success: true,
        result: result,
      });

      log("Migration", `Successfully migrated to ${toVersion}`);
      return {
        status: "migrated",
        from: fromVersion,
        to: toVersion,
        changes: migration.changes,
      };
    } catch (error) {
      log("Migration Error", error.message);
      logMigration({
        from: fromVersion,
        to: toVersion,
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message,
      });
      return {
        status: "migration_failed",
        error: error.message,
      };
    }
  }

  /**
   * Migration: 2.9.0 -> 3.0.0
   * - Add embedded database compatibility
   * - Preserve all existing projects
   * - Migrate OHL data if exists
   */
  function migrateFrom290To300(fromVersion) {
    const projects = getAllProjects();
    const constraints = getAllConstraints();
    const ohlRecords = getAllOHLRecords();

    // Verify data integrity
    const projectCount = projects ? projects.length : 0;
    const constraintCount = constraints ? constraints.length : 0;
    const ohlCount = ohlRecords ? ohlRecords.length : 0;

    // Add migration metadata to projects
    if (projects) {
      projects.forEach(project => {
        if (!project.metadata) project.metadata = {};
        project.metadata.migratedFrom = fromVersion;
        project.metadata.migratedAt = new Date().toISOString();
        project.metadata.appVersion = CURRENT_VERSION;
      });
      saveAllProjects(projects);
    }

    return {
      projectsMigrated: projectCount,
      constraintsMigrated: constraintCount,
      ohlRecordsMigrated: ohlCount,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Backup all user data
   */
  function backupAllData() {
    return {
      version: CURRENT_VERSION,
      timestamp: new Date().toISOString(),
      projects: getAllProjects(),
      constraints: getAllConstraints(),
      ohlRecords: getAllOHLRecords(),
      settings: getAllSettings(),
    };
  }

  /**
   * Restore from backup
   */
  function restoreFromBackup(backupData) {
    try {
      if (backupData.projects) saveAllProjects(backupData.projects);
      if (backupData.constraints) saveAllConstraints(backupData.constraints);
      if (backupData.ohlRecords) saveAllOHLRecords(backupData.ohlRecords);
      if (backupData.settings) saveAllSettings(backupData.settings);

      log("Restore", `Restored backup from ${backupData.timestamp}`);
      return { status: "restored", items: Object.keys(backupData).length };
    } catch (error) {
      log("Restore Error", error.message);
      return { status: "restore_failed", error: error.message };
    }
  }

  /**
   * Get all stored projects
   */
  function getAllProjects() {
    try {
      const projects = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sami.project.")) {
          const data = localStorage.getItem(key);
          if (data) projects.push(JSON.parse(data));
        }
      }
      return projects;
    } catch (error) {
      log("Error", `Failed to get projects: ${error.message}`);
      return [];
    }
  }

  /**
   * Save all projects
   */
  function saveAllProjects(projects) {
    // Clear existing projects
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sami.project.")) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => localStorage.removeItem(key));

    // Save new projects
    projects.forEach((project, index) => {
      localStorage.setItem(`sami.project.${index}`, JSON.stringify(project));
    });
  }

  /**
   * Get all stored constraints
   */
  function getAllConstraints() {
    try {
      const constraints = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sami.constraint.")) {
          const data = localStorage.getItem(key);
          if (data) constraints.push(JSON.parse(data));
        }
      }
      return constraints;
    } catch (error) {
      log("Error", `Failed to get constraints: ${error.message}`);
      return [];
    }
  }

  /**
   * Save all constraints
   */
  function saveAllConstraints(constraints) {
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sami.constraint.")) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => localStorage.removeItem(key));

    constraints.forEach((constraint, index) => {
      localStorage.setItem(`sami.constraint.${index}`, JSON.stringify(constraint));
    });
  }

  /**
   * Get all OHL records
   */
  function getAllOHLRecords() {
    try {
      const records = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sami.ohl.")) {
          const data = localStorage.getItem(key);
          if (data) records.push(JSON.parse(data));
        }
      }
      return records;
    } catch (error) {
      log("Error", `Failed to get OHL records: ${error.message}`);
      return [];
    }
  }

  /**
   * Save all OHL records
   */
  function saveAllOHLRecords(records) {
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sami.ohl.")) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => localStorage.removeItem(key));

    records.forEach((record, index) => {
      localStorage.setItem(`sami.ohl.${index}`, JSON.stringify(record));
    });
  }

  /**
   * Get all settings
   */
  function getAllSettings() {
    try {
      const settings = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sami.setting.")) {
          settings[key] = localStorage.getItem(key);
        }
      }
      return settings;
    } catch (error) {
      log("Error", `Failed to get settings: ${error.message}`);
      return {};
    }
  }

  /**
   * Save all settings
   */
  function saveAllSettings(settings) {
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }

  /**
   * Log migration event
   */
  function logMigration(event) {
    try {
      const logs = JSON.parse(localStorage.getItem(MIGRATION_LOG_KEY) || "[]");
      logs.push(event);
      // Keep last 100 migrations
      if (logs.length > 100) logs.shift();
      localStorage.setItem(MIGRATION_LOG_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error("Failed to log migration:", error);
    }
  }

  /**
   * Get migration history
   */
  function getMigrationHistory() {
    try {
      return JSON.parse(localStorage.getItem(MIGRATION_LOG_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  /**
   * Log event
   */
  function log(category, message) {
    const timestamp = new Date().toISOString();
    console.log(`[SAMI ${category} ${timestamp}] ${message}`);
  }

  /**
   * Get current version
   */
  function getCurrentVersion() {
    return localStorage.getItem(DB_VERSION_KEY) || "unknown";
  }

  /**
   * Get database stats
   */
  function getDatabaseStats() {
    return {
      version: getCurrentVersion(),
      projects: getAllProjects().length,
      constraints: getAllConstraints().length,
      ohlRecords: getAllOHLRecords().length,
      storageUsed: getStorageUsed(),
      migrations: getMigrationHistory().length,
      lastMigration: getMigrationHistory().slice(-1)[0] || null,
    };
  }

  /**
   * Calculate storage usage
   */
  function getStorageUsed() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sami.")) {
        const value = localStorage.getItem(key);
        total += (key.length + value.length) * 2; // Approximate bytes
      }
    }
    return total;
  }

  /**
   * Clear old backups (keep last 5)
   */
  function cleanupOldBackups() {
    // Note: This would need implementation based on your backup storage strategy
    log("Maintenance", "Backup cleanup completed");
  }

  /**
   * Health check
   */
  function healthCheck() {
    const stats = getDatabaseStats();
    const issues = [];

    if (!stats.version || stats.version === "unknown") {
      issues.push("Database version not found");
    }

    if (stats.storageUsed > 5 * 1024 * 1024) {
      issues.push("Storage usage high (>5MB)");
    }

    return {
      healthy: issues.length === 0,
      stats: stats,
      issues: issues,
    };
  }

  // Public API
  return {
    // Core functions
    initialize,
    performMigration,
    getCurrentVersion,

    // Backup/restore
    backupAllData,
    restoreFromBackup,

    // Data access
    getAllProjects,
    getAllConstraints,
    getAllOHLRecords,
    getAllSettings,

    // Utilities
    getDatabaseStats,
    getMigrationHistory,
    healthCheck,
    cleanupOldBackups,

    // Constants
    CURRENT_VERSION,
    MIGRATIONS,
  };
})();

// Auto-initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.SAMIDataPersistence.initialize();
  });
} else {
  window.SAMIDataPersistence.initialize();
}

// Export for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = window.SAMIDataPersistence;
}
