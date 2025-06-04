/**
 * Data management module for LinkChart JS
 */

class DataManager {
    constructor() {
        this.localStorageKey = 'linkchartjs_data';
    }

    saveChart(chartData) {
        try {
            const jsonData = JSON.stringify(chartData.toJSON());
            localStorage.setItem(this.localStorageKey, jsonData);
            return true;
        } catch (error) {
            console.error('Error saving chart data:', error);
            return false;
        }
    }

    async loadChart() {
        return new Promise((resolve) => {
            try {
                const jsonData = localStorage.getItem(this.localStorageKey);
                
                if (!jsonData) {
                    resolve(null);
                    return;
                }
                
                const parsedData = JSON.parse(jsonData);
                const chartData = new ChartData();
                chartData.fromJSON(parsedData);
                resolve(chartData);
            } catch (error) {
                console.error('Error loading chart data:', error);
                resolve(null);
            }
        });
    }

    exportChart(chartData) {
        try {
            const jsonData = JSON.stringify(chartData.toJSON(), null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = 'linkchart_export_' + new Date().toISOString().slice(0, 10) + '.json';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);
            
            return true;
        } catch (error) {
            console.error('Error exporting chart data:', error);
            return false;
        }
    }

    async importChart(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const jsonData = event.target.result;
                    const parsedData = JSON.parse(jsonData);
                    
                    const chartData = new ChartData();
                    chartData.fromJSON(parsedData);
                    resolve(chartData);
                } catch (error) {
                    console.error('Error parsing imported chart:', error);
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                console.error('Error reading file:', error);
                reject(error);
            };
            
