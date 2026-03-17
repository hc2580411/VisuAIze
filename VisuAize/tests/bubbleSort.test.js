import { expect, test, describe } from 'vitest';
import { bubbleSortSteps } from '../src/components/algorithms/array/bubbleSort';

describe('Bubble Sort Algorithm Visualizer Generator', () => {
    test('correctly sorts an un-ordered array', () => {
        const input = [5, 3, 8, 1, 2];
        const steps = bubbleSortSteps(input);
        
        // The final state array should be completely sorted
        const finalState = steps[steps.length - 1];

        expect(finalState.array).toEqual([1, 2, 3, 5, 8]);
        expect(finalState.done).toBe(true);
    });

    test('handles already sorted array correctly', () => {
        const input = [1, 2, 3, 4, 5];
        const steps = bubbleSortSteps(input);
        
        const finalState = steps[steps.length - 1];

        expect(finalState.array).toEqual([1, 2, 3, 4, 5]);
        expect(finalState.done).toBe(true);
    });
});
