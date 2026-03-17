export function heapSortSteps(arr) {
    const steps = [];
    const array = [...arr];
    const n = array.length;

    function heapify(size, i) {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;

        steps.push({
            array: [...array],
            activeIndices: [i],
            compare: [left, right].filter(idx => idx < size),
            message: `Heapifying index ${i}`,
            codeLine: 18
        });

        if (left < size && array[left] > array[largest]) {
            largest = left;
        }

        if (right < size && array[right] > array[largest]) {
            largest = right;
        }

        if (largest !== i) {
            [array[i], array[largest]] = [array[largest], array[i]];
            steps.push({
                array: [...array],
                activeIndices: [i, largest],
                swap: [i, largest],
                message: `Swap ${array[i]} and ${array[largest]}`,
                codeLine: 26
            });
            heapify(size, largest);
        }
    }

    // Build max heap
    steps.push({
        array: [...array],
        message: "Building max heap...",
        codeLine: 4
    });
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapify(n, i);
    }

    // Extract elements from heap
    for (let i = n - 1; i > 0; i--) {
        [array[0], array[i]] = [array[i], array[0]];
        steps.push({
            array: [...array],
            activeIndices: [0, i],
            swap: [0, i],
            message: `Move max element ${array[i]} to the end (index ${i})`,
            codeLine: 10
        });
        heapify(i, 0);
    }

    steps.push({
        array: [...array],
        activeIndices: [],
        sorted: array.map((_, idx) => idx),
        message: "Array sorted using Heap Sort!",
        codeLine: 14,
        action: 'complete'
    });

    return steps;
}
