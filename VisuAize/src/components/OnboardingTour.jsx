import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';

/**
 * Comprehensive tour steps.
 * Each step targets a CSS selector and displays an explanation near it.
 * `action` is an optional function name the tour will call before showing the step.
 */
const TOUR_STEPS = [
    // === SIDEBAR FIELDS ===
    {
        selector: '.sidebar',
        title: 'Welcome to VisuAize!',
        message: 'This guided tour will walk you through every part of the interface. Let\'s start with the sidebar — your main control panel for configuring visualizations.',
        position: 'right',
    },
    {
        selector: '.sidebar > .panel:nth-child(1)',
        title: 'Data Structure Selector',
        message: 'Choose the data structure you want to explore. Options include Array, Linked List, Binary Tree, Stack, Queue, and Heap. Changing this will update the entire visualization, algorithm list, and input format.',
        position: 'right',
    },
    {
        selector: '.sidebar > .panel:nth-child(2)',
        title: 'Mode Selector',
        message: 'Switch between three learning modes:\n• Beginner — simplified controls, speed presets (Slow/Medium/Fast), and a helpful guide panel.\n• Intermediate — adds the code panel so you can follow along with the source code.\n• Advanced — includes the execution log, code editing, and fine-grained speed slider.',
        position: 'right',
    },
    {
        selector: '.sidebar > .panel:nth-child(3)',
        title: 'Algorithm Selector',
        message: 'Pick which algorithm or operation to visualize. The available algorithms change based on your chosen data structure. For example, Array offers Bubble Sort, Merge Sort, Quick Sort, and more.',
        position: 'right',
    },
    {
        selector: '.sidebar > .panel:nth-child(4)',
        title: 'Input Data',
        message: 'Enter custom data for the algorithm to work with. For arrays, type comma-separated numbers like "50,30,20,40,10". For stacks/queues, enter a single value to push/enqueue. The "Shuffle" button generates random data for quick testing.',
        position: 'right',
    },
    {
        selector: '.complexity-panel-clickable',
        title: 'Complexity Info',
        message: 'Displays the Time and Space complexity (Big-O notation) for the currently selected algorithm. Click "View Graph →" to open a detailed complexity comparison chart that visualizes how algorithms scale with input size.',
        position: 'right',
    },
    {
        selector: '.sidebar > .panel:nth-child(6)',
        title: 'Animation Speed',
        message: 'Control how fast the visualization plays. In Beginner mode, you get simple preset buttons (Slow, Medium, Fast). In Intermediate/Advanced modes, a precise slider lets you fine-tune the delay from 50ms to 2000ms per step.',
        position: 'right',
    },
    {
        selector: '.info-panel',
        title: 'Info & Guide Panel',
        message: 'This section adapts to your mode:\n• In Beginner mode, it shows a friendly description of the data structure, plus a color legend explaining what each bar/node color means during execution.\n• In Intermediate/Advanced modes, it shows live Performance stats (comparisons & swaps) and a Variables tracker displaying the algorithm\'s current local variables.',
        position: 'right',
    },

    // === MAIN VISUALIZATION AREA ===
    {
        selector: '.vis-container',
        title: 'Visualization Canvas',
        message: 'This is the main stage where algorithms come alive! Bars, nodes, and linked list elements animate here in real time. You can drag and drop elements to rearrange data, and the "Clear" button in the top-right corner resets the animation.',
        position: 'left',
    },

    // === PLAYBACK CONTROLS ===
    {
        selector: '.controls',
        title: 'Playback Controls',
        message: 'The bottom control bar lets you navigate through algorithm execution:\n• Previous / Next — step backward or forward one frame at a time.\n• Play — run the entire animation automatically.\n• The step counter shows your current position (e.g. "Step 3 / 30").\n• The circular progress indicator visualizes overall completion.',
        position: 'top',
    },

    // === FLOATING SETTINGS ===
    {
        selector: '.floating-settings-container',
        title: 'Settings Menu',
        message: 'This floating gear button gives you quick access to global settings. Click it to expand the menu. You can also drag it to reposition it anywhere on screen. Let\'s open it and explore each option!',
        position: 'left',
        action: 'openFloatingSettings',
    },
    {
        selector: '.sub-options',
        title: 'Settings Options',
        message: 'Here are all the settings buttons, from top to bottom:\n\n🌙 Theme Toggle — switch between Light and Dark mode.\n⚡ AI Assistant — open the AI tutor to ask questions about algorithms.\n🎨 Background — choose from 6 beautiful gradient backgrounds.\n⌨️ Shortcuts — view all keyboard shortcuts (Space, Arrow Keys, R).\n✨ Animations — toggle entrance/exit animations on or off.',
        position: 'left',
    },
];

/**
 * Calculates spotlight position for a given DOM element.
 */
function getSpotlight(el) {
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const pad = 10;
    return {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
    };
}

