export function selectionSortSteps(arr, options = {}) {
    const a = [...arr];
    const steps = [];
    const n = a.length;
    const sortedIndices = [];

    // Allow custom starting index from code modifications
    const startI = options.startI ?? 0;

    // Initial state
    steps.push({
        array: [...a],
        sorted: [],
        message: startI > 0 ? `Starting Selection Sort from index ${startI}` : "Starting Selection Sort",
        codeLine: 1,
        variables: { i: startI, j: startI, minIdx: startI }
    });

    for (let i = startI; i < n - 1; i++) {
        let minIdx = i;

        steps.push({
            array: [...a],
            sorted: [...sortedIndices],
            highlight: [i],
            message: `Finding minimum from index ${i}`,
            codeLine: 3,
            variables: { i, j: i, minIdx: i }
        });

        for (let j = i + 1; j < n; j++) {
            // Compare
            steps.push({
                array: [...a],
                compare: [minIdx, j],
                sorted: [...sortedIndices],
                highlight: [i],
                message: `Comparing ${a[minIdx]} and ${a[j]}`,
                codeLine: 7,
                variables: { i, j, minIdx }
            });

            if (a[j] < a[minIdx]) {
                minIdx = j;
                steps.push({
                    array: [...a],
                    highlight: [minIdx],
                    sorted: [...sortedIndices],
                    message: `New minimum found: ${a[minIdx]}`,
                    codeLine: 8,
                    variables: { i, j, minIdx }
                });
            }
        }

        // Swap if needed
        if (minIdx !== i) {
            const _temp = a[i];
            [a[i], a[minIdx]] = [a[minIdx], a[i]];
            steps.push({
                array: [...a],
                swap: [i, minIdx],
                sorted: [...sortedIndices],
                message: `Swapping ${a[minIdx]} and ${a[i]}`,
                codeLine: 13,
                variables: { i, j: n, minIdx }
            });
        }

        sortedIndices.push(i);

        steps.push({
            array: [...a],
            insert: i,
            sorted: [...sortedIndices],
            message: `${a[i]} is now sorted`,
            codeLine: 3,
            variables: { i, j: n, minIdx }
        });
    }

    sortedIndices.push(n - 1);

    steps.push({
        array: [...a],
        sorted: Array.from({ length: n }, (_, i) => i),
        done: true,
        message: "Array is fully sorted!",
        codeLine: 19,
        variables: { i: n, j: n, minIdx: n - 1 },
        pauseBeforeClear: true
    });

    return steps;
}
