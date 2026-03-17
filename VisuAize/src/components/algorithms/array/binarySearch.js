/**
 * Binary Search Algorithm - O(log n) time complexity
 * Requires a sorted array. Divides search space in half each iteration.
 * 
 * @param {number[]} arr - Sorted array to search through
 * @param {number} target - Value to search for
 * @param {Object} options - Optional algorithm modifications
 * @returns {Array<Object>} Animation steps
 */
export function binarySearchSteps(arr, target) {
    const steps = [];
    // Sort the array first (binary search requires sorted input)
    const a = [...arr].sort((a, b) => a - b);
    const n = a.length;

    // Initial state - show sorted array
    steps.push({
        array: [...a],
        sorted: [],
        message: `Binary Search for ${target} (array must be sorted)`,
        codeLine: 1,
        variables: { left: 0, right: n - 1, mid: null, target }
    });

    steps.push({
        array: [...a],
        sorted: Array.from({ length: n }, (_, i) => i), // Show all as sorted
        message: `Array sorted: [${a.join(', ')}]`,
        codeLine: 2,
        variables: { left: 0, right: n - 1, mid: null, target }
    });

    let left = 0;
    let right = n - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        // Show the current search range
        steps.push({
            array: [...a],
            highlight: Array.from({ length: right - left + 1 }, (_, i) => left + i),
            sorted: Array.from({ length: n }, (_, i) => i),
            message: `Search range: [${left}...${right}], checking middle index ${mid}`,
            codeLine: 6,
            variables: { left, right, mid, target }
        });

        // Compare with middle element
        steps.push({
            array: [...a],
            compare: [mid],
            sorted: Array.from({ length: n }, (_, i) => i),
            message: `Comparing: ${a[mid]} vs ${target}`,
            codeLine: 9,
            variables: { left, right, mid, midValue: a[mid], target }
        });

        if (a[mid] === target) {
            // Found the target
            steps.push({
                array: [...a],
                swap: [mid],
                sorted: Array.from({ length: n }, (_, i) => i),
                message: `Found ${target} at index ${mid}!`,
                codeLine: 10,
                variables: { left, right, mid, target, found: true }
            });

            steps.push({
                array: [...a],
                insert: mid,
                sorted: Array.from({ length: n }, (_, i) => i),
                done: true,
                message: `Search complete: ${target} found at index ${mid}`,
                codeLine: 10,
                variables: { target, result: mid },
                pauseBeforeClear: true
            });

            return steps;
        } else if (a[mid] < target) {
            // Target is in right half
            steps.push({
                array: [...a],
                sorted: Array.from({ length: n }, (_, i) => i),
                message: `${a[mid]} < ${target}, search right half`,
                codeLine: 12,
                variables: { left, right, mid, target, direction: 'right' }
            });
            left = mid + 1;
        } else {
            // Target is in left half
            steps.push({
                array: [...a],
                sorted: Array.from({ length: n }, (_, i) => i),
                message: `${a[mid]} > ${target}, search left half`,
                codeLine: 14,
                variables: { left, right, mid, target, direction: 'left' }
            });
            right = mid - 1;
        }
    }

    // Target not found
    steps.push({
        array: [...a],
        sorted: Array.from({ length: n }, (_, i) => i),
        done: true,
        message: `Search complete: ${target} not found in array`,
        codeLine: 17,
        variables: { target, result: -1 },
        pauseBeforeClear: true
    });

    return steps;
}
