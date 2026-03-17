/**
 * Linear Search Algorithm - O(n) time complexity
 * Searches through each element sequentially until the target is found
 * 
 * @param {number[]} arr - Array to search through
 * @param {number} target - Value to search for
 * @param {Object} options - Optional algorithm modifications
 * @returns {Array<Object>} Animation steps
 */
export function linearSearchSteps(arr, target) {
    const steps = [];
    const a = [...arr];
    const n = a.length;

    // Initial state
    steps.push({
        array: [...a],
        sorted: [],
        message: `Starting Linear Search for ${target}`,
        codeLine: 1,
        variables: { i: 0, target, found: false }
    });

    // Search through each element
    for (let i = 0; i < n; i++) {
        // Highlight current element being checked
        steps.push({
            array: [...a],
            compare: [i],
            sorted: [],
            message: `Checking index ${i}: Is ${a[i]} equal to ${target}?`,
            codeLine: 5,
            variables: { i, target, currentValue: a[i] }
        });

        if (a[i] === target) {
            // Found the target
            steps.push({
                array: [...a],
                swap: [i], // Using swap color to highlight found element
                sorted: [],
                message: `Found ${target} at index ${i}!`,
                codeLine: 5,
                variables: { i, target, found: true }
            });

            steps.push({
                array: [...a],
                insert: i, // Green highlight for success
                sorted: [],
                done: true,
                message: `Search complete: ${target} found at index ${i}`,
                codeLine: 6,
                variables: { i, target, result: i },
                pauseBeforeClear: true
            });

            return steps;
        }

        // Not found at this index, continue
        steps.push({
            array: [...a],
            sorted: [],
            message: `${a[i]} ≠ ${target}, moving to next element`,
            codeLine: 8,
            variables: { i, target, currentValue: a[i] }
        });
    }

    // Target not found
    steps.push({
        array: [...a],
        sorted: [],
        done: true,
        message: `Search complete: ${target} not found in array`,
        codeLine: 11,
        variables: { target, result: -1 },
        pauseBeforeClear: true
    });

    return steps;
}
