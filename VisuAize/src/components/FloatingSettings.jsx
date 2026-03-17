import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { Settings, Palette, Moon, Sun, Zap, X, Keyboard, Sparkles } from 'lucide-react';
import { BACKGROUND_THEMES } from '../constants';
import { debounce } from './utils/helpers';
import './FloatingSettings.css';
import AIAssistant from './AIAssistant';

const FloatingSettings = memo(({ theme, toggleTheme, backgroundId, setBackgroundId, onVisualizeCode, animationsEnabled = true, toggleAnimations }) => {
    // Default position: Bottom Right
    const [position, setPosition] = useState({ x: window.innerWidth - 70, y: window.innerHeight - 70 });
    const [isDragging, setIsDragging] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

    // Refs for drag logic
    const dragStartPos = useRef({ x: 0, y: 0 });
    const hasMoved = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const dx = e.clientX - dragStartPos.current.x;
            const dy = e.clientY - dragStartPos.current.y;

            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                hasMoved.current = true;
            }

            let newX = e.clientX - 24;
            let newY = e.clientY - 24;

            const maxX = window.innerWidth - 48;
            const maxY = window.innerHeight - 48;
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);

                if (hasMoved.current) {
                    const windowWidth = window.innerWidth;
                    const buttonWidth = 48;
                    const padding = 20;

                    const midPoint = windowWidth / 2;
                    const snapX = (position.x + buttonWidth / 2) < midPoint
                        ? padding
                        : windowWidth - buttonWidth - padding;

                    setPosition(prev => ({ ...prev, x: snapX }));
                }
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, position.x]);

    const handleMouseDown = useCallback((e) => {
        setIsDragging(true);
        hasMoved.current = false;
        dragStartPos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const toggleMenu = useCallback(() => {
        if (!hasMoved.current) {
            setIsOpen(prev => !prev);
            if (isOpen) {
                setIsPickerOpen(false);
                setIsShortcutsOpen(false);
                setIsAIAssistantOpen(false);
            }
        }
    }, [isOpen]);

    // Keep in bounds on resize - debounced for performance
    useEffect(() => {
        const handleResize = debounce(() => {
            setPosition(prev => {
                const padding = 20;
                const buttonWidth = 48;
                const windowWidth = window.innerWidth;
                const isLeft = prev.x < windowWidth / 2;
                const newX = isLeft ? padding : windowWidth - buttonWidth - padding;

                return {
                    x: newX,
                    y: Math.min(prev.y, window.innerHeight - 60)
                };
            });
        }, 100);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Memoize position calculations for panel placement
    const isNearBottom = useMemo(() => position.y > window.innerHeight / 2, [position.y]);
    const isNearRight = useMemo(() => position.x > window.innerWidth / 2, [position.x]);

    return (
        <div
            className="floating-settings-container"
            style={{
                left: position.x,
                top: position.y,
                transition: isDragging
                    ? 'none'
                    : 'left 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28), top 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
            }}
        >
            {/* Child Buttons (The "Uncollapsed" Balls) */}
            <div className={`sub-options ${isOpen ? 'open' : ''} ${!isNearBottom ? 'top' : ''}`}>
                <button
                    className="sub-ball"
                    onClick={() => toggleTheme()}
                    title="Toggle Theme"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <button
                    className="sub-ball"
                    onClick={() => {
                        setIsAIAssistantOpen(prev => !prev);
                        setIsPickerOpen(false);
                        setIsShortcutsOpen(false);
                    }}
                    title="AI Assistant"
                    style={{ color: isAIAssistantOpen ? 'var(--primary)' : 'inherit' }}
                >
                    <Zap size={20} fill={isAIAssistantOpen ? "currentColor" : "none"} />
                </button>
                <button
                    className="sub-ball"
                    onClick={() => {
                        setIsPickerOpen(prev => !prev);
                        setIsShortcutsOpen(false);
                        setIsAIAssistantOpen(false);
                    }}
                    title="Background Settings"
                >
                    <Palette size={20} />
                </button>
                <button
                    className="sub-ball"
                    onClick={() => {
                        setIsShortcutsOpen(prev => !prev);
                        setIsPickerOpen(false);
                        setIsAIAssistantOpen(false);
                    }}
                    title="Keyboard Shortcuts"
                >
                    <Keyboard size={20} />
                </button>
                <button
                    className={`sub-ball ${!animationsEnabled ? 'animations-off' : ''}`}
                    onClick={toggleAnimations}
                    title={animationsEnabled ? "Disable Animations" : "Enable Animations"}
                    style={{
                        color: animationsEnabled ? 'var(--primary)' : 'var(--text-muted)',
                        opacity: animationsEnabled ? 1 : 0.6
                    }}
                >
                    <Sparkles size={20} fill={animationsEnabled ? "currentColor" : "none"} />
                </button>
            </div>

            {/* AI Assistant Panel */}
            {isAIAssistantOpen && isOpen && (
                <AIAssistant
                    theme={theme}
                    backgroundId={backgroundId}
                    onClose={() => setIsAIAssistantOpen(false)}
                    onVisualizeCode={onVisualizeCode}
                />
            )}

            {/* Background Picker Panel */}
            {isPickerOpen && isOpen && (
                <div className="floating-bg-picker" style={{
                    right: isNearRight ? '60px' : 'auto',
                    left: isNearRight ? 'auto' : '60px',
                    bottom: isNearBottom ? '0' : 'auto',
                    top: isNearBottom ? 'auto' : '0'
                }}>
                    {BACKGROUND_THEMES.map(bg => (
                        <button
                            key={bg.id}
                            className={`bg-icon-option ${backgroundId === bg.id ? 'active' : ''}`}
                            style={{ background: theme === 'dark' ? bg.dark : bg.light }}
                            onClick={() => setBackgroundId(bg.id)}
                            title={bg.name}
                        />
                    ))}
                </div>
            )}

            {/* Keyboard Shortcuts Panel */}
            {isShortcutsOpen && isOpen && (
                <div className="floating-shortcuts-panel" style={{
                    right: isNearRight ? '60px' : 'auto',
                    left: isNearRight ? 'auto' : '60px',
                    bottom: isNearBottom ? '0' : 'auto',
                    top: isNearBottom ? 'auto' : '0'
                }}>
                    <div className="shortcuts-header">
                        <Keyboard size={16} />
                        <span>Shortcuts</span>
                    </div>
                    <table className="shortcuts-table">
                        <tbody>
                            <tr>
                                <td>Play / Pause</td>
                                <td><kbd>Space</kbd></td>
                            </tr>
                            <tr>
                                <td>Next Step</td>
                                <td><kbd>→</kbd></td>
                            </tr>
                            <tr>
                                <td>Previous Step</td>
                                <td><kbd>←</kbd></td>
                            </tr>
                            <tr>
                                <td>Reset</td>
                                <td><kbd>R</kbd></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Main Gear Button */}
            <button
                className={`main-trigger ${isOpen ? 'open' : ''}`}
                onMouseDown={handleMouseDown}
                onClick={toggleMenu}
                title="Settings"
            >
                {isOpen ? <X size={24} /> : <Settings size={24} />}
            </button>
        </div>
    );
});

FloatingSettings.displayName = 'FloatingSettings';

export default FloatingSettings;
