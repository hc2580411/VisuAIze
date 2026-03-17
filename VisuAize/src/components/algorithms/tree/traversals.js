export function inorderSteps(root) {
    const steps = [];
    const visited = [];

    function traverse(node) {
        if (!node) return;

        const leftChild = node.children?.find(c => c.name < node.name);
        const rightChild = node.children?.find(c => c.name > node.name);

        steps.push({
            root,
            highlight: node.id,
            visited: [...visited],
            message: `Going to left subtree of ${node.value || node.name}`,
            codeLine: 4
        });
        traverse(leftChild);

        visited.push(node.name);
        steps.push({
            root,
            highlight: node.id,
            visited: [...visited],
            message: `Visiting node ${node.value || node.name}`,
            codeLine: 7
        });

        steps.push({
            root,
            highlight: node.id,
            visited: [...visited],
            message: `Going to right subtree of ${node.value || node.name}`,
            codeLine: 10
        });
        traverse(rightChild);
    }

    traverse(root);
    steps.push({
        root,
        highlight: null,
        visited: [...visited],
        message: "Inorder traversal complete!",
        codeLine: 12,
        action: 'complete'
    });
    return steps;
}

export function preorderSteps(root) {
    const steps = [];
    const visited = [];

    function traverse(node) {
        if (!node) return;

        const leftChild = node.children?.find(c => c.name < node.name);
        const rightChild = node.children?.find(c => c.name > node.name);

        visited.push(node.name);
        steps.push({
            root,
            highlight: node.id,
            visited: [...visited],
            message: `Visiting node ${node.value || node.name}`,
            codeLine: 4
        });

        steps.push({
            root,
            highlight: node.id,
            visited: [...visited],
            message: `Going to left subtree of ${node.value || node.name}`,
            codeLine: 7
        });
        traverse(leftChild);

        steps.push({
            root,
            highlight: node.id,
            visited: [...visited],
            message: `Going to right subtree of ${node.value || node.name}`,
            codeLine: 10
        });
        traverse(rightChild);
    }

    traverse(root);
    steps.push({
        root,
        highlight: null,
        visited: [...visited],
        message: "Preorder traversal complete!",
        codeLine: 12,
        action: 'complete'
    });
    return steps;
}

export function postorderSteps(root) {
    const steps = [];
    const visited = [];

    function traverse(node) {
        if (!node) return;

        const leftChild = node.children?.find(c => c.name < node.name);
        const rightChild = node.children?.find(c => c.name > node.name);

        steps.push({
            root,
            highlight: node.id,
            visited: [...visited],
            message: `Going to left subtree of ${node.value || node.name}`,
            codeLine: 4
        });
        traverse(leftChild);

        steps.push({
            root,
            highlight: node.id,
            visited: [...visited],
            message: `Going to right subtree of ${node.value || node.name}`,
            codeLine: 7
        });
        traverse(rightChild);

        visited.push(node.name);
        steps.push({
            root,
            highlight: node.id,
            visited: [...visited],
            message: `Visiting node ${node.value || node.name}`,
            codeLine: 10
        });
    }

    traverse(root);
    steps.push({
        root,
        highlight: null,
        visited: [...visited],
        message: "Postorder traversal complete!",
        codeLine: 12,
        action: 'complete'
    });
    return steps;
}
