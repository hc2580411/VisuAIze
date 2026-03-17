import React, { useEffect, useRef, memo, useMemo } from 'react';
import { Terminal } from 'lucide-react';
import './ExecutionLog.css';

// Memoized log entry component for better rendering performance
const LogEntry = memo(({ index, message, isCurrent }) => (
    <div className={`log-entry ${isCurrent ? 'current' : ''}`}>
        <span className="log-step-num">[{index + 1}]</span>
        <span className="log-message">{message}</span>
    </div>
));

LogEntry.displayName = 'LogEntry';

const ExecutionLog = memo(({ steps, currentStepIndex }) => {
    const logContainerRef = useRef(null);

    // Memoize visible steps to prevent unnecessary recalculations
    const visibleSteps = useMemo(() => {
        return steps.slice(0, currentStepIndex + 1).map((step, index) => ({
            index,
            message: step.status || step.message || "State update",
            isCurrent: index === currentStepIndex
        }));
    }, [steps, currentStepIndex]);

    // Auto-scroll to bottom of log - using requestAnimationFrame for performance
    useEffect(() => {
        if (logContainerRef.current) {
            // Use requestAnimationFrame to batch DOM operations
            requestAnimationFrame(() => {
                if (logContainerRef.current) {
                    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
                }
            });
        }
    }, [currentStepIndex, steps]);

    return (
        <div className="panel execution-log-panel">
            <label className="panel-label">
                <Terminal size={16} /> Execution Log
            </label>
            <div 
                className="log-container" 
                ref={logContainerRef}
                role="log"
                aria-live="polite"
                aria-atomic="false"
            >
                {visibleSteps.map(({ index, message, isCurrent }) => (
                    <LogEntry
                        key={index}
                        index={index}
                        message={message}
                        isCurrent={isCurrent}
                    />
                ))}
                {steps.length === 0 && (
                    <div className="log-entry placeholder">Waiting for algorithm start...</div>
                )}
            </div>
        </div>
    );
});

ExecutionLog.displayName = 'ExecutionLog';

export default ExecutionLog;
