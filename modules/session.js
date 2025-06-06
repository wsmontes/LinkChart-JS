// Investigative Analytics Platform - Session Management Module
// Handles session persistence, state management, and user preferences.
// Provides comprehensive session management with backup and restore capabilities.
// Comments included for AI-assisted development and extensibility.

import { SessionPersistence } from './session/persistence.js';

// Session state management
let sessionState = {
  currentData: null,
  searchFilters: {},
  caseWorkspace: {},
  dashboardSettings: {},
  userPreferences: {},
  lastActivity: null,
  sessionId: null
};

let isAutoSaveEnabled = true;
let persistence = null;
let autoSaveManager = null;
let importExportManager = null;

// Initialize session management
export async function initSessionManagement() {
  // Initialize submodules
  persistence = new SessionPersistence();
  
  // Load submodule classes dynamically
  try {
    const { AutoSaveManager } = await import('./session/autoSave.js');
    const { ImportExportManager } = await import('./session/importExport.js');
    
    autoSaveManager = new AutoSaveManager();
    importExportManager = new ImportExportManager();
  } catch (error) {
    console.warn('Failed to load session submodules:', error);
  }
  
  // Generate session ID
  sessionState.sessionId = generateSessionId();
  
  // Load previous session if available
  await loadPreviousSession();
  
  // Listen for data changes
  setupSessionEventListeners();
  
  // Setup beforeunload handler
  window.addEventListener('beforeunload', (e) => {
    saveCurrentSession();
  });
  
  console.log('Session management initialized with ID:', sessionState.sessionId);
}

// Save current session state
export async function saveCurrentSession() {
  try {
    sessionState.lastActivity = new Date().toISOString();
    
    // Collect current state from all modules
    const currentState = {
      ...sessionState,
      currentData: getCurrentDataState(),
      searchFilters: getCurrentSearchState(),
      caseWorkspace: getCurrentCaseState(),
      dashboardSettings: getCurrentDashboardState(),
      userPreferences: getCurrentUserPreferences()
    };
    
    if (persistence) {
      await persistence.saveSession(currentState);
    }
    
    // Dispatch session saved event
    window.dispatchEvent(new CustomEvent('session:saved', { 
      detail: { sessionId: sessionState.sessionId, timestamp: sessionState.lastActivity }
    }));
    
    return true;
  } catch (error) {
    console.error('Failed to save session:', error);
    return false;
  }
}

// Load previous session
export async function loadPreviousSession() {
  try {
    if (!persistence) return false;
    
    const savedSession = await persistence.loadSession();
    if (savedSession) {
      sessionState = { ...sessionState, ...savedSession };
      
      // Restore state to modules
      restoreDataState(sessionState.currentData);
      restoreSearchState(sessionState.searchFilters);
      restoreCaseState(sessionState.caseWorkspace);
      restoreDashboardState(sessionState.dashboardSettings);
      restoreUserPreferences(sessionState.userPreferences);
      
      // Dispatch session loaded event
      window.dispatchEvent(new CustomEvent('session:loaded', { 
        detail: sessionState 
      }));
      
      console.log('Previous session loaded:', sessionState.sessionId);
      return true;
    }
  } catch (error) {
    console.error('Failed to load previous session:', error);
  }
  return false;
}

// Clear current session
export function clearCurrentSession() {
  try {
    clearSessionData();
    
    // Reset session state
    sessionState = {
      currentData: null,
      searchFilters: {},
      caseWorkspace: {},
      dashboardSettings: {},
      userPreferences: {},
      lastActivity: null,
      sessionId: generateSessionId()
    };
    
    // Dispatch session cleared event
    window.dispatchEvent(new CustomEvent('session:cleared'));
    
    console.log('Session cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear session:', error);
    return false;
  }
}

// Session backup and restore
export function createSessionBackup() {
  const backup = {
    sessionId: sessionState.sessionId,
    timestamp: new Date().toISOString(),
    data: {
      ...sessionState,
      currentData: getCurrentDataState(),
      searchFilters: getCurrentSearchState(),
      caseWorkspace: getCurrentCaseState(),
      dashboardSettings: getCurrentDashboardState(),
      userPreferences: getCurrentUserPreferences()
    }
  };
  
  return backup;
}

