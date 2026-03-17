export function pushSteps(stack, value) {
    const steps = [];

    // Initial state
    steps.push({
        stack: [...stack],
        message: `Current stack: [${stack.join(', ')}]`,
        action: 'start',
        codeLine: 1,
        variables: { value }
    });

    // Highlight the value to be pushed
    steps.push({
        stack: [...stack],
        newValue: value,
        message: `Preparing to push ${value} onto the stack`,
        action: 'prepare',
        codeLine: 1,
        variables: { value }
    });

    // Push the value
    const newStack = [...stack, value];
    steps.push({
        stack: newStack,
        highlightIndex: newStack.length - 1,
        message: `Pushed ${value} onto the stack`,
        action: 'push',
        codeLine: 3,
        variables: { value, length: newStack.length }
    });

    // Complete
    steps.push({
        stack: newStack,
        message: `Stack after push: [${newStack.join(', ')}]`,
        action: 'complete',
        codeLine: 4,
        variables: { value, length: newStack.length },
        pauseBeforeClear: true
    });

    return steps;
}
