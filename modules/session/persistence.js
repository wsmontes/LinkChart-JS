// Session persistence submodule
// Handles localStorage operations for session data

const SESSION_STORAGE_KEY = 'investigative_analytics_session';
const BACKUP_STORAGE_KEY = 'investigative_analytics_backups';
const MAX_BACKUPS = 5;

export function saveSessionData(sessionData) {
  try {
    // Save current session
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    
    // Create backup
    createBackup(sessionData);
    
    return true;
  } catch (error) {
    console.error('Failed to save session data:', error);
    return false;
  }
}

export function loadSessionData() {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load session data:', error);
    return null;
  }
}

export function clearSessionData() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear session data:', error);
    return false;
  }
}

export function createBackup(sessionData) {
  try {
    const backups = getBackups();
    
    // Add new backup
    const backup = {
      id: `backup-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: sessionData
    };
    
    backups.unshift(backup);
    
    // Keep only MAX_BACKUPS
    if (backups.length > MAX_BACKUPS) {
      backups.splice(MAX_BACKUPS);
    }
    
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backups));
    return backup;
  } catch (error) {
    console.error('Failed to create backup:', error);
    return null;
  }
}

export function getBackups() {
  try {
    const stored = localStorage.getItem(BACKUP_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get backups:', error);
    return [];
  }
}

export function restoreBackup(backupId) {
  try {
    const backups = getBackups();
    const backup = backups.find(b => b.id === backupId);
    
    if (backup) {
      saveSessionData(backup.data);
      return backup.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to restore backup:', error);
    return null;
  }
}

export function deleteBackup(backupId) {
  try {
    const backups = getBackups();
    const filtered = backups.filter(b => b.id !== backupId);
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete backup:', error);
    return false;
  }
}

export function getStorageStats() {
  try {
    const sessionSize = localStorage.getItem(SESSION_STORAGE_KEY)?.length || 0;
    const backupsSize = localStorage.getItem(BACKUP_STORAGE_KEY)?.length || 0;
    const totalSize = sessionSize + backupsSize;
    
    return {
      sessionSize: formatBytes(sessionSize),
      backupsSize: formatBytes(backupsSize),
      totalSize: formatBytes(totalSize),
      backupCount: getBackups().length
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return null;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