export function restoreFromBackup(backup) {
  try {
    if (!backup || !backup.data) {
      throw new Error('Invalid backup data');
    }
    
    sessionState = { ...backup.data };
    
    // Restore state to modules
    restoreDataState(sessionState.currentData);
    restoreSearchState(sessionState.searchFilters);
    restoreCaseState(sessionState.caseWorkspace);
    restoreDashboardState(sessionState.dashboardSettings);
    restoreUserPreferences(sessionState.userPreferences);
    
    // Save restored session
    saveCurrentSession();
    
    // Dispatch session restored event
    window.dispatchEvent(new CustomEvent('session:restored', { 
      detail: backup 
    }));
    
    console.log('Session restored from backup:', backup.timestamp);
    return true;
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return false;
  }
}

// User preferences management
export function setUserPreference(key, value) {
  if (!sessionState.userPreferences) {
    sessionState.userPreferences = {};
  }
  
  sessionState.userPreferences[key] = value;
  saveCurrentSession();
  
  // Dispatch preference changed event
  window.dispatchEvent(new CustomEvent('session:preferenceChanged', { 
    detail: { key, value }
  }));
}

export function getUserPreference(key, defaultValue = null) {
  return sessionState.userPreferences?.[key] ?? defaultValue;
}

export function getAllUserPreferences() {
  return { ...sessionState.userPreferences };
}

// Session statistics
export function getSessionStatistics() {
  return {
    sessionId: sessionState.sessionId,
    startTime: sessionState.sessionId ? new Date(parseInt(sessionState.sessionId.split('-')[1])) : null,
    lastActivity: sessionState.lastActivity ? new Date(sessionState.lastActivity) : null,
    dataLoaded: !!sessionState.currentData,
    casesCount: Object.keys(sessionState.caseWorkspace || {}).length,
    filtersActive: Object.keys(sessionState.searchFilters || {}).length > 0,
    preferencesSet: Object.keys(sessionState.userPreferences || {}).length
  };
}

// Auto-save controls
export function toggleAutoSave() {
  isAutoSaveEnabled = !isAutoSaveEnabled;
  
  if (isAutoSaveEnabled) {
    enableAutoSave();
  } else {
    disableAutoSave();
  }
  
  // Dispatch auto-save toggled event
  window.dispatchEvent(new CustomEvent('session:autoSaveToggled', { 
    detail: { enabled: isAutoSaveEnabled }
  }));
  
  return isAutoSaveEnabled;
}

// Setup event listeners for session management
function setupSessionEventListeners() {
  // Listen for data changes
  window.addEventListener('data:normalized', (e) => {
    sessionState.currentData = e.detail;
    if (isAutoSaveEnabled) {
      setTimeout(() => saveCurrentSession(), 1000);
    }
  });
  
  // Listen for search filter changes
  window.addEventListener('search:filtersChanged', (e) => {
    sessionState.searchFilters = e.detail;
    if (isAutoSaveEnabled) {
      setTimeout(() => saveCurrentSession(), 1000);
    }
  });
  
  // Listen for case workspace changes
  window.addEventListener('case:stateChanged', (e) => {
    sessionState.caseWorkspace = e.detail;
    if (isAutoSaveEnabled) {
      setTimeout(() => saveCurrentSession(), 1000);
    }
  });
  
  // Listen for dashboard changes
  window.addEventListener('dashboard:settingsChanged', (e) => {
    sessionState.dashboardSettings = e.detail;
    if (isAutoSaveEnabled) {
      setTimeout(() => saveCurrentSession(), 1000);
    }
  });
}

// State collection functions
function getCurrentDataState() {
  // Collect current data from data upload module
  const dataEvent = new CustomEvent('session:collectData');
  window.dispatchEvent(dataEvent);
  return dataEvent.detail || sessionState.currentData;
}

function getCurrentSearchState() {
  // Collect current search filters
  const searchEvent = new CustomEvent('session:collectSearch');
  window.dispatchEvent(searchEvent);
  return searchEvent.detail || sessionState.searchFilters;
}

function getCurrentCaseState() {
  // Collect current case workspace state
  const caseEvent = new CustomEvent('session:collectCase');
  window.dispatchEvent(caseEvent);
  return caseEvent.detail || sessionState.caseWorkspace;
}

function getCurrentDashboardState() {
  // Collect current dashboard settings
  const dashboardEvent = new CustomEvent('session:collectDashboard');
  window.dispatchEvent(dashboardEvent);
  return dashboardEvent.detail || sessionState.dashboardSettings;
}

function getCurrentUserPreferences() {
  return { ...sessionState.userPreferences };
}

// State restoration functions
function restoreDataState(dataState) {
  if (dataState) {
    window.dispatchEvent(new CustomEvent('session:restoreData', { detail: dataState }));
  }
}

function restoreSearchState(searchState) {
  if (searchState) {
    window.dispatchEvent(new CustomEvent('session:restoreSearch', { detail: searchState }));
  }
}

