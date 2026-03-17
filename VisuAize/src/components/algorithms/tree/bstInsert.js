export function bstInsertSteps(root, value) {
  const steps = [];

  const createNode = (val) => ({
    name: val,
    children: [],
    id: Math.random().toString(36).substr(2, 9),
  });

  const cloneTree = (node) => {
    if (!node) return null;
    return {
      ...node,
      children: node.children.map(cloneTree),
    };
  };

  let rootNode = root ? cloneTree(root) : null;

  // Initial state
  steps.push({
    root: cloneTree(rootNode),
    message: `Ready to insert ${value}...`,
    codeLine: 1
  });

  if (!rootNode) {
    rootNode = createNode(value);
    steps.push({
      root: cloneTree(rootNode),
      highlight: rootNode.id,
      message: `Inserted ${value} as root`,
      codeLine: 2,
      action: 'complete',
      pauseBeforeClear: true
    });
    return steps;
  }

  let current = rootNode;

  // Traverse to find insertion point
  while (true) {
    steps.push({
      root: cloneTree(rootNode),
      highlight: current.id,
      message: `Comparing ${value} with ${current.name} (${value < current.name ? "Go Left" : "Go Right"})`,
      codeLine: 5
    });

    if (value < current.name) {
      if (current.children && current.children.find(c => c.name < current.name)) {
        current = current.children.find(c => c.name < current.name);
      } else {
        const newNode = createNode(value);
        current.children.push(newNode);
        current.children.sort((a, b) => a.name - b.name);

        steps.push({
          root: cloneTree(rootNode),
          highlight: newNode.id,
          message: `Inserted ${value} to the left of ${current.name}`,
          codeLine: 7
        });
        break;
      }
    } else if (value > current.name) {
      if (current.children && current.children.find(c => c.name > current.name)) {
        current = current.children.find(c => c.name > current.name);
      } else {
        const newNode = createNode(value);
        current.children.push(newNode);
        current.children.sort((a, b) => a.name - b.name);

        steps.push({
          root: cloneTree(rootNode),
          highlight: newNode.id,
          message: `Inserted ${value} to the right of ${current.name}`,
          codeLine: 13
        });
        break;
      }
    } else {
      steps.push({
        root: cloneTree(rootNode),
        highlight: current.id,
        message: `${value} already exists, skipping.`,
        codeLine: 5
      });

      // Add completion step for duplicate value
      steps.push({
        root: cloneTree(rootNode),
        message: "Value already exists, please try another value",
        codeLine: 18,
        action: 'complete',
        pauseBeforeClear: true
      });
      return steps;
    }
  }

  steps.push({
    root: cloneTree(rootNode),
    message: "BST insertion complete!",
    codeLine: 18,
    action: 'complete',
    pauseBeforeClear: true
  });

  return steps;
}
