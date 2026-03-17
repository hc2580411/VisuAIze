export function bubbleSortSteps(arr, options = {}) {
    const a = [...arr];
    const steps = [];
    const n = a.length;
    const sortedIndices = [];

    // Allow custom starting indices from code modifications
    const startI = options.startI ?? 0;
    const startJ = options.startJ ?? 0;

    // Initial state
    steps.push({
        array: [...a],
        sorted: [],
        message: startI > 0 ? `Starting Bubble Sort from pass ${startI + 1}` : "Starting Bubble Sort",
        codeLine: 1,
        variables: { i: startI, j: startJ, temp: null }
    });

    for (let i = startI; i < n; i++) {
        steps.push({
            array: [...a],
            sorted: [...sortedIndices],
            message: `Starting pass ${i + 1}`,
            codeLine: 3,
            variables: { i, j: 0, temp: null }
        });

        const innerStart = (i === startI) ? startJ : 0;
        for (let j = innerStart; j < n - i - 1; j++) {
            // Compare
            steps.push({
                array: [...a],
                compare: [j, j + 1],
                sorted: [...sortedIndices],
                message: `Comparing ${a[j]} and ${a[j + 1]}`,
                codeLine: 6,
                variables: { i, j, temp: null }
            });

            if (a[j] > a[j + 1]) {
                // Swap
                const temp = a[j];
                [a[j], a[j + 1]] = [a[j + 1], a[j]];
                steps.push({
                    array: [...a],
                    swap: [j, j + 1],
                    sorted: [...sortedIndices],
                    message: `Swapping ${a[j + 1]} and ${a[j]}`,
                    codeLine: 8,
                    variables: { i, j, temp }
                });
            }
        }

        sortedIndices.push(n - i - 1);

        steps.push({
            array: [...a],
            insert: n - i - 1,
            sorted: [...sortedIndices],
            message: `${a[n - i - 1]} is now sorted`,
            codeLine: 3,
            variables: { i, j: n - i - 1, temp: null }
        });
    }

    steps.push({
        array: [...a],
        sorted: Array.from({ length: n }, (_, i) => i),
        done: true,
        message: "Array is fully sorted!",
        codeLine: 14,
        variables: { i: n, j: null, temp: null },
        pauseBeforeClear: true
    });

    return steps;
}
