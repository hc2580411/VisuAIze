import React, { memo, useCallback, useMemo, useState, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Zap, Network, Binary, TreePine, Layers, Pyramid, List, ChartLine, X, LogOut, User } from 'lucide-react';
import { ALGORITHM_OPTIONS, COMPLEXITY_DATA, MODES, INPUT_DESCRIPTIONS, INPUT_PLACEHOLDERS, SPEED_PRESETS, DEFAULT_VALUES, BACKGROUND_THEMES } from '../constants';
import InfoPanel from './InfoPanel';
import { useAuth } from '../context/AuthContext';

// Lazy load ComplexityChart for popup
const ComplexityChart = lazy(() => import('./ComplexityChart'));

const dataStructureIcons = {
    array: Binary,
    linkedlist: Network,
    tree: TreePine,
    stack: Layers,
    queue: List,
    heap: Pyramid,
};

const Sidebar = memo(({
    dataType, setDataType,
    mode, setMode,
    algo, setAlgo,
    input, setInput,
    searchTarget, setSearchTarget,
    speed, setSpeed,
    controller, steps,
    dataSize = 5,  // Default data size for complexity chart
    theme = 'light',
    backgroundId = 'default'
}) => {
    const Icon = dataStructureIcons[dataType];
    const [showComplexityModal, setShowComplexityModal] = useState(false);
    const { user, logout } = useAuth();

    // Compute background gradient for modal (like AI Assistant)
    const currentGradient = useMemo(() => {
        const activeBg = BACKGROUND_THEMES.find(b => b.id === backgroundId) || BACKGROUND_THEMES[0];
        return theme === 'dark' ? activeBg.dark : activeBg.light;
    }, [theme, backgroundId]);

    // Memoize computed values
    const inputPlaceholder = useMemo(() => {
        const ph = INPUT_PLACEHOLDERS[dataType];
        if (typeof ph === 'object') return ph[algo] || "";
        return ph;
    }, [dataType, algo]);

    const inputDescription = useMemo(() => {
        const desc = INPUT_DESCRIPTIONS[dataType];
        if (typeof desc === 'object') return desc[algo] || "";
        return desc;
    }, [dataType, algo]);

    const isInputDisabled = useMemo(() =>
        (dataType === "stack" && algo === "pop") ||
        (dataType === "queue" && algo === "dequeue") ||
        (dataType === "heap" && algo === "extractMax") ||
        (dataType === "tree" && (algo === "inorder" || algo === "preorder" || algo === "postorder")),
        [dataType, algo]);

    // Memoized random input generator
    const generateRandomInput = useCallback(() => {
        // 1. Handle Tree Algorithms
        if (dataType === 'tree') {
            const randomVal = Math.floor(Math.random() * 101).toString();
            if (algo === 'bstSearch') {
                if (setSearchTarget) setSearchTarget(randomVal);
            } else {
                setInput(randomVal);
            }
            return;
        }

        // 2. Handle Linked List Algorithms
        if (dataType === 'linkedlist') {
            if (algo === 'insert') {
                const val = Math.floor(Math.random() * 50) + 1;
                const pos = Math.floor(Math.random() * 3); // 0 to 2
                setInput(`${val},${pos}`);
            } else if (algo === 'delete') {
                setInput(String(Math.floor(Math.random() * 50) + 1));
            } else if (algo === 'search') {
                if (setSearchTarget) setSearchTarget(String(Math.floor(Math.random() * 50) + 1));
            }
            return;
        }

        // 3. Handle Stack, Queue, Heap (Push/Enqueue/Insert)
        if (
            (dataType === 'stack' && algo === 'push') ||
            (dataType === 'queue' && algo === 'enqueue') ||
            (dataType === 'heap' && algo === 'insert')
        ) {
            setInput(Math.floor(Math.random() * 90 + 10).toString());
            return;
        }

        // 4. Handle Array Algorithms (Sorting & Search)
        if (dataType === 'array') {
            const count = Math.floor(Math.random() * 5) + 5; // 5 to 9 elements
            const arr = Array.from({ length: count }, () => Math.floor(Math.random() * 50) + 1);
            setInput(arr.join(','));

            if ((algo === 'linearSearch' || algo === 'binarySearch') && setSearchTarget) {
                // 70% chance to pick a value that exists in the array for better visualization
                const shouldPickFromArray = Math.random() < 0.7;
                const target = shouldPickFromArray
                    ? arr[Math.floor(Math.random() * arr.length)]
                    : Math.floor(Math.random() * 50) + 1;
                setSearchTarget(target.toString());
            }
        }
    }, [dataType, algo, setInput, setSearchTarget]);

    return (
        <aside className="sidebar">
            <div className="panel">
                <label className="panel-label">
                    <Icon size={16} /> Data Structure
                </label>
                <select
                    value={dataType}
                    onChange={(e) => setDataType(e.target.value)}
                    className="input-select"
                >
                    <option value="array">Array</option>
                    <option value="linkedlist">Linked List</option>
                    <option value="tree">Binary Tree</option>
                    <option value="stack">Stack</option>
                    <option value="queue">Queue</option>
                    <option value="heap">Heap</option>
                </select>
            </div>

            <div className="panel">
                <label className="panel-label">Mode</label>
                <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="input-select"
                >
                    <option value={MODES.BEGINNER}>Beginner</option>
                    <option value={MODES.INTERMEDIATE}>Intermediate</option>
                    <option value={MODES.ADVANCED}>Advanced</option>
                </select>
            </div>

            <div className="panel">
                <label className="panel-label">
                    <Zap size={16} /> Algorithm
                </label>
                <select
                    value={algo}
                    onChange={(e) => setAlgo(e.target.value)}
                    className="input-select">
                    {ALGORITHM_OPTIONS[dataType]?.map((a) => {
                        // Format algorithm names for display
                        let displayName = a;
                        if (a === "bstInsert") displayName = "Insert";
                        else if (a === "bstDelete") displayName = "Delete";
                        else if (a === "extractMax") displayName = "Extract Max";
                        else if (a === "heapify") displayName = "Heapify";
                        else displayName = a.charAt(0).toUpperCase() + a.slice(1);

                        return (
                            <option key={a} value={a}>
                                {displayName}
                            </option>
                        );
                    })}
                </select>
            </div>

            <div className="panel">
                {/* For linked list/tree search, only show search target */}
                {(dataType === "linkedlist" && algo === "search") || (dataType === "tree" && algo === "bstSearch") ? (
                    <>
                        <label className="panel-label">Search Target</label>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            {dataType === "linkedlist" ? "Enter value to search in the linked list" : "Enter value to search in the tree"}
                        </div>
                        <input
                            value={searchTarget}
                            onChange={(e) => setSearchTarget(e.target.value)}
                            className="input-text"
                            placeholder={dataType === "tree" ? "e.g. 5" : "e.g. 30"}
                            maxLength={dataType === "tree" ? 3 : 10}
                            aria-label="Search target value"
                        />
                    </>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="panel-label">
                                {dataType === "array" && (algo === "linearSearch" || algo === "binarySearch") ? 'Array Data' : 'Input Data'}
                            </label>
                            <button
                                onClick={generateRandomInput}
                                disabled={isInputDisabled}
                                className="btn-xs"
                                title="Generate Random Input"
                                style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer' }}
                            >
                                Shuffle
                            </button>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            {dataType === "array" && (algo === "linearSearch" || algo === "binarySearch") ? 'Enter comma-separated numbers for the array' : inputDescription}
                        </div>
                        {dataType !== "tree" && !(dataType === "array" && (algo === "linearSearch" || algo === "binarySearch")) && <div>No more than 15 inputs</div>}
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="input-text"
                            placeholder={dataType === "array" && (algo === "linearSearch" || algo === "binarySearch") ? "e.g. 50,30,20,40,10" : inputPlaceholder}
                            disabled={isInputDisabled}
                            maxLength={dataType === "tree" ? 3 : 50}
                            aria-label={dataType === "array" && (algo === "linearSearch" || algo === "binarySearch") ? "Array data to search" : "Input data"}
                        />

                        {/* Search Target Input (only for array search algorithms) */}
                        {dataType === "array" && (algo === "linearSearch" || algo === "binarySearch") && (
                            <div style={{ marginTop: '12px' }}>
                                <label className="panel-label" style={{ marginBottom: '4px', display: 'block' }}>
                                    Search Target
                                </label>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    Enter the value to search for
                                </div>
                                <input
                                    value={searchTarget}
                                    onChange={(e) => setSearchTarget(e.target.value)}
                                    className="input-text"
                                    placeholder="e.g. 30"
                                    maxLength={10}
                                    aria-label="Search target value"
                                    style={{ marginTop: '4px' }}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Complexity Info Panel - Clickable to show chart popup */}
            <div
                className="panel complexity-panel-clickable"
                onClick={() => setShowComplexityModal(true)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                title="Click to view complexity graph"
            >
                <label className="panel-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ChartLine size={16} /> Complexity
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 500 }}>
                        View Graph →
                    </span>
                </label>
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Time:</span>
                        <span style={{ fontWeight: "bold", color: "var(--primary)", fontFamily: "'Fira Code', monospace" }}>
                            {COMPLEXITY_DATA[dataType]?.[algo]?.time || "-"}
                        </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                        <span>Space:</span>
                        <span style={{ fontWeight: "bold", color: "var(--text-main)", fontFamily: "'Fira Code', monospace" }}>
                            {COMPLEXITY_DATA[dataType]?.[algo]?.space || "-"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Complexity Chart Modal - rendered as portal to body for full-screen effect */}
            {showComplexityModal && ReactDOM.createPortal(
                <div
                    className="complexity-modal-backdrop"
                    onClick={() => setShowComplexityModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 1999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'fadeIn 0.3s ease-out'
                    }}
                >
                    <div
                        className="complexity-modal-panel"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '50vw',
                            height: '60vh',
                            minWidth: '500px',
                            minHeight: '400px',
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            background: currentGradient,
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '24px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            zIndex: 2000,
                            animation: 'fadeIn 0.2s ease-out'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255, 255, 255, 0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>
                                <ChartLine size={18} color="var(--primary)" />
                                <span>Complexity Analysis</span>
                            </div>
                            <button
                                onClick={() => setShowComplexityModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.color = 'var(--error)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'none';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Chart Content Area */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px',
                            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(5px)'
                        }}>
                            <Suspense fallback={
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: 'var(--text-muted)'
                                }}>
                                    Loading chart...
                                </div>
                            }>
                                <ComplexityChart
                                    dataType={dataType}
                                    algorithm={algo}
                                    dataSize={dataSize}
                                />
                            </Suspense>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Animation Speed Panel */}
            <div className="panel">
                <label className="panel-label">Animation Speed</label>
                {mode === MODES.BEGINNER ? (
                    <div className="speed-preset-buttons">
                        <button
                            className={`speed-btn ${speed === SPEED_PRESETS.SLOW ? 'active' : ''}`}
                            onClick={() => setSpeed(SPEED_PRESETS.SLOW)}
                        >
                            Slow
                        </button>
                        <button
                            className={`speed-btn ${speed === SPEED_PRESETS.MEDIUM ? 'active' : ''}`}
                            onClick={() => setSpeed(SPEED_PRESETS.MEDIUM)}
                        >
                            Medium
                        </button>
                        <button
                            className={`speed-btn ${speed === SPEED_PRESETS.FAST ? 'active' : ''}`}
                            onClick={() => setSpeed(SPEED_PRESETS.FAST)}
                        >
                            Fast
                        </button>
                    </div>
                ) : (
                    <>
                        <input
                            type="range"
                            min="50"
                            max="2000"
                            value={speed}
                            onChange={(e) => setSpeed(Number(e.target.value))}
                            className="input-range"
                        />
                        <div className="range-value">{speed} ms</div>
                    </>
                )}
            </div>


            <InfoPanel
                mode={mode}
                dataType={dataType}
                stepIndex={controller.index}
                steps={steps}
            />

            {/* User Account / Logout */}
            <div className="panel" style={{ marginTop: 'auto', marginBottom: '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                        }}>
                            <User size={14} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {user?.username || 'Guest'}
                        </span>
                    </div>
                    <button
                        onClick={logout}
                        title="Log Out"
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '500'
                        }}
                    >
                        <LogOut size={14} /> Log Out
                    </button>
                </div>
            </div>
        </aside>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
