import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Custom hook for controlling algorithm animation playback.
 * Provides play/pause/step controls and automatic progression through animation steps.
 * 
 * @param {Array<Object>} steps - Array of animation step objects
 * @param {number} speed - Animation speed in milliseconds between steps
 * @param {any} resetTrigger - Value that triggers a reset when changed (e.g., algorithm name)
 * @returns {Object} Controller object with state and control functions
 * @returns {number} returns.index - Current step index (0-based)
 * @returns {Object|null} returns.step - Current step object or null if no steps
 * @returns {boolean} returns.isPlaying - Whether animation is currently playing
 * @returns {Function} returns.play - Start or resume playback
 * @returns {Function} returns.pause - Pause playback
 * @returns {Function} returns.next - Go to next step
 * @returns {Function} returns.prev - Go to previous step
 * @returns {Function} returns.goTo - Jump to specific step index
 * 
 * @example
 * const controller = useAnimationController(steps, 1000, algo);
 * // Use controller.play() to start, controller.pause() to stop
 * // controller.step contains the current animation step data
 */
export default function useAnimationController(steps, speed, resetTrigger = 0) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef(null);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  // Reset when steps change (algorithm or input changed)
  useEffect(() => {
    setIndex(0);
    setIsPlaying(false);
    clearTimeout(animationRef.current);
  }, [steps]);

  // External reset trigger (e.g., data structure switch)
  useEffect(() => {
    setIndex(0);
    setIsPlaying(false);
    clearTimeout(animationRef.current);
  }, [resetTrigger]);

  // Animation playback logic
  useEffect(() => {
    if (isPlaying) {
      if (index < steps.length - 1) {
        // Check if the current step requires a pause before clearing
        const currentStep = steps[index];
        const delay = currentStep?.pauseBeforeClear ? 5000 : speed;

        animationRef.current = setTimeout(() => {
          setIndex(prev => prev + 1);
        }, delay);
      } else {
        // Reached the last step — stop playing
        setIsPlaying(false);
      }
    }

    return () => clearTimeout(animationRef.current);
  }, [isPlaying, index, steps, speed]);

  // Memoized control functions to prevent unnecessary re-renders
  const play = useCallback(() => {
    setIsPlaying((playing) => {
      if (!playing) return true;
      return playing;
    });
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const next = useCallback(() => {
    setIsPlaying(false);
    setIndex(prev => Math.min(prev + 1, Math.max(0, stepsRef.current.length - 1)));
  }, []);

  const prev = useCallback(() => {
    setIsPlaying(false);
    setIndex(prev => Math.max(0, prev - 1));
  }, []);

  const goTo = useCallback((newIndex) => {
    setIsPlaying(false);
    setIndex(newIndex);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setIndex(0);
    clearTimeout(animationRef.current);
  }, []);

  // Memoize the return object to maintain referential equality
  return useMemo(() => ({
    index,
    step: steps[index] || null,
    isPlaying,
    play,
    pause,
    next,
    prev,
    goTo,
    reset,
  }), [index, steps, isPlaying, play, pause, next, prev, goTo, reset]);
}
