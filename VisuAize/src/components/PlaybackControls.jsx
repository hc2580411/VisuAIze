import React, { memo, useCallback, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { MODES } from '../constants';
import './PlaybackControls.css';

const PlaybackControls = memo(({ controller, steps, mode, onPlay }) => {
    // Handle play button click - commit input first, then play
    const handlePlayClick = useCallback(() => {
        if (onPlay) {
            onPlay();
        } else if (controller.index === steps.length - 1 && steps.length > 1) {
            controller.goTo(0);
            setTimeout(() => controller.play(), 10);
        } else {
            controller.play();
        }
    }, [onPlay, controller, steps.length]);

    // Handle progress bar change - pause if playing and jump to step
    const handleProgressChange = useCallback((e) => {
        const newIndex = Number(e.target.value);
        if (controller.isPlaying) {
            controller.pause();
        }
        controller.goTo(newIndex);
    }, [controller]);

    // Calculate progress percentage
    const progressPercent = useMemo(() => {
        if (steps.length <= 1) return 100;
        return Math.round((controller.index / (steps.length - 1)) * 100);
    }, [controller.index, steps.length]);

    return (
        <div className="controls">
            {/* Step Info - only in non-beginner mode */}
            {mode !== MODES.BEGINNER && (
                <div className="step-info">
                    <span className="step-count">
                        Step {controller.index + 1} / {steps.length}
                    </span>
                    <span className="step-percent">{progressPercent}%</span>
                </div>
            )}

            {/* Inline Progress Bar - visible in all modes */}
            <div className="progress-container">
                <input
                    type="range"
                    min="0"
                    max={Math.max(steps.length - 1, 0)}
                    value={controller.index}
                    onChange={handleProgressChange}
                    className="progress-slider"
                    disabled={steps.length <= 1}
                    title={`Step ${controller.index + 1} of ${steps.length}`}
                    aria-label="Animation progress"
                    aria-valuemin={0}
                    aria-valuemax={steps.length - 1}
                    aria-valuenow={controller.index}
                    aria-valuetext={`Step ${controller.index + 1} of ${steps.length}`}
                />
                <div
                    className="progress-fill"
                    style={{ width: `${progressPercent}%` }}
                    aria-hidden="true"
                />
            </div>

            {/* Control Buttons */}
            <div className="control-buttons" role="group" aria-label="Animation controls">
                <button
                    className="btn"
                    onClick={controller.prev}
                    disabled={controller.index === 0 || controller.isPlaying}
                    title="Previous Step (←)"
                    aria-label="Go to previous step"
                >
                    <SkipBack size={16} aria-hidden="true" /> Previous
                </button>

                {controller.isPlaying ? (
                    <button
                        className="btn warn"
                        onClick={controller.pause}
                        title="Pause (Space)"
                        aria-label="Pause animation"
                    >
                        <Pause size={16} aria-hidden="true" /> Pause
                    </button>
                ) : (
                    <button
                        className="btn primary"
                        onClick={handlePlayClick}
                        title="Play (Space)"
                        aria-label="Play animation"
                    >
                        <Play size={16} aria-hidden="true" /> Play
                    </button>
                )}

                <button
                    className="btn"
                    onClick={controller.next}
                    disabled={controller.index === steps.length - 1 || controller.isPlaying}
                    title="Next Step (→)"
                    aria-label="Go to next step"
                >
                    Next<SkipForward size={16} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
});

PlaybackControls.displayName = 'PlaybackControls';

export default PlaybackControls;
