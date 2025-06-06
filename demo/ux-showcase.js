// demo/ux-showcase.js: UX Enhancement Showcase
// Demonstrates all the enhanced UX features for testing and presentation

class UXShowcase {
    constructor() {
        this.demoSteps = [];
        this.currentStep = 0;
        this.isRunning = false;
        this.setupDemoSteps();
    }

    setupDemoSteps() {
        this.demoSteps = [
            {
                name: "Welcome Notification",
                description: "Show welcome message with app features",
                action: () => {
                    window.uxManager.showNotification(
                        "Welcome to the Enhanced Investigative Analytics Platform! 🎉<br>" +
                        "• Drag & drop file uploads<br>" +
                        "• Real-time search with debouncing<br>" +
                        "• Keyboard shortcuts (try Ctrl+S)<br>" +
                        "• Enhanced tooltips and accessibility", 
                        'success', 
                        8000,
                        {
                            actions: [
                                {
                                    label: "Take Tour",
                                    class: "btn-primary",
                                    onclick: "uxShowcase.startTour()"
                                },
                                {
                                    label: "Skip",
                                    class: "btn-outline-secondary",
                                    onclick: "uxManager.hideNotification(this.closest('.notification').id)"
                                }
                            ]
                        }
                    );
                }
            },
            {
                name: "Loading Demonstration",
                description: "Show enhanced loading states",
                action: () => {
                    window.uxManager.showLoading("Demonstrating enhanced loading states...", "demo");
                    setTimeout(() => {
                        window.uxManager.hideLoading("demo");
                        window.uxManager.showNotification("Loading state demonstrated!", "info", 3000);
                    }, 2000);
                }
            },
            {
                name: "Progress Bar Demo",
                description: "Demonstrate progress tracking",
                action: () => {
                    const progressId = "demo-progress";
                    window.uxManager.showProgress(progressId, "Processing demo data...");
                    
                    let progress = 0;
                    const interval = setInterval(() => {
                        progress += 20;
                        window.uxManager.updateProgress(progressId, progress, `Step ${progress/20} of 5`);
                        
                        if (progress >= 100) {
                            clearInterval(interval);
                            setTimeout(() => {
                                window.uxManager.hideProgress(progressId);
                                window.uxManager.showNotification("Progress demonstration complete!", "success", 3000);
                            }, 500);
                        }
                    }, 500);
                }
            },
            {
                name: "Button State Demo",
                description: "Show enhanced button interactions",
                action: () => {
                    const buttons = ['saveCase', 'loadCase', 'loadSample'];
                    let buttonIndex = 0;
                    
                    const demonstrateButton = () => {
                        if (buttonIndex < buttons.length) {
                            const buttonId = buttons[buttonIndex];
                            window.uxManager.setButtonState(buttonId, 'loading');
                            
                            setTimeout(() => {
                                window.uxManager.setButtonState(buttonId, 'success');
                                buttonIndex++;
                                setTimeout(demonstrateButton, 1000);
                            }, 1500);
                        } else {
                            window.uxManager.showNotification("Button state demonstration complete!", "info", 3000);
                        }
                    };
                    
                    demonstrateButton();
                }
            },
            {
                name: "Notification Types",
                description: "Show all notification types",
                action: () => {
                    const types = [
                        { type: 'info', message: "This is an info notification" },
                        { type: 'success', message: "This is a success notification" },
                        { type: 'warning', message: "This is a warning notification" },
                        { type: 'error', message: "This is an error notification" }
                    ];
                    
                    types.forEach((notif, index) => {
                        setTimeout(() => {
                            window.uxManager.showNotification(notif.message, notif.type, 4000);
                        }, index * 800);
                    });
                }
            },
            {
                name: "Performance Monitoring",
                description: "Demonstrate performance tracking",
                action: () => {
                    // Simulate a slow operation
                    window.uxManager.measurePerformance("demo_slow_operation", () => {
                        const start = Date.now();
                        while (Date.now() - start < 1200) {
                            // Busy wait to simulate slow operation
                        }
                        return "Operation completed";
                    });
                    
                    window.uxManager.showNotification("Check console for performance measurement", "info", 4000);
                }
            },
            {
                name: "Accessibility Features",
                description: "Highlight accessibility enhancements",
                action: () => {
                    window.uxManager.showNotification(
                        "Accessibility Features Active:<br>" +
                        "• ARIA labels on all interactive elements<br>" +
                        "• Keyboard navigation support<br>" +
                        "• High contrast mode support<br>" +
                        "• Screen reader compatibility<br>" +
                        "• Focus management for modals", 
                        'info', 
                        6000
                    );
                    
                    // Demonstrate focus management
                    const searchInput = document.getElementById('searchInput');
                    if (searchInput) {
                        searchInput.focus();
                        searchInput.style.outline = '3px solid #667eea';
                        setTimeout(() => {
                            searchInput.style.outline = '';
                        }, 3000);
                    }
                }
            },
            {
                name: "Interactive Elements",
                description: "Show enhanced interactive features",
                action: () => {
                    // Simulate hover effects on cards
                    const cards = document.querySelectorAll('.card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.style.transform = 'translateY(-4px) scale(1.02)';
                            card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                            
                            setTimeout(() => {
                                card.style.transform = '';
                                card.style.boxShadow = '';
                            }, 1000);
                        }, index * 300);
                    });
                    
                    window.uxManager.showNotification("Interactive card animations demonstrated!", "success", 3000);
                }
            },
            {
                name: "Error Handling",
                description: "Demonstrate error handling with UX feedback",
                action: () => {
                    // Simulate an error
                    try {
                        throw new Error("This is a demonstration error");
                    } catch (error) {
                        window.uxManager.showNotification(
                            `Error Handling Demo: ${error.message}`, 
                            'error', 
                            5000,
                            {
                                actions: [
                                    {
                                        label: "Retry",
                                        class: "btn-outline-light",
                                        onclick: "console.log('Retry clicked')"
                                    },
                                    {
                                        label: "Report Bug",
                                        class: "btn-outline-light",
                                        onclick: "console.log('Bug report clicked')"
                                    }
                                ]
                            }
                        );
                    }
                }
            },
            {
                name: "Completion",
                description: "UX showcase complete",
                action: () => {
                    window.uxManager.showNotification(
                        "🎊 UX Enhancement Showcase Complete!<br>" +
                        "The Investigative Analytics Platform now features:<br>" +
                        "• Modern glassmorphism design<br>" +
                        "• Enhanced user interactions<br>" +
                        "• Comprehensive accessibility<br>" +
                        "• Performance monitoring<br>" +
                        "• Intelligent error handling", 
                        'success', 
                        10000,
                        {
                            actions: [
                                {
                                    label: "Explore Platform",
                                    class: "btn-primary",
                                    onclick: "window.uxManager.showNotification('Happy exploring! 🚀', 'info', 3000)"
                                }
                            ]
                        }
                    );
                }
            }
        ];
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.currentStep = 0;
        this.runNextStep();
    }

    stop() {
        this.isRunning = false;
        this.currentStep = 0;
    }

    runNextStep() {
        if (!this.isRunning || this.currentStep >= this.demoSteps.length) {
            this.isRunning = false;
            return;
        }

        const step = this.demoSteps[this.currentStep];
        console.log(`UX Showcase Step ${this.currentStep + 1}: ${step.name}`);
        
        try {
            step.action();
            this.currentStep++;
            
            // Auto-advance to next step after delay
            setTimeout(() => {
                if (this.isRunning) {
                    this.runNextStep();
                }
            }, this.currentStep === this.demoSteps.length - 1 ? 2000 : 4000);
            
        } catch (error) {
            console.error(`Error in UX showcase step ${step.name}:`, error);
            this.currentStep++;
            setTimeout(() => this.runNextStep(), 1000);
        }
    }

    startTour() {
        // Interactive tour of features
        const tourSteps = [
            {
                element: '#fileInput',
                message: "📁 Enhanced file upload with drag & drop support"
            },
            {
                element: '#searchInput', 
                message: "🔍 Smart search with debouncing and suggestions"
            },
            {
                element: '#cy',
                message: "🕸️ Interactive graph with enhanced tooltips"
            },
            {
                element: '#saveCase',
                message: "💾 Smart buttons with loading states (try Ctrl+S)"
            },
            {
                element: '#chartTabs',
                message: "📊 Enhanced dashboard with modern styling"
            }
        ];

        let stepIndex = 0;
        
        const showTourStep = () => {
            if (stepIndex < tourSteps.length) {
                const step = tourSteps[stepIndex];
                const element = document.querySelector(step.element);
                
                if (element) {
                    // Highlight element
                    element.style.outline = '3px solid #667eea';
                    element.style.outlineOffset = '4px';
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Show message
                    window.uxManager.showNotification(
                        `Tour Step ${stepIndex + 1}/${tourSteps.length}: ${step.message}`,
                        'info',
                        3000
                    );
                    
                    // Remove highlight after delay
                    setTimeout(() => {
                        element.style.outline = '';
                        element.style.outlineOffset = '';
                    }, 3000);
                }
                
                stepIndex++;
                setTimeout(showTourStep, 3500);
            } else {
                window.uxManager.showNotification("Tour complete! Enjoy exploring the platform! 🎉", 'success', 4000);
            }
        };
        
        showTourStep();
    }

    // Utility method to test specific features
    testFeature(featureName) {
        const step = this.demoSteps.find(s => s.name.toLowerCase().includes(featureName.toLowerCase()));
        if (step) {
            console.log(`Testing feature: ${step.name}`);
            step.action();
        } else {
            console.log(`Feature "${featureName}" not found. Available features:`, 
                this.demoSteps.map(s => s.name));
        }
    }

    // Get feature list
    getFeatures() {
        return this.demoSteps.map(step => ({
            name: step.name,
            description: step.description
        }));
    }
}

// Initialize and make globally available
const uxShowcase = new UXShowcase();
window.uxShowcase = uxShowcase;

// Auto-start showcase if in demo mode
if (window.location.search.includes('demo=true')) {
    window.addEventListener('load', () => {
        setTimeout(() => uxShowcase.start(), 2000);
    });
}

console.log('UX Showcase loaded. Use uxShowcase.start() to begin demonstration.');
console.log('Available commands:');
console.log('- uxShowcase.start() - Start full showcase');
console.log('- uxShowcase.startTour() - Interactive feature tour');
console.log('- uxShowcase.testFeature("name") - Test specific feature');
console.log('- uxShowcase.getFeatures() - List all features');
