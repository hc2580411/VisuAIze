/**
 * Binary Search Tree Search Algorithm - O(log n) average time complexity
 * Searches for a value in a BST by comparing and traversing left/right
 * 
 * @param {Object} root - BST root node
 * @param {number} value - Value to search for
 * @returns {Array<Object>} Animation steps
 */
export function bstSearchSteps(root, value) {
    const steps = [];

    const cloneTree = (node) => {
        if (!node) return null;
        return {
            ...node,
            children: node.children.map(cloneTree),
        };
    };

    // Initial state
    steps.push({
        root: cloneTree(root),
        message: `Searching for ${value} in BST...`,
        codeLine: 1,
        variables: { target: value, current: root?.name || null }
    });

    if (!root) {
        steps.push({
            root: null,
            message: `Tree is empty. Value ${value} not found.`,
            action: 'complete',
            codeLine: 2,
            pauseBeforeClear: true
        });
        return steps;
    }

    let current = root;

    while (current) {
        steps.push({
            root: cloneTree(root),
            highlight: current.id,
            message: `Checking node ${current.name}...`,
            codeLine: 4,
            variables: { target: value, current: current.name }
        });

        if (value === current.name) {
            // Found the value
            steps.push({
                root: cloneTree(root),
                highlight: current.id,
                message: `Found ${value}!`,
                codeLine: 7,
                variables: { target: value, found: true }
            });

            steps.push({
                root: cloneTree(root),
                highlight: current.id,
                message: `Search complete: ${value} found in tree!`,
                action: 'complete',
                codeLine: 8,
                pauseBeforeClear: true
            });
            return steps;
        }

        if (value < current.name) {
            // Go left
            steps.push({
                root: cloneTree(root),
                highlight: current.id,
                message: `${value} < ${current.name}, go left`,
                codeLine: 11,
                variables: { target: value, current: current.name, direction: 'left' }
            });

            // Find left child
            const leftChild = current.children?.find(c => c.name < current.name);
            if (!leftChild) {
                steps.push({
                    root: cloneTree(root),
                    message: `No left child. Value ${value} not found.`,
                    action: 'complete',
                    codeLine: 17,
                    pauseBeforeClear: true
                });
                return steps;
            }
            current = leftChild;
        } else {
            // Go right
            steps.push({
                root: cloneTree(root),
                highlight: current.id,
                message: `${value} > ${current.name}, go right`,
                codeLine: 14,
                variables: { target: value, current: current.name, direction: 'right' }
            });

            // Find right child
            const rightChild = current.children?.find(c => c.name > current.name);
            if (!rightChild) {
                steps.push({
                    root: cloneTree(root),
                    message: `No right child. Value ${value} not found.`,
                    action: 'complete',
                    codeLine: 17,
                    pauseBeforeClear: true
                });
                return steps;
            }
            current = rightChild;
        }
    }

    steps.push({
        root: cloneTree(root),
        message: `Search complete: ${value} not found in tree.`,
        action: 'complete',
        codeLine: 17,
        pauseBeforeClear: true
    });

    return steps;
}
