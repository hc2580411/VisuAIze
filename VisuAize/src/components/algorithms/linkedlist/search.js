export function searchSteps(head, value) {
    const steps = [];

    // Helper to convert list to array for display
    const listToArray = (head) => {
        const arr = [];
        let current = head;
        while (current) {
            arr.push(current.value);
            current = current.next;
        }
        return arr;
    };

    const nodes = listToArray(head);

    // Initial state
    steps.push({
        nodes: [...nodes],
        message: `Searching for value ${value}`,
        action: 'start',
        codeLine: 1
    });

    let current = head;
    let position = 0;

    steps.push({
        nodes: [...nodes],
        message: `Starting from head`,
        action: 'traverse',
        highlightIndex: 0,
        codeLine: 2
    });

    // Search for the value
    while (current) {
        steps.push({
            nodes: [...nodes],
            message: `Checking node at position ${position}: ${current.value}`,
            action: 'compare',
            highlightIndex: position,
            codeLine: 6,
            variables: { position, currentValue: current.value }
        });

        if (current.value === value) {
            steps.push({
                nodes: [...nodes],
                message: `Found ${value} at position ${position}!`,
                action: 'found',
                highlightIndex: position,
                codeLine: 7
            });

            steps.push({
                nodes: [...nodes],
                message: `Search complete: Found at position ${position}`,
                action: 'complete',
                codeLine: 8,
                pauseBeforeClear: true
            });

            return steps;
        }

        current = current.next;
        position++;

        if (current) {
            steps.push({
                nodes: [...nodes],
                message: `Moving to next node`,
                action: 'traverse',
                highlightIndex: position,
                codeLine: 10
            });
        }
    }

    // Value not found
    steps.push({
        nodes: [...nodes],
        message: `Value ${value} not found in the list`,
        action: 'notFound',
        codeLine: 14
    });

    steps.push({
        nodes: [...nodes],
        message: `Search complete: Not found`,
        action: 'complete',
        codeLine: 14,
        pauseBeforeClear: true
    });

    return steps;
}