function restoreCaseState(caseState) {
  if (caseState) {
    window.dispatchEvent(new CustomEvent('session:restoreCase', { detail: caseState }));
  }
}

function restoreDashboardState(dashboardState) {
  if (dashboardState) {
    window.dispatchEvent(new CustomEvent('session:restoreDashboard', { detail: dashboardState }));
  }
}

function restoreUserPreferences(preferences) {
  if (preferences) {
    sessionState.userPreferences = { ...preferences };
    window.dispatchEvent(new CustomEvent('session:restorePreferences', { detail: preferences }));
  }
}

// Utility functions
function generateSessionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `session-${timestamp}-${random}`;
}

// Auto-save management
export function enableAutoSave() {
  if (autoSaveManager) {
    autoSaveManager.enable();
  }
  isAutoSaveEnabled = true;
}

export function disableAutoSave() {
  if (autoSaveManager) {
    autoSaveManager.disable();
  }
  isAutoSaveEnabled = false;
}

export function getAutoSaveStatus() {
  return autoSaveManager ? autoSaveManager.getStatus() : null;
}

// Import/Export functionality
export async function exportSession(options = {}) {
  if (!importExportManager) {
    throw new Error('Import/Export manager not initialized');
  }
  
  return await importExportManager.exportSession(options);
}

export async function importSession(data, options = {}) {
  if (!importExportManager) {
    throw new Error('Import/Export manager not initialized');
  }
  
  return await importExportManager.importSession(data, options);
}

export async function exportToFile(options = {}) {
  if (!importExportManager) {
    throw new Error('Import/Export manager not initialized');
  }
  
  return await importExportManager.exportToFile(options);
}

export async function importFromFile(file) {
  if (!importExportManager) {
    throw new Error('Import/Export manager not initialized');
  }
  
  return await importExportManager.importFromFile(file);
}

// Session statistics and info
export function getSessionInfo() {
  return {
    sessionId: sessionState.sessionId,
    startTime: sessionState.startTime,
    lastActivity: sessionState.lastActivity,
    dataStatus: sessionState.currentData ? 'loaded' : 'empty',
    autoSaveEnabled: isAutoSaveEnabled,
    autoSaveStatus: getAutoSaveStatus()
  };
}

export function getSessionState() {
  return { ...sessionState };
}

export async function restoreSessionState(state) {
  sessionState = { ...sessionState, ...state };
  
  // Restore to all modules
  restoreDataState(state.currentData);
  restoreSearchState(state.searchFilters);
  restoreCaseState(state.caseWorkspace);
  restoreDashboardState(state.dashboardSettings);
  restoreUserPreferences(state.userPreferences);
}

// Backup management
export async function createBackup() {
  if (!persistence) {
    throw new Error('Persistence manager not initialized');
  }
  
  const currentState = {
    ...sessionState,
    currentData: getCurrentDataState(),
    searchFilters: getCurrentSearchState(),
    caseWorkspace: getCurrentCaseState(),
    dashboardSettings: getCurrentDashboardState(),
    userPreferences: getCurrentUserPreferences()
  };
  
  return await persistence.createBackup(currentState);
}

export async function restoreBackup(backupId) {
  if (!persistence) {
    throw new Error('Persistence manager not initialized');
  }
  
  const backup = await persistence.restoreBackup(backupId);
  if (backup) {
    await restoreSessionState(backup);
    return true;
  }
  return false;
}

export async function getBackups() {
  if (!persistence) {
    return [];
  }
  
  return await persistence.getBackups();
}

// Activity tracking
export function updateActivity() {
  sessionState.lastActivity = new Date().toISOString();
  
  // Mark as dirty for auto-save
  if (autoSaveManager) {
    autoSaveManager.markDirty('activity');
  }
}

// Make session manager globally available
if (typeof window !== 'undefined') {
  window.sessionManager = {
    initSessionManagement,
    saveCurrentSession,
    loadPreviousSession,
    clearCurrentSession,
    setUserPreference,
    getUserPreference,
    getUserPreferences,
    exportSession,
    importSession,
    exportToFile,
    importFromFile,
    getSessionInfo,
    getSessionState,
    restoreSessionState,
    createBackup,
    restoreBackup,
    getBackups,
    updateActivity,
    enableAutoSave,
    disableAutoSave,
    getAutoSaveStatus
  };
}

// AI/Dev Note: This session module provides comprehensive state management including
// auto-save, backup/restore, user preferences, and session statistics. It integrates
// with all other modules through custom events for seamless state persistence.
