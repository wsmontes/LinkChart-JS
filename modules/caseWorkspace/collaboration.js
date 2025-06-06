/**
 * Case Collaboration Module
 * Handles collaborative features for case workspace
 * Part of the comprehensive investigative analytics platform
 */

class CollaborationManager {
    constructor() {
        this.collaborators = new Map();
        this.sharedCases = new Map();
        this.permissions = new Map();
        this.changeHistory = [];
        this.activityLog = [];
        this.conflictResolution = new ConflictResolver();
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCollaborationData();
        console.log('✓ Collaboration manager initialized');
    }

    bindEvents() {
        // Listen for case sharing requests
        document.addEventListener('case:shareRequested', (event) => {
            this.handleShareRequest(event.detail);
        });

        // Listen for collaboration invites
        document.addEventListener('collaboration:inviteReceived', (event) => {
            this.handleInvite(event.detail);
        });

        // Listen for real-time changes
        document.addEventListener('case:entityChanged', (event) => {
            this.handleEntityChange(event.detail);
        });

        document.addEventListener('case:noteChanged', (event) => {
            this.handleNoteChange(event.detail);
        });
    }

    // Case sharing functionality
    async shareCase(caseId, collaboratorEmail, permissions = 'view') {
        try {
            const caseData = await this.getCaseData(caseId);
            if (!caseData) {
                throw new Error('Case not found');
            }

            const shareId = this.generateShareId();
            const shareData = {
                id: shareId,
                caseId: caseId,
                owner: this.getCurrentUser(),
                collaborator: collaboratorEmail,
                permissions: permissions,
                sharedAt: new Date().toISOString(),
                status: 'pending'
            };

            this.sharedCases.set(shareId, shareData);
            
            // Send invitation (simulated)
            await this.sendInvitation(shareData);
            
            this.logActivity('case_shared', {
                caseId,
                collaborator: collaboratorEmail,
                permissions
            });

            return {
                success: true,
                shareId: shareId,
                message: `Case shared with ${collaboratorEmail}`
            };
        } catch (error) {
            console.error('Failed to share case:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async acceptInvitation(shareId) {
        const shareData = this.sharedCases.get(shareId);
        if (!shareData) {
            throw new Error('Invalid share invitation');
        }

        shareData.status = 'accepted';
        shareData.acceptedAt = new Date().toISOString();

        // Add collaborator to case
        const caseId = shareData.caseId;
        const collaborators = this.collaborators.get(caseId) || [];
        collaborators.push({
            email: shareData.collaborator,
            permissions: shareData.permissions,
            joinedAt: shareData.acceptedAt
        });
        
        this.collaborators.set(caseId, collaborators);
        this.permissions.set(`${caseId}:${shareData.collaborator}`, shareData.permissions);

        this.logActivity('invitation_accepted', {
            caseId,
            collaborator: shareData.collaborator
        });

        return {
            success: true,
            caseId: caseId,
            permissions: shareData.permissions
        };
    }

    async revokeAccess(caseId, collaboratorEmail) {
        const collaborators = this.collaborators.get(caseId) || [];
        const updatedCollaborators = collaborators.filter(c => c.email !== collaboratorEmail);
        
        this.collaborators.set(caseId, updatedCollaborators);
        this.permissions.delete(`${caseId}:${collaboratorEmail}`);

        this.logActivity('access_revoked', {
            caseId,
            collaborator: collaboratorEmail
        });

        return true;
    }

    // Permission management
    hasPermission(caseId, userEmail, action) {
        const userPermissions = this.permissions.get(`${caseId}:${userEmail}`);
        if (!userPermissions) return false;

        const permissionMap = {
            'view': ['view'],
            'edit': ['view', 'edit'],
            'admin': ['view', 'edit', 'share', 'delete']
        };

        const allowedActions = permissionMap[userPermissions] || [];
        return allowedActions.includes(action);
    }

    updatePermissions(caseId, collaboratorEmail, newPermissions) {
        if (!this.hasPermission(caseId, this.getCurrentUser(), 'admin')) {
            throw new Error('Insufficient permissions to update access');
        }

        this.permissions.set(`${caseId}:${collaboratorEmail}`, newPermissions);
        
        // Update collaborator record
        const collaborators = this.collaborators.get(caseId) || [];
        const collaborator = collaborators.find(c => c.email === collaboratorEmail);
        if (collaborator) {
            collaborator.permissions = newPermissions;
            collaborator.updatedAt = new Date().toISOString();
        }

        this.logActivity('permissions_updated', {
            caseId,
            collaborator: collaboratorEmail,
            newPermissions
        });
    }

    // Real-time collaboration
    async handleEntityChange(changeData) {
        const { caseId, entityId, action, data, userId } = changeData;
        
        // Check permissions
        if (!this.hasPermission(caseId, userId, 'edit')) {
            throw new Error('Insufficient permissions to edit entities');
        }

        // Record change
        const change = {
            id: this.generateChangeId(),
            caseId,
            entityId,
            action,
            data,
            userId,
            timestamp: new Date().toISOString(),
            type: 'entity'
        };

        this.changeHistory.push(change);
        
        // Check for conflicts
        const conflict = await this.conflictResolution.checkForConflicts(change);
        if (conflict) {
            return await this.handleConflict(conflict);
        }

        // Broadcast change to collaborators
        this.broadcastChange(change);
        
        return {
            success: true,
            changeId: change.id
        };
    }

    async handleNoteChange(changeData) {
        const { caseId, noteId, action, data, userId } = changeData;
        
        // Check permissions
        if (!this.hasPermission(caseId, userId, 'edit')) {
            throw new Error('Insufficient permissions to edit notes');
        }

        // Record change
        const change = {
            id: this.generateChangeId(),
            caseId,
            noteId,
            action,
            data,
            userId,
            timestamp: new Date().toISOString(),
            type: 'note'
        };

        this.changeHistory.push(change);
        
        // Broadcast change to collaborators
        this.broadcastChange(change);
        
        return {
            success: true,
            changeId: change.id
        };
    }

    broadcastChange(change) {
        // Simulate real-time broadcasting
        const collaborators = this.collaborators.get(change.caseId) || [];
        
        collaborators.forEach(collaborator => {
            // In a real implementation, this would use WebSockets or SSE
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('collaboration:changeReceived', {
                    detail: {
                        change,
                        fromUser: collaborator.email
                    }
                }));
            }, 100);
        });
    }

    // Conflict resolution
    async handleConflict(conflict) {
        // Present conflict resolution options to user
        const resolution = await this.showConflictDialog(conflict);
        
        if (resolution.action === 'merge') {
            return await this.conflictResolution.mergeChanges(conflict, resolution.strategy);
        } else if (resolution.action === 'override') {
            return await this.conflictResolution.overrideChange(conflict);
        } else {
            return await this.conflictResolution.rejectChange(conflict);
        }
    }

    showConflictDialog(conflict) {
        return new Promise((resolve) => {
            const dialog = this.createConflictDialog(conflict, resolve);
            document.body.appendChild(dialog);
        });
    }

    createConflictDialog(conflict, onResolve) {
        const dialog = document.createElement('div');
        dialog.className = 'conflict-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Collaboration Conflict Detected</h3>
                <p>Multiple users have modified the same ${conflict.type}.</p>
                <div class="conflict-details">
                    <div class="conflict-item">
                        <h4>Your Changes:</h4>
                        <pre>${JSON.stringify(conflict.localChange, null, 2)}</pre>
                    </div>
                    <div class="conflict-item">
                        <h4>Remote Changes:</h4>
                        <pre>${JSON.stringify(conflict.remoteChange, null, 2)}</pre>
                    </div>
                </div>
                <div class="resolution-options">
                    <button class="merge-btn">Merge Changes</button>
                    <button class="override-btn">Use My Changes</button>
                    <button class="accept-btn">Accept Remote Changes</button>
                </div>
            </div>
        `;

        // Bind resolution handlers
        dialog.querySelector('.merge-btn').onclick = () => {
            this.removeDialog(dialog);
            onResolve({ action: 'merge', strategy: 'automatic' });
        };

        dialog.querySelector('.override-btn').onclick = () => {
            this.removeDialog(dialog);
            onResolve({ action: 'override' });
        };

        dialog.querySelector('.accept-btn').onclick = () => {
            this.removeDialog(dialog);
            onResolve({ action: 'accept' });
        };

        return dialog;
    }

    removeDialog(dialog) {
        if (dialog.parentNode) {
            dialog.parentNode.removeChild(dialog);
        }
    }

    // Activity logging
    logActivity(action, details) {
        const activity = {
            id: this.generateActivityId(),
            action,
            details,
            userId: this.getCurrentUser(),
            timestamp: new Date().toISOString()
        };

        this.activityLog.push(activity);
        
        // Keep only last 1000 activities
        if (this.activityLog.length > 1000) {
            this.activityLog = this.activityLog.slice(-1000);
        }

        // Dispatch activity event
        document.dispatchEvent(new CustomEvent('collaboration:activity', {
            detail: activity
        }));
    }

    // Data management
    getCaseCollaborators(caseId) {
        return this.collaborators.get(caseId) || [];
    }

    getCaseActivity(caseId, limit = 50) {
        return this.activityLog
            .filter(activity => activity.details.caseId === caseId)
            .slice(-limit)
            .reverse();
    }

    getChangeHistory(caseId, limit = 100) {
        return this.changeHistory
            .filter(change => change.caseId === caseId)
            .slice(-limit)
            .reverse();
    }

    // Utility methods
    async getCaseData(caseId) {
        // Simulate getting case data
        return {
            id: caseId,
            name: `Case ${caseId}`,
            owner: this.getCurrentUser(),
            createdAt: new Date().toISOString()
        };
    }

    getCurrentUser() {
        // In a real implementation, get from authentication system
        return 'current.user@example.com';
    }

    async sendInvitation(shareData) {
        // Simulate sending invitation email
        console.log('Invitation sent:', shareData);
        return true;
    }

    loadCollaborationData() {
        // Load collaboration data from storage
        try {
            const saved = localStorage.getItem('collaboration_data');
            if (saved) {
                const data = JSON.parse(saved);
                
                if (data.collaborators) {
                    this.collaborators = new Map(Object.entries(data.collaborators));
                }
                
                if (data.sharedCases) {
                    this.sharedCases = new Map(Object.entries(data.sharedCases));
                }
                
                if (data.permissions) {
                    this.permissions = new Map(Object.entries(data.permissions));
                }
                
                this.changeHistory = data.changeHistory || [];
                this.activityLog = data.activityLog || [];
            }
        } catch (error) {
            console.warn('Failed to load collaboration data:', error);
        }
    }

    saveCollaborationData() {
        try {
            const data = {
                collaborators: Object.fromEntries(this.collaborators),
                sharedCases: Object.fromEntries(this.sharedCases),
                permissions: Object.fromEntries(this.permissions),
                changeHistory: this.changeHistory.slice(-1000), // Keep last 1000
                activityLog: this.activityLog.slice(-1000) // Keep last 1000
            };
            
            localStorage.setItem('collaboration_data', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save collaboration data:', error);
        }
    }

    generateShareId() {
        return 'share-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    generateChangeId() {
        return 'change-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    generateActivityId() {
        return 'activity-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
}

// Conflict Resolution Helper
class ConflictResolver {
    constructor() {
        this.pendingChanges = new Map();
        this.mergeStrategies = {
            'automatic': this.automaticMerge.bind(this),
            'manual': this.manualMerge.bind(this),
            'timestamp': this.timestampMerge.bind(this)
        };
    }

    async checkForConflicts(change) {
        const key = `${change.caseId}:${change.entityId || change.noteId}`;
        const pending = this.pendingChanges.get(key);
        
        if (pending && pending.timestamp > Date.now() - 5000) { // 5 second window
            return {
                type: change.type,
                localChange: change,
                remoteChange: pending,
                conflictKey: key
            };
        }
        
        this.pendingChanges.set(key, change);
        return null;
    }

    async automaticMerge(conflict) {
        // Simple automatic merge strategy
        const merged = {
            ...conflict.localChange,
            data: {
                ...conflict.remoteChange.data,
                ...conflict.localChange.data
            }
        };
        
        return {
            success: true,
            mergedChange: merged
        };
    }

    async manualMerge(conflict) {
        // Manual merge would require user input
        return {
            success: false,
            requiresUserInput: true
        };
    }

    async timestampMerge(conflict) {
        // Use the most recent change
        const winner = new Date(conflict.localChange.timestamp) > new Date(conflict.remoteChange.timestamp)
            ? conflict.localChange
            : conflict.remoteChange;
        
        return {
            success: true,
            mergedChange: winner
        };
    }

    async mergeChanges(conflict, strategy = 'automatic') {
        const mergeFunction = this.mergeStrategies[strategy];
        if (!mergeFunction) {
            throw new Error(`Unknown merge strategy: ${strategy}`);
        }
        
        return await mergeFunction(conflict);
    }

    async overrideChange(conflict) {
        return {
            success: true,
            mergedChange: conflict.localChange
        };
    }

    async rejectChange(conflict) {
        return {
            success: true,
            mergedChange: conflict.remoteChange
        };
    }
}

// Export for module usage
export { CollaborationManager };

// Conflict Resolution Helper
export { ConflictResolver };

// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CollaborationManager, ConflictResolver };
}
