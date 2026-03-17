export function popSteps(stack) {
    const steps = [];

    // Initial state
    steps.push({
        stack: [...stack],
        message: `Current stack: [${stack.join(', ')}]`,
        action: 'start',
        codeLine: 1,
        variables: { length: stack.length }
    });

    // Check if stack is empty
    if (stack.length === 0) {
        steps.push({
            stack: [],
            message: 'Cannot pop from empty stack!',
            action: 'error',
            codeLine: 3,
            variables: { length: 0 },
            pauseBeforeClear: true
        });
        return steps;
    }

    // Highlight the value to be popped
    steps.push({
        stack: [...stack],
        highlightIndex: stack.length - 1,
        message: `Preparing to pop ${stack[stack.length - 1]} from the stack`,
        action: 'prepare',
        codeLine: 5,
        variables: { length: stack.length, topValue: stack[stack.length - 1] }
    });

    // Pop the value
    const poppedValue = stack[stack.length - 1];
    const newStack = stack.slice(0, -1);

    steps.push({
        stack: newStack,
        poppedValue: poppedValue,
        message: `Popped ${poppedValue} from the stack`,
        action: 'pop',
        codeLine: 6,
        variables: { length: newStack.length, topValue: poppedValue }
    });

    // Complete
    steps.push({
        stack: newStack,
        message: newStack.length > 0
            ? `Stack after pop: [${newStack.join(', ')}]`
            : 'Stack is now empty',
        action: 'complete',
        codeLine: 7,
        variables: { length: newStack.length, topValue: poppedValue },
        pauseBeforeClear: true
    });

    return steps;
}
