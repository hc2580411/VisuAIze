export function heapExtractMaxSteps(heap) {
    const steps = [];

    // Initial state
    steps.push({
        heap: [...heap],
        message: `Current heap: [${heap.join(', ')}]`,
        action: 'start',
        codeLine: 1,
        variables: { max: null, i: null }
    });

    // Check if heap is empty
    if (heap.length === 0) {
        steps.push({
            heap: [],
            message: 'Cannot extract from empty heap!',
            action: 'error',
            codeLine: 2,
            variables: { max: null, i: null },
            pauseBeforeClear: true
        });
        return steps;
    }

    // Highlight max element (root)
    const maxValue = heap[0];
    steps.push({
        heap: [...heap],
        highlightIndex: 0,
        message: `Maximum value is ${maxValue} at root`,
        action: 'identify',
        codeLine: 3,
        variables: { max: maxValue, i: 0 }
    });

    // If only one element, just remove it
    if (heap.length === 1) {
        steps.push({
            heap: [],
            extractedValue: maxValue,
            message: `Extracted ${maxValue}. Heap is now empty.`,
            action: 'complete',
            codeLine: 20,
            variables: { max: maxValue, i: 0 },
            pauseBeforeClear: true
        });
        return steps;
    }

    // Replace root with last element
    const newHeap = [...heap];
    newHeap[0] = newHeap[newHeap.length - 1];
    newHeap.pop();

    steps.push({
        heap: [...newHeap],
        highlightIndex: 0,
        extractedValue: maxValue,
        message: `Extracted ${maxValue}, moved last element to root`,
        action: 'extract',
        codeLine: 4,
        variables: { max: maxValue, i: 0 }
    });

    // Heapify down
    let currentIndex = 0;

    while (true) {
        const leftChild = 2 * currentIndex + 1;
        const rightChild = 2 * currentIndex + 2;
        let largest = currentIndex;

        // Check if left child exists and is larger
        if (leftChild < newHeap.length && newHeap[leftChild] > newHeap[largest]) {
            largest = leftChild;
        }

        // Check if right child exists and is larger
        if (rightChild < newHeap.length && newHeap[rightChild] > newHeap[largest]) {
            largest = rightChild;
        }

        // If current is largest, heap property is satisfied
        if (largest === currentIndex) {
            break;
        }

        // Show comparison
        steps.push({
            heap: [...newHeap],
            compareIndices: [currentIndex, largest],
            message: `Comparing ${newHeap[currentIndex]} with child ${newHeap[largest]}`,
            action: 'compare',
            codeLine: 13,
            variables: { i: currentIndex, largest, left: leftChild, right: rightChild }
        });

        // Swap with larger child
        [newHeap[currentIndex], newHeap[largest]] = [newHeap[largest], newHeap[currentIndex]];

        steps.push({
            heap: [...newHeap],
            swapIndices: [currentIndex, largest],
            message: `Swapped ${newHeap[largest]} with ${newHeap[currentIndex]}`,
            action: 'swap',
            codeLine: 17,
            variables: { i: currentIndex, largest, left: leftChild, right: rightChild }
        });

        currentIndex = largest;
    }

    // Complete
    steps.push({
        heap: [...newHeap],
        message: newHeap.length > 0
            ? `Extracted ${maxValue}. Heap property restored!`
            : `Extracted ${maxValue}. Heap is now empty.`,
        action: 'complete',
        codeLine: 20,
        variables: { max: maxValue, i: currentIndex },
        pauseBeforeClear: true
    });

    return steps;
}
