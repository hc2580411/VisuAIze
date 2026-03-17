export function heapInsertSteps(heap, value) {
    const steps = [];

    // Initial state
    steps.push({
        heap: [...heap],
        message: `Current heap: [${heap.join(', ')}]`,
        action: 'start',
        codeLine: 1,
        variables: { i: heap.length, parent: null }
    });

    // Add value at the end
    const newHeap = [...heap, value];
    steps.push({
        heap: [...newHeap],
        highlightIndex: newHeap.length - 1,
        message: `Added ${value} at the end`,
        action: 'add',
        codeLine: 2,
        variables: { i: newHeap.length - 1, parent: null }
    });

    // Heapify up
    let currentIndex = newHeap.length - 1;

    while (currentIndex > 0) {
        const parentIndex = Math.floor((currentIndex - 1) / 2);

        steps.push({
            heap: [...newHeap],
            compareIndices: [currentIndex, parentIndex],
            message: `Comparing ${newHeap[currentIndex]} with parent ${newHeap[parentIndex]}`,
            action: 'compare',
            codeLine: 8,
            variables: { i: currentIndex, parent: parentIndex }
        });

        if (newHeap[currentIndex] > newHeap[parentIndex]) {
            // Swap
            [newHeap[currentIndex], newHeap[parentIndex]] = [newHeap[parentIndex], newHeap[currentIndex]];

            steps.push({
                heap: [...newHeap],
                swapIndices: [currentIndex, parentIndex],
                message: `Swapped ${newHeap[parentIndex]} with ${newHeap[currentIndex]}`,
                action: 'swap',
                codeLine: 11,
                variables: { i: currentIndex, parent: parentIndex }
            });

            currentIndex = parentIndex;
        } else {
            break;
        }
    }

    // Complete
    steps.push({
        heap: [...newHeap],
        highlightIndex: currentIndex,
        message: `Inserted ${value}. Heap property maintained!`,
        action: 'complete',
        codeLine: 13,
        variables: { i: currentIndex, parent: currentIndex > 0 ? Math.floor((currentIndex - 1) / 2) : 0 },
        pauseBeforeClear: true
    });

    return steps;
}
