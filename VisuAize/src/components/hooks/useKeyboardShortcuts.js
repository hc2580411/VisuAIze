import { useEffect } from 'react';

const useKeyboardShortcuts = (actions) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Ignore if user is typing in an input or textarea
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
                return;
            }

            const key = event.key.toLowerCase();

            if (key === ' ' && actions.togglePlay) {
                event.preventDefault(); // Prevent scrolling
                actions.togglePlay();
            } else if (key === 'arrowright' && actions.nextStep) {
                actions.nextStep();
            } else if (key === 'arrowleft' && actions.prevStep) {
                actions.prevStep();
            } else if (key === 'r' && actions.reset) {
                actions.reset();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [actions]);
};

export default useKeyboardShortcuts;
