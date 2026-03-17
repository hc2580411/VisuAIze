import React, { useEffect, useRef, memo, useMemo, useState, useCallback } from 'react';
import './CodePanel.css';
import { Code, Edit3, RotateCcw, AlertCircle, CheckCircle, Play } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import { NON_EDITABLE_ALGORITHMS } from '../constants.js';

// ─── Modification Parser ──────────────────────────────────────────────────────
// Scans every changed line and extracts numeric variable assignments.
// Returns an object like { startI: 3, startJ: 1 } or null.
const parseCodeModifications = (originalCode, modifiedCode) => {
    if (!originalCode || !modifiedCode || originalCode === modifiedCode) return null;

    const modifications = {};
    const originalLines = originalCode.split('\n');
    const modifiedLines = modifiedCode.split('\n');

    modifiedLines.forEach((modLine, idx) => {
        const origLine = originalLines[idx] || '';
        if (modLine === origLine) return;

        // for (let i = X ...) — outer loop start
        const forI = modLine.match(/for\s*\(\s*let\s+i\s*=\s*(\d+)/);
        const origForI = origLine.match(/for\s*\(\s*let\s+i\s*=\s*(\d+)/);
        if (forI && origForI && parseInt(forI[1]) !== parseInt(origForI[1])) {
            modifications.startI = parseInt(forI[1]);
        }

        // for (let j = X ...) — inner loop start
        const forJ = modLine.match(/for\s*\(\s*let\s+j\s*=\s*(\d+)/);
        const origForJ = origLine.match(/for\s*\(\s*let\s+j\s*=\s*(\d+)/);
        if (forJ && origForJ && parseInt(forJ[1]) !== parseInt(origForJ[1])) {
            modifications.startJ = parseInt(forJ[1]);
        }

        // Generic: capture any "varName = NUMBER" assignments that changed
        const assignRe = /\b(\w+)\s*=\s*(\d+)/g;
        const origAssignRe = /\b(\w+)\s*=\s*(\d+)/g;
        let m, origMatches = {};
        while ((m = origAssignRe.exec(origLine)) !== null) {
            origMatches[m[1]] = parseInt(m[2]);
        }
        while ((m = assignRe.exec(modLine)) !== null) {
            const varName = m[1];
            const newVal = parseInt(m[2]);
            if (varName in origMatches && origMatches[varName] !== newVal) {
                // Map common variable names to known options keys
                if (varName === 'i') modifications.startI = newVal;
                else if (varName === 'j') modifications.startJ = newVal;
                else modifications[varName] = newVal;
            }
        }
    });

    return Object.keys(modifications).length > 0 ? modifications : null;
};

// ─── Find editable numeric segments in a single line ─────────────────────────
// Returns [{start, end, value}] for every standalone number that can be tweaked.
// Captures pairs like "= 0", "< 10", "( 5" and records the position of the digit.
const findEditableNumbers = (line) => {
    const segments = [];
    // Group 1: the preceding operator/delimiter (non-capturing context)
    // Group 2: the number itself
    // This avoids lookbehind for broader browser compatibility.
    const re = /([=<>!+\-*/,(\s]\s*)(\d+)(?=\s*[;,)\s<>+\-*/]|$)/g;
    let m;
    while ((m = re.exec(line)) !== null) {
        // m[1] = preceding operator/space, m[2] = the number
        const numStart = m.index + m[1].length;
        const numEnd = numStart + m[2].length;
        segments.push({ start: numStart, end: numEnd, value: m[2] });
    }
    return segments;
};

// ─── Memoized Prism token renderer ───────────────────────────────────────────
const renderToken = (token, key) => {
    if (typeof token === 'string') return token;
    const content = Array.isArray(token.content)
        ? token.content.map((t, i) => renderToken(t, i))
        : renderToken(token.content, 0);
    return <span key={key} className={`token ${token.type}`}>{content}</span>;
};

// ─── Inline Number Chip ───────────────────────────────────────────────────────
// Renders a line with clickable number chips for editable values.
const InlineEditLine = memo(({ lineNum, line, isHighlighted, hasChanges, isEditMode, onValueChange }) => {
    const [activeChip, setActiveChip] = useState(null); // index of chip being edited
    const inputRef = useRef(null);

    const editableNums = useMemo(() => isEditMode ? findEditableNumbers(line) : [], [line, isEditMode]);

    useEffect(() => {
        if (activeChip !== null && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [activeChip]);

    const handleChipClick = (idx) => {
        if (!isEditMode) return;
        setActiveChip(idx);
    };

    const handleChipCommit = (idx, newRaw) => {
        setActiveChip(null);
        const seg = editableNums[idx];
        if (!seg) return;
        const newVal = parseInt(newRaw, 10);
        if (isNaN(newVal)) return; // reject non-numeric
        if (String(newVal) === seg.value) return; // no change
        // Build new line by splicing the value
        const newLine = line.slice(0, seg.start) + String(newVal) + line.slice(seg.end);
        onValueChange(lineNum, newLine);
    };

    const handleKeyDown = (e, idx, currentRaw) => {
        if (e.key === 'Enter') { e.preventDefault(); handleChipCommit(idx, currentRaw); }
        if (e.key === 'Escape') { e.preventDefault(); setActiveChip(null); }
        // Allow only digits and minus
        if (!/[\d-]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
            e.preventDefault();
        }
    };

    // Build the line as React children, inserting chips at editable positions
    if (isEditMode && editableNums.length > 0) {
        const parts = [];
        let cursor = 0;
        editableNums.forEach((seg, idx) => {
            // Text before chip
            if (cursor < seg.start) {
                const slice = line.slice(cursor, seg.start);
                const tokens = Prism.tokenize(slice, Prism.languages.javascript);
                parts.push(<span key={`pre-${idx}`} className="line-text-part">{tokens.map((t, i) => renderToken(t, i))}</span>);
            }
            // Chip
            if (activeChip === idx) {
                parts.push(
                    <input
                        key={`chip-input-${idx}`}
                        ref={inputRef}
                        type="number"
                        className="number-chip-input"
                        defaultValue={seg.value}
                        onBlur={(e) => handleChipCommit(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, e.target.value)}
                        style={{ width: `${Math.max(seg.value.length + 1, 3)}ch` }}
                    />
                );
            } else {
                parts.push(
                    <span
                        key={`chip-${idx}`}
                        className="number-chip editable"
                        onClick={() => handleChipClick(idx)}
                        title="Click to edit this value"
                    >
                        {seg.value}
                    </span>
                );
            }
            cursor = seg.end;
        });
        // Remaining text
        if (cursor < line.length) {
            const slice = line.slice(cursor);
            const tokens = Prism.tokenize(slice, Prism.languages.javascript);
            parts.push(<span key="tail" className="line-text-part">{tokens.map((t, i) => renderToken(t, i))}</span>);
        }

        return (
            <div className={`code-line line-${lineNum} ${isHighlighted ? 'highlight' : ''} ${hasChanges ? 'modified' : ''} edit-mode-active`}>
                <span className="line-number">{lineNum}</span>
                <span className="line-text inline-edit-line">{parts}</span>
                {hasChanges && <span className="change-indicator" title="Modified"><Edit3 size={12} /></span>}
            </div>
        );
    }

    // Normal read-only line
    const tokens = Prism.tokenize(line, Prism.languages.javascript);
    return (
        <div className={`code-line line-${lineNum} ${isHighlighted ? 'highlight' : ''} ${hasChanges ? 'modified' : ''} ${isEditMode && editableNums.length > 0 ? 'has-editable' : ''}`}>
            <span className="line-number">{lineNum}</span>
            <span className="line-text">{tokens.map((t, i) => renderToken(t, i))}</span>
            {hasChanges && <span className="change-indicator" title="Modified from original"><Edit3 size={12} /></span>}
        </div>
    );
});

InlineEditLine.displayName = 'InlineEditLine';

// ─── Standard read-only line ──────────────────────────────────────────────────
const CodeLine = memo(({ lineNum, isHighlighted, tokens }) => (
    <div className={`code-line line-${lineNum} ${isHighlighted ? 'highlight' : ''}`}>
        <span className="line-number">{lineNum}</span>
        <span className="line-text">{tokens.map((t, i) => renderToken(t, i))}</span>
    </div>
));
CodeLine.displayName = 'CodeLine';

// ─── CodePanel ────────────────────────────────────────────────────────────────
const CodePanel = memo(({
    code,
    currentLine,
    mode,
    algo,
    dataType,
    addToast,
    onCodeModified,
    onRunModified,
    isAnalyzing
}) => {
    const scrollRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedCode, setEditedCode] = useState(null);
    const [changedLines, setChangedLines] = useState(new Set());
    const [validationError, setValidationError] = useState(null);

    // Reset when the algorithm/code changes
    useEffect(() => {
        setEditedCode(null);
        setChangedLines(new Set());
        setValidationError(null);
        setIsEditing(false);
    }, [code]);

    const displayCode = editedCode || code;

    // Tokenize lines for read-only rendering
    const tokenizedLines = useMemo(() => {
        if (!displayCode) return [];
        return displayCode.split('\n').map((line, index) => ({
            lineNum: index + 1,
            line,
            tokens: Prism.tokenize(line, Prism.languages.javascript)
        }));
    }, [displayCode]);

    // Called by InlineEditLine when a number chip is committed
    const handleValueChange = useCallback((lineNum, newLineContent) => {
        const lines = (editedCode || code).split('\n');
        const originalLines = code.split('\n');
        lines[lineNum - 1] = newLineContent;
        const newCode = lines.join('\n');

        setEditedCode(newCode);

        const newChangedLines = new Set();
        lines.forEach((line, idx) => {
            if (line !== originalLines[idx]) newChangedLines.add(idx + 1);
        });
        setChangedLines(newChangedLines);
        setValidationError(null); // numeric-only edits can't break syntax

        if (onCodeModified) {
            const mods = parseCodeModifications(code, newCode);
            onCodeModified(newCode, mods);
        }
    }, [editedCode, code, onCodeModified]);

    const handleReset = useCallback(() => {
        setEditedCode(null);
        setChangedLines(new Set());
        setValidationError(null);
        if (onCodeModified) onCodeModified(null, null);
    }, [onCodeModified]);

    const isNonEditable = NON_EDITABLE_ALGORITHMS[dataType]?.includes(algo);

    const handleToggleEdit = useCallback(() => {
        if (!isEditing && isNonEditable) {
            if (addToast) {
                addToast(`This algorithm doesn't support code editing`, 'warning');
            }
            return;
        }
        setIsEditing(prev => !prev);
    }, [isEditing, isNonEditable, addToast]);

    const handleRunModified = useCallback(() => {
        if (!editedCode || validationError || !onRunModified) return;
        const mods = parseCodeModifications(code, editedCode);
        onRunModified(mods);
    }, [editedCode, validationError, onRunModified, code]);

    // Auto-scroll to highlighted line
    useEffect(() => {
        if (currentLine && scrollRef.current && mode !== 'beginner' && !isEditing) {
            requestAnimationFrame(() => {
                const el = scrollRef.current?.querySelector(`.line-${currentLine}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }
    }, [currentLine, mode, isEditing]);

    if (mode === 'beginner' || !code) return null;

    const isAdvancedMode = mode === 'advanced';
    const hasChanges = changedLines.size > 0;

    return (
        <div className="code-panel">
            <div className="code-header">
                <Code size={16} />
                <span>Algorithm Code</span>

                {isAdvancedMode && (
                    <div className="code-header-actions">
                        {hasChanges && (
                            <>
                                <button
                                    className="code-action-btn reset-btn"
                                    onClick={handleReset}
                                    title="Reset to original"
                                >
                                    <RotateCcw size={14} />
                                    Reset
                                </button>
                                <button
                                    className={`code-action-btn analyze-btn ${validationError ? 'disabled' : ''}`}
                                    onClick={handleRunModified}
                                    disabled={!!validationError || isAnalyzing}
                                    title={validationError ? 'Fix errors before running' : 'Run with modified values'}
                                >
                                    <Play size={14} />
                                    Run Modified
                                </button>
                            </>
                        )}
                        <button
                            className={`code-action-btn edit-btn ${isEditing ? 'active' : ''}`}
                            onClick={handleToggleEdit}
                            title={isEditing ? 'Exit edit mode' : 'Edit numeric values'}
                        >
                            <Edit3 size={14} />
                            {isEditing ? 'Done' : 'Edit'}
                        </button>
                    </div>
                )}
            </div>

            {/* Banners */}
            {validationError && (
                <div className="code-validation-error">
                    <AlertCircle size={14} />
                    <span>Error: {validationError}</span>
                </div>
            )}

            {hasChanges && !validationError && (
                <div className="code-validation-success">
                    <CheckCircle size={14} />
                    <span>{changedLines.size} line{changedLines.size > 1 ? 's' : ''} modified — click <strong>Run Modified</strong> to visualize</span>
                </div>
            )}

            {isEditing && isAdvancedMode && (
                <div className="edit-mode-hint">
                    <span>✏️ Click any <span className="hint-chip-demo">highlighted number</span> to change its value. Only numeric values can be edited.</span>
                </div>
            )}

            <div className="code-content" ref={scrollRef}>
                <pre>
                    {tokenizedLines.map(({ lineNum, line, tokens }) =>
                        isAdvancedMode ? (
                            <InlineEditLine
                                key={lineNum}
                                lineNum={lineNum}
                                line={line}
                                isHighlighted={currentLine === lineNum}
                                hasChanges={changedLines.has(lineNum)}
                                isEditMode={isEditing}
                                onValueChange={handleValueChange}
                            />
                        ) : (
                            <CodeLine
                                key={lineNum}
                                lineNum={lineNum}
                                isHighlighted={currentLine === lineNum}
                                tokens={tokens}
                            />
                        )
                    )}
                </pre>
            </div>

            {/* Diff summary */}
            {hasChanges && !isEditing && (
                <div className="code-diff-panel">
                    <div className="diff-header">
                        <span>📝 Changes Summary</span>
                    </div>
                    <div className="diff-content">
                        {Array.from(changedLines).sort((a, b) => a - b).map(lineNum => {
                            const originalLine = code.split('\n')[lineNum - 1];
                            const modifiedLine = displayCode.split('\n')[lineNum - 1];
                            return (
                                <div key={lineNum} className="diff-item">
                                    <div className="diff-line-num">Line {lineNum}</div>
                                    <div className="diff-original">
                                        <span className="diff-label">−</span>
                                        <code>{originalLine}</code>
                                    </div>
                                    <div className="diff-modified">
                                        <span className="diff-label">+</span>
                                        <code>{modifiedLine}</code>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
});

CodePanel.displayName = 'CodePanel';
export default CodePanel;
