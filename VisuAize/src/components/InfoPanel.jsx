import React, { memo, useMemo } from 'react';
import { Activity, Hash, BookOpen } from 'lucide-react';
import './InfoPanel.css';

const LEGEND_DATA = {
    array: [
        { color: '#6366f1', label: 'Default' },
        { color: '#f59e0b', label: 'Comparing' },
        { color: '#ec4899', label: 'Swapping' },
        { color: '#10b981', label: 'Sorted' },
    ],
    linkedlist: [
        { color: '#6366f1', label: 'Node' },
        { color: '#ec4899', label: 'Active' },
        { color: '#10b981', label: 'New/Found' },
    ],
    tree: [
        { color: '#6366f1', label: 'Node' },
        { color: '#f59e0b', label: 'Traversing' },
        { color: '#10b981', label: 'Found/Inserted' },
    ],
    // Fallback for others
    default: [
        { color: '#6366f1', label: 'Item' },
        { color: '#ec4899', label: 'Active' },
        { color: '#10b981', label: 'Complete' },
    ]
};

const CONCEPTS = {
    array: "An Array is a collection of items stored at contiguous memory locations. Think of it like a row of numbered lockers.",
    linkedlist: "A Linked List is a linear collection of data elements where each element points to the next. It's like a treasure hunt where each clue leads to the next location.",
    tree: "A Binary Tree is a hierarchical structure where each node has at most two children. It's like a family tree turned upside down!",
    stack: "A Stack follows LIFO (Last In, First Out). Think of a stack of plates: you add to the top and remove from the top.",
    queue: "A Queue follows FIFO (First In, First Out). Think of a line at a ticket counter: the first person in line is the first one served.",
    heap: "A Heap is a special tree-based structure that satisfies the heap property. In a Max-Heap, the parent is always greater than its children.",
};

const InfoPanel = memo(({ mode, dataType, stepIndex, steps }) => {

    // Calculate stats for Advanced Mode
    const stats = useMemo(() => {
        if (!steps || stepIndex < 0) return { comparisons: 0, swaps: 0 };

        // This is a simplified estimation since we don't have explicit counters in the step data yet.
        // We count how many steps up to current index had 'compare' or 'swap' properties.
        let comparisons = 0;
        let swaps = 0;

        for (let i = 0; i <= stepIndex; i++) {
            if (steps[i]?.compare) comparisons++;
            if (steps[i]?.swap) swaps++;
        }

        return { comparisons, swaps };
    }, [stepIndex, steps]);

    // Helper to render Variable Watcher
    const renderVariables = () => {
        const currentVars = steps[stepIndex]?.variables || {};
        const hasVars = Object.keys(currentVars).length > 0;

        return (
            <div className="variable-section" style={{ marginTop: mode === 'advanced' ? '1rem' : '0' }}>
                <label className="panel-label"><Hash size={16} /> Variables</label>
                {hasVars ? (
                    <div className="variable-table">
                        <div className="var-row header">
                            <span>Var</span>
                            <span>Value</span>
                        </div>
                        {Object.entries(currentVars).map(([key, val]) => (
                            <div className="var-row" key={key}>
                                <span className="var-name">{key}</span>
                                <span className="var-val">{val !== null ? val : 'null'}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="note-text">
                        * No variables tracked for this step
                    </div>
                )}
            </div>
        );
    };

    if (mode === 'beginner') {
        const legend = LEGEND_DATA[dataType] || LEGEND_DATA.default;
        return (
            <div className="panel info-panel beginner">
                <label className="panel-label"><BookOpen size={16} /> Guide</label>
                <div className="concept-box">
                    {CONCEPTS[dataType]}
                </div>
                <div className="legend-grid">
                    {legend.map((item, i) => (
                        <div key={i} className="legend-item">
                            <span className="legend-dot" style={{ background: item.color }}></span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (mode === 'advanced') {
        return (
            <div className="panel info-panel advanced">
                <label className="panel-label"><Activity size={16} /> Performance</label>
                <div className="stats-grid">
                    <div className="stat-item">
                        <span className="stat-label">Comparisons</span>
                        <span className="stat-value">{stats.comparisons}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Swaps/Ops</span>
                        <span className="stat-value">{stats.swaps}</span>
                    </div>
                </div>
                {renderVariables()}
            </div>
        );
    }

    // Intermediate Mode (Variable Watcher only)
    if (mode === 'intermediate') {
        return (
            <div className="panel info-panel intermediate">
                {renderVariables()}
            </div>
        );
    }

    return null;
});

InfoPanel.displayName = 'InfoPanel';

export default InfoPanel;
