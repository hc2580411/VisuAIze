export function enqueueSteps(queue, value) {
    const steps = [];

    // Initial state
    steps.push({
        queue: [...queue],
        message: `Current queue: [${queue.join(', ')}]`,
        action: 'start',
        codeLine: 1,
        variables: { value, length: queue.length }
    });

    // Prepare to enqueue
    steps.push({
        queue: [...queue],
        newValue: value,
        message: `Preparing to enqueue ${value} to the rear`,
        action: 'prepare',
        codeLine: 2,
        variables: { value, length: queue.length }
    });

    // Enqueue the value
    const newQueue = [...queue, value];
    steps.push({
        queue: newQueue,
        highlightIndex: newQueue.length - 1,
        message: `Enqueued ${value} to the rear`,
        action: 'enqueue',
        codeLine: 3,
        variables: { value, length: newQueue.length }
    });

    // Complete
    steps.push({
        queue: newQueue,
        message: `Queue after enqueue: [${newQueue.join(', ')}]`,
        action: 'complete',
        codeLine: 4,
        variables: { value, length: newQueue.length },
        pauseBeforeClear: true
    });

    return steps;
}