            reader.readAsText(file);
        });
    }

    // Sample data for testing
    createSampleData() {
        const chartData = new ChartData();
        
        // Add some entities
        const john = chartData.addEntity(new Entity(null, 'person', 'John Smith', 'CEO of Acme Corp'));
        const alice = chartData.addEntity(new Entity(null, 'person', 'Alice Johnson', 'CFO of Acme Corp'));
        const acme = chartData.addEntity(new Entity(null, 'organization', 'Acme Corporation', 'A fictional company'));
        const nyc = chartData.addEntity(new Entity(null, 'location', 'New York City', 'City in the USA'));
        const meeting = chartData.addEntity(new Entity(null, 'event', 'Board Meeting', 'Annual board meeting'));
        
        // Position entities
        john.x = 200;
        john.y = 150;
        
        alice.x = 400;
        alice.y = 150;
        
        acme.x = 300;
        acme.y = 300;
        
        nyc.x = 500;
        nyc.y = 300;
        
        meeting.x = 300;
        meeting.y = 450;
        
        // Add relationships
        chartData.addRelationship(new Relationship(null, john.id, acme.id, 'default', 'works at'));
        chartData.addRelationship(new Relationship(null, alice.id, acme.id, 'default', 'works at'));
        chartData.addRelationship(new Relationship(null, john.id, alice.id, 'default', 'colleague'));
        chartData.addRelationship(new Relationship(null, acme.id, nyc.id, 'default', 'located in'));
        chartData.addRelationship(new Relationship(null, john.id, meeting.id, 'default', 'attends'));
        chartData.addRelationship(new Relationship(null, alice.id, meeting.id, 'default', 'attends'));
        
        return chartData;
    }

    // Sample data for issue tracking
    createIssueSampleData() {
        const chartData = new ChartData();
        
        // Create issue tracking entity types
        chartData.addEntityType(new EntityType('epic', 'Epic', 'bi-diagram-3', '#9b59b6'));
        chartData.addEntityType(new EntityType('story', 'Story', 'bi-file-earmark-text', '#3498db'));
        chartData.addEntityType(new EntityType('work-item', 'Work Item', 'bi-clipboard2', '#1abc9c'));
        
        // Add status-based entity types
        chartData.addEntityType(new EntityType('todo', 'To Do', 'bi-circle', '#3498db'));
        chartData.addEntityType(new EntityType('in-progress', 'In Progress', 'bi-play-circle', '#f39c12'));
        chartData.addEntityType(new EntityType('done', 'Done', 'bi-check-circle', '#2ecc71'));
        chartData.addEntityType(new EntityType('cancelled', 'Cancelled', 'bi-x-circle', '#95a5a6'));
        
        // Add sample issues
        
        // Epic
        const epic = chartData.addEntity(new Entity('GLPR-17', 'epic', 'Issue Class 6 Learners'));
        epic.properties = {
            'Key': 'GLPR-17',
            'Epic Name': 'NMLP_Issue_CL6LDL',
            'Issue Type': 'Epic',
            'Summary': 'Issue Class 6 Learners',
            'Status': 'To Do',
            'Reporter': 'Haws, Troy',
            'Assignee': 'Bierd, Mitch',
            'Count': '13',
            'Description': 'Goal / Desired State: As a Customer Service Representative or Driver licensing customer contact rep, I want to issue a Class 6 Learner\'s License with the appropriate restrictions (automatically applied), so that the customer can practice learning how to drive a motorcycle.',
            'Last comment': 'Updated minimum age requirement to 18 , from 18.5, based on meeting with Nick/Meg 1/21/2025'
        };
        
        // Work Item
        const workItem = chartData.addEntity(new Entity('GLPR-140', 'work-item', 'Writing stories for Epic and Story for GLPR 17'));
        workItem.properties = {
            'Key': 'GLPR-140',
            'Epic Name': 'NMLP_Issue_CL6LDL',
            'Issue Type': 'Work Item',
            'Summary': 'Writing stories for Epic and Story for GLPR 17',
            'Status': 'Done',
            'Reporter': 'Bierd, Mitch',
            'Assignee': 'Bierd, Mitch',
            'Description': 'Continue with Story formulation for Epic GLPR 17 Create drafts for user stories and acceptance criteria for story\'s under GLPR 17 epic'
        };
        
        // Story 1
        const story1 = chartData.addEntity(new Entity('GLPR-47', 'story', 'DEAS - At least 18 years old to apply for a class 6'));
        story1.properties = {
            'Key': 'GLPR-47',
            'Epic Name': 'NMLP_Issue_CL6LDL',
            'Issue Type': 'Story',
            'Summary': 'DEAS - At least 18 years old to apply for a class 6',
            'Status': 'Cancelled',
            'Reporter': 'Herrera Riveros, Javier',
            'Assignee': 'Herrera Riveros, Javier',
            'Description': 'At least 18 years old to apply for a class 6 As a customer, I need to be at least 18 years of age before becoming eligible to begin my application for a Class 6 licence. So that my application is informed by the NMLP criteria.'
        };
        
        // Story 2
        const story2 = chartData.addEntity(new Entity('GLPR-48', 'story', 'DEAS - New MC Skills EED'));
        story2.properties = {
            'Key': 'GLPR-48',
            'Epic Name': 'NMLP_Issue_CL6LDL',
            'Issue Type': 'Story',
            'Summary': 'DEAS - New MC Skills EED',
            'Status': 'To Do',
            'Reporter': 'Herrera Riveros, Javier',
            'Assignee': 'Rakh, Vrashali',
            'Description': 'MC Skills EED 60 days from class 6 Learners issuance As a customer with a Class 6 Learner\'s license, I want to have an "MC Skills EED" of 60 days from my Class 6L issuance date, So that I can meet the requirements of the NMLP.'
        };
        
        // Position entities
        epic.x = 400;
        epic.y = 200;
        
        workItem.x = 200;
        workItem.y = 350;
        
        story1.x = 400;
        story1.y = 350;
        
        story2.x = 600;
        story2.y = 350;
        
        // Add relationships
        chartData.addRelationship(new Relationship(null, workItem.id, epic.id, 'hierarchical', 'belongs to'))
            .setStrength(1.5);
        chartData.addRelationship(new Relationship(null, story1.id, epic.id, 'hierarchical', 'belongs to'))
            .setStrength(1.5);
        chartData.addRelationship(new Relationship(null, story2.id, epic.id, 'hierarchical', 'belongs to'))
            .setStrength(1.5);
        
        return chartData;
    }

    /**
     * Create a complex dataset to showcase analysis features
     */
    createComplexSampleData() {
        const chartData = new ChartData();
        
        // Add entity types for a software development scenario
        chartData.addEntityType(new EntityType('component', 'Component', 'bi-box', '#6c5ce7'));
        chartData.addEntityType(new EntityType('service', 'Service', 'bi-gear', '#00cec9'));
        chartData.addEntityType(new EntityType('database', 'Database', 'bi-hdd', '#fdcb6e'));
        chartData.addEntityType(new EntityType('api', 'API', 'bi-code-slash', '#e17055'));
        chartData.addEntityType(new EntityType('team', 'Team', 'bi-people', '#a29bfe'));
        
        // Add components (forms a hub pattern)
        const frontend = chartData.addEntity(new Entity('frontend', 'component', 'Frontend App'));
        const backend = chartData.addEntity(new Entity('backend', 'component', 'Backend System'));
        const mobile = chartData.addEntity(new Entity('mobile', 'component', 'Mobile App'));
        
        // Add services (forms a circular dependency pattern)
        const authService = chartData.addEntity(new Entity('auth', 'service', 'Auth Service'));
        const userService = chartData.addEntity(new Entity('users', 'service', 'User Service'));
        const notificationService = chartData.addEntity(new Entity('notif', 'service', 'Notification Service'));
        const billingService = chartData.addEntity(new Entity('billing', 'service', 'Billing Service'));
        const analyticsService = chartData.addEntity(new Entity('analytics', 'service', 'Analytics Service'));
        
        // Add databases
        const userDb = chartData.addEntity(new Entity('userdb', 'database', 'User Database'));
        const contentDb = chartData.addEntity(new Entity('contentdb', 'database', 'Content Database'));
        const analyticsDb = chartData.addEntity(new Entity('analyticsdb', 'database', 'Analytics Database'));
        
        // Add APIs
        const publicApi = chartData.addEntity(new Entity('publicapi', 'api', 'Public API'));
        const internalApi = chartData.addEntity(new Entity('internalapi', 'api', 'Internal API'));
        const partnerApi = chartData.addEntity(new Entity('partnerapi', 'api', 'Partner API'));
        
        // Add teams (forms a hierarchical pattern)
        const developmentTeam = chartData.addEntity(new Entity('devteam', 'team', 'Development Team'));
        const frontendTeam = chartData.addEntity(new Entity('frontendteam', 'team', 'Frontend Team'));
        const backendTeam = chartData.addEntity(new Entity('backendteam', 'team', 'Backend Team'));
        const mobileTeam = chartData.addEntity(new Entity('mobileteam', 'team', 'Mobile Team'));
        const qaTeam = chartData.addEntity(new Entity('qateam', 'team', 'QA Team'));
        
        // Positioning
        // Set positions to form a more organized initial layout
        // Components at top
        frontend.x = 300; frontend.y = 100;
        backend.x = 500; backend.y = 100;
        mobile.x = 700; mobile.y = 100;
        
        // Services in the middle
        authService.x = 200; authService.y = 250;
        userService.x = 400; userService.y = 250;
        notificationService.x = 600; notificationService.y = 250;
        billingService.x = 300; billingService.y = 350;
        analyticsService.x = 500; analyticsService.y = 350;
        
        // Databases
        userDb.x = 200; userDb.y = 450;
        contentDb.x = 400; contentDb.y = 450;
        analyticsDb.x = 600; analyticsDb.y = 450;
        
        // APIs
        publicApi.x = 250; publicApi.y = 550;
        internalApi.x = 450; internalApi.y = 550;
        partnerApi.x = 650; partnerApi.y = 550;
        
        // Teams
        developmentTeam.x = 850; developmentTeam.y = 250;
        frontendTeam.x = 750; frontendTeam.y = 350;
        backendTeam.x = 850; backendTeam.y = 350;
        mobileTeam.x = 950; mobileTeam.y = 350;
        qaTeam.x = 850; qaTeam.y = 450;
        
        // Create relationships
        
        // Hub pattern - frontend connects to multiple services
        chartData.addRelationship(new Relationship(null, frontend.id, authService.id, 'default', 'uses'));
        chartData.addRelationship(new Relationship(null, frontend.id, userService.id, 'default', 'uses'));
        chartData.addRelationship(new Relationship(null, frontend.id, notificationService.id, 'default', 'uses'));
        chartData.addRelationship(new Relationship(null, frontend.id, publicApi.id, 'default', 'uses'));
        
        // Backend connects to services
        chartData.addRelationship(new Relationship(null, backend.id, authService.id, 'default', 'provides'));
        chartData.addRelationship(new Relationship(null, backend.id, userService.id, 'default', 'provides'));
        chartData.addRelationship(new Relationship(null, backend.id, billingService.id, 'default', 'provides'));
        chartData.addRelationship(new Relationship(null, backend.id, analyticsService.id, 'default', 'provides'));
        chartData.addRelationship(new Relationship(null, backend.id, internalApi.id, 'default', 'exposes'));
        
        // Mobile connects to services
        chartData.addRelationship(new Relationship(null, mobile.id, authService.id, 'default', 'uses'));
        chartData.addRelationship(new Relationship(null, mobile.id, userService.id, 'default', 'uses'));
        chartData.addRelationship(new Relationship(null, mobile.id, notificationService.id, 'default', 'uses'));
        chartData.addRelationship(new Relationship(null, mobile.id, publicApi.id, 'default', 'uses'));
        
        // Service interdependencies (including circular references)
        chartData.addRelationship(new Relationship(null, userService.id, authService.id, 'default', 'requires'));
        chartData.addRelationship(new Relationship(null, notificationService.id, userService.id, 'default', 'requires'));
        chartData.addRelationship(new Relationship(null, authService.id, notificationService.id, 'default', 'uses')); // Creates a cycle
        chartData.addRelationship(new Relationship(null, billingService.id, userService.id, 'default', 'requires'));
        chartData.addRelationship(new Relationship(null, analyticsService.id, userService.id, 'default', 'tracks'));
        
        // Services to databases
        chartData.addRelationship(new Relationship(null, authService.id, userDb.id, 'default', 'reads/writes'));
        chartData.addRelationship(new Relationship(null, userService.id, userDb.id, 'default', 'reads/writes'));
        chartData.addRelationship(new Relationship(null, notificationService.id, contentDb.id, 'default', 'reads/writes'));
        chartData.addRelationship(new Relationship(null, analyticsService.id, analyticsDb.id, 'default', 'reads/writes'));
        
        // API connections
        chartData.addRelationship(new Relationship(null, publicApi.id, internalApi.id, 'default', 'routes to'));
        chartData.addRelationship(new Relationship(null, partnerApi.id, internalApi.id, 'default', 'routes to'));
        
        // Team hierarchical relationships
        chartData.addRelationship(new Relationship(null, frontendTeam.id, developmentTeam.id, 'hierarchical', 'reports to'));
        chartData.addRelationship(new Relationship(null, backendTeam.id, developmentTeam.id, 'hierarchical', 'reports to'));
        chartData.addRelationship(new Relationship(null, mobileTeam.id, developmentTeam.id, 'hierarchical', 'reports to'));
        chartData.addRelationship(new Relationship(null, qaTeam.id, developmentTeam.id, 'hierarchical', 'reports to'));
        
        // Teams responsible for components
        chartData.addRelationship(new Relationship(null, frontendTeam.id, frontend.id, 'default', 'develops'));
        chartData.addRelationship(new Relationship(null, backendTeam.id, backend.id, 'default', 'develops'));
        chartData.addRelationship(new Relationship(null, mobileTeam.id, mobile.id, 'default', 'develops'));
        chartData.addRelationship(new Relationship(null, qaTeam.id, publicApi.id, 'default', 'tests'));
        chartData.addRelationship(new Relationship(null, qaTeam.id, internalApi.id, 'default', 'tests'));
        
        return chartData;
    }
}

// Create global instance
const dataManager = new DataManager();
