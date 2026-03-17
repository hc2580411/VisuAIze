export function dequeueSteps(queue) {
    const steps = [];

    // Initial state
    steps.push({
        queue: [...queue],
        message: `Current queue: [${queue.join(', ')}]`,
        action: 'start',
        codeLine: 1,
        variables: { length: queue.length }
    });

    if (queue.length === 0) {
        steps.push({
            queue: [],
            message: "Queue is empty (Underflow)",
            action: 'error',
            codeLine: 3,
            variables: { length: 0 },
            pauseBeforeClear: true
        });
        return steps;
    }

    // Highlight front element
    steps.push({
        queue: [...queue],
        highlightIndex: 0,
        message: `Element at front is ${queue[0]}`,
        action: 'prepare',
        codeLine: 5,
        variables: { length: queue.length, frontValue: queue[0] }
    });

    // Dequeue
    const newQueue = queue.slice(1);
    const removedValue = queue[0];

    steps.push({
        queue: newQueue,
        removedValue: removedValue,
        message: `Dequeued ${removedValue} from the front`,
        action: 'dequeue',
        codeLine: 6,
        variables: { length: newQueue.length, frontValue: removedValue }
    });

    // Complete
    steps.push({
        queue: newQueue,
        message: `Queue after dequeue: [${newQueue.join(', ')}]`,
        action: 'complete',
        codeLine: 7,
        variables: { length: newQueue.length, frontValue: removedValue },
        pauseBeforeClear: true
    });

    return steps;
}
