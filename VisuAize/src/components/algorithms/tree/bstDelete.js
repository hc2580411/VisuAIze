export const bstDeleteSteps = (root, value) => {
  const steps = [];

  const cloneTree = (node) => {
    if (!node) return null;
    return {
      ...node,
      children: node.children.map(cloneTree),
    };
  };

  let rootNode = root ? cloneTree(root) : null;

  if (!rootNode) {
    steps.push({
      root: null,
      message: "Tree is empty, nothing to delete.",
      codeLine: 1,
      pauseBeforeClear: true
    });
    return steps;
  }

  steps.push({
    root: cloneTree(rootNode),
    action: 'start',
    message: `Ready to delete ${value}...`,
    codeLine: 2
  });

  const findMin = (node) => {
    if (!node) return null;
    const leftChild = node.children.find(c => c.name < node.name);
    return leftChild ? findMin(leftChild) : node;
  };

  const deleteNode = (node, key) => {
    if (!node) {
      steps.push({
        root: cloneTree(rootNode),
        message: `Value ${key} not found.`,
        codeLine: 2,
        action: 'complete',
        pauseBeforeClear: true
      });
      return null;
    }

    steps.push({
      root: cloneTree(rootNode),
      highlight: node.id,
      action: 'search',
      message: `Comparing ${key} with ${node.name}...`,
      codeLine: 4
    });

    if (key < node.name) {
      const leftChild = node.children.find(c => c.name < node.name);
      if (leftChild) {
        const idx = node.children.indexOf(leftChild);
        const newChild = deleteNode(leftChild, key);
        if (newChild) {
          node.children[idx] = newChild;
        } else {
          node.children.splice(idx, 1);
        }
      } else {
        // Not found path
        deleteNode(null, key);
      }
    } else if (key > node.name) {
      const rightChild = node.children.find(c => c.name > node.name);
      if (rightChild) {
        const idx = node.children.indexOf(rightChild);
        const newChild = deleteNode(rightChild, key);
        if (newChild) {
          node.children[idx] = newChild;
        } else {
          node.children.splice(idx, 1);
        }
      } else {
        deleteNode(null, key);
      }
    } else {
      // Found node
      if (node.children.length === 0) {
        steps.push({
          root: cloneTree(rootNode),
          highlight: node.id,
          message: `Deleting leaf node ${key}.`,
          codeLine: 10
        });
        return null;
      }

      if (node.children.length === 1) {
        const child = node.children[0];
        steps.push({
          root: cloneTree(rootNode),
          highlight: node.id,
          message: `Deleting node ${key} with 1 child. Replacing with child ${child.name}.`,
          codeLine: 10
        });
        return child;
      }

      // 2 children
      const rightChild = node.children.find(c => c.name > node.name);
      const successor = findMin(rightChild);

      steps.push({
        root: cloneTree(rootNode),
        highlight: successor.id,
        message: `Node ${key} has 2 children. Found successor ${successor.name}.`,
        codeLine: 14
      });

      const successorValue = successor.name;
      node.name = successorValue; // Copy value

      steps.push({
        root: cloneTree(rootNode),
        highlight: node.id,
        message: `Replaced value with ${successorValue}. Now deleting successor from right subtree.`,
        codeLine: 15
      });

      const idx = node.children.indexOf(rightChild);
      const newRight = deleteNode(rightChild, successorValue);
      if (newRight) {
        node.children[idx] = newRight;
      } else {
        node.children.splice(idx, 1);
      }
    }
    return node;
  };

  rootNode = deleteNode(rootNode, value);

  steps.push({
    root: cloneTree(rootNode),
    message: `Deletion complete!`,
    codeLine: 18,
    action: 'complete',
    pauseBeforeClear: true
  });

  return steps;
};