export default function OnboardingTour({ onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [spotlight, setSpotlight] = useState(null);
    const [visible, setVisible] = useState(true);
    const tooltipRef = useRef(null);

    const step = TOUR_STEPS[currentStep];

    // Execute actions before showing certain steps
    const executeStepAction = useCallback((stepData) => {
        if (!stepData?.action) return;

        if (stepData.action === 'openFloatingSettings') {
            // Click the main trigger button to open the floating settings
            const trigger = document.querySelector('.main-trigger');
            if (trigger && !trigger.classList.contains('open')) {
                trigger.click();
            }
        }
    }, []);

    // Measure and position the spotlight on the current target element
    const updateSpotlight = useCallback(() => {
        if (!step) return;

        // Small delay to allow DOM to update after actions
        requestAnimationFrame(() => {
            const el = document.querySelector(step.selector);
            if (el) {
                setSpotlight(getSpotlight(el));
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }, [step]);

    useEffect(() => {
        // Execute action before measuring
        executeStepAction(step);

        // Small delay for DOM to settle after action
        const timer = setTimeout(() => {
            updateSpotlight();
        }, step?.action ? 400 : 50);

        window.addEventListener('resize', updateSpotlight);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateSpotlight);
        };
    }, [step, updateSpotlight, executeStepAction]);

    const finishTour = useCallback(() => {
        // Close the floating settings if open
        const trigger = document.querySelector('.main-trigger.open');
        if (trigger) trigger.click();

        setStorageItem(STORAGE_KEYS.TOUR_COMPLETED, true);
        setVisible(false);
        if (onComplete) onComplete();
    }, [onComplete]);

    const handleNext = useCallback(() => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            finishTour();
        }
    }, [currentStep, finishTour]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    const handleSkip = useCallback(() => {
        finishTour();
    }, [finishTour]);

    if (!visible || !spotlight) return null;

    // Calculate tooltip position based on the step's preferred position
    const tooltipStyle = {};
    const arrowDir = step.position;
    const gap = 16;

    if (arrowDir === 'right') {
        tooltipStyle.top = Math.min(
            spotlight.top + spotlight.height / 2,
            window.innerHeight - 280
        );
        tooltipStyle.left = Math.min(
            spotlight.left + spotlight.width + gap,
            window.innerWidth - 380
        );
        tooltipStyle.transform = 'translateY(-50%)';
    } else if (arrowDir === 'left') {
        tooltipStyle.top = Math.min(
            spotlight.top + spotlight.height / 2,
            window.innerHeight - 280
        );
        tooltipStyle.right = Math.max(
            window.innerWidth - spotlight.left + gap,
            16
        );
        tooltipStyle.transform = 'translateY(-50%)';
    } else if (arrowDir === 'top') {
        tooltipStyle.bottom = Math.max(
            window.innerHeight - spotlight.top + gap,
            16
        );
        tooltipStyle.left = spotlight.left + spotlight.width / 2;
        tooltipStyle.transform = 'translateX(-50%)';
    } else {
        tooltipStyle.top = spotlight.top + spotlight.height + gap;
        tooltipStyle.left = spotlight.left + spotlight.width / 2;
        tooltipStyle.transform = 'translateX(-50%)';
    }

    return (
        <div className="tour-overlay">
            {/* Full-screen SVG mask with a cutout for the spotlight area */}
            <svg className="tour-mask" width="100%" height="100%">
                <defs>
                    <mask id="tour-spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <rect
                            x={spotlight.left}
                            y={spotlight.top}
                            width={spotlight.width}
                            height={spotlight.height}
                            rx="12"
                            fill="black"
                        />
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.72)"
                    mask="url(#tour-spotlight-mask)"
                />
                {/* Spotlight border glow */}
                <rect
                    x={spotlight.left}
                    y={spotlight.top}
                    width={spotlight.width}
                    height={spotlight.height}
                    rx="12"
                    fill="none"
                    stroke="rgba(99, 102, 241, 0.6)"
                    strokeWidth="2"
                    className="tour-spotlight-ring"
                />
            </svg>

            {/* Tooltip Card */}
            <div
                ref={tooltipRef}
                className={`tour-tooltip tour-tooltip-${arrowDir}`}
                style={tooltipStyle}
                key={currentStep} /* Force re-mount for animation */
            >
                <div className="tour-tooltip-step">
                    Step {currentStep + 1} of {TOUR_STEPS.length}
                </div>
                <h3 className="tour-tooltip-title">{step.title}</h3>
                <p className="tour-tooltip-msg">
                    {step.message.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line}
                            {i < step.message.split('\n').length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </p>
                <div className="tour-tooltip-actions">
                    <button className="tour-btn-skip" onClick={handleSkip}>
                        Skip Tour
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {currentStep > 0 && (
                            <button className="tour-btn-prev" onClick={handlePrev}>
                                Back
                            </button>
                        )}
                        <button className="tour-btn-next" onClick={handleNext}>
                            {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
                {/* Progress dots */}
                <div className="tour-dots">
                    {TOUR_STEPS.map((_, i) => (
                        <span
                            key={i}
                            className={`tour-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
