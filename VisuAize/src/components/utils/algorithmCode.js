export const ALGORITHM_CODES = {
  array: {
    bubble: `function bubbleSort(arr) {
  let n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // Compare adjacent elements
      if (arr[j] > arr[j + 1]) {
        // Swap if they are in wrong order
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}`,
    insertion: `function insertionSort(arr) {
  let n = arr.length;
  for (let i = 1; i < n; i++) {
    let j = i;
    
    // Move element to correct position
    while (j > 0 && arr[j - 1] > arr[j]) {
      // Swap elements
      let temp = arr[j];
      arr[j] = arr[j - 1];
      arr[j - 1] = temp;
      j--;
    }
  }
  return arr;
}`,
    selection: `function selectionSort(arr) {
  let n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    // Find minimum element
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    
    // Swap minimum with current
    if (minIdx !== i) {
      let temp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = temp;
    }
  }
  return arr;
}`,
    merge: `function mergeSort(arr, left, right) {
  if (left < right) {
    let mid = Math.floor((left + right) / 2);
    // Divide array
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
    
    // Merge sorted halves
    merge(arr, left, mid, right);
  }
}

function merge(arr, left, mid, right) {
  let leftArr = arr.slice(left, mid + 1);
  let rightArr = arr.slice(mid + 1, right + 1);
  let i = 0, j = 0, k = left;
  
  while (i < leftArr.length && j < rightArr.length) {
    if (leftArr[i] <= rightArr[j]) {
      arr[k++] = leftArr[i++];
    } else {
      arr[k++] = rightArr[j++];
    }
  }
  
  while (i < leftArr.length) arr[k++] = leftArr[i++];
  while (j < rightArr.length) arr[k++] = rightArr[j++];
}`,
    linearSearch: `function linearSearch(arr, target) {
  // Iterate through each element
  for (let i = 0; i < arr.length; i++) {
    // Check if current element matches target
    if (arr[i] === target) {
      return i; // Found at index i
    }
    // Not found at this index, continue
  }
  
  return -1; // Target not found
}`,
    binarySearch: `function binarySearch(arr, target) {
  // Array must be sorted
  arr.sort((a, b) => a - b);
  
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) {
      return mid; // Found!
    } else if (arr[mid] < target) {
      left = mid + 1; // Search right half
    } else {
      right = mid - 1; // Search left half
    }
  }
  return -1; // Not found
}`,
    quickSort: `function quickSort(arr, left, right) {
  if (left < right) {
    // Partition the array
    let pivotIndex = partition(arr, left, right);
    
    // Recursively sort elements
    quickSort(arr, left, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, right);
  }
}

function partition(arr, left, right) {
  let pivot = arr[right];
  let i = left - 1;
  
  for (let j = left; j < right; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
  return i + 1;
}`,
    heapSort: `function heapSort(arr) {
  let n = arr.length;

  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, n, i);
  }

  // Extract elements from heap
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    heapify(arr, i, 0);
  }
}

function heapify(arr, n, i) {
  let largest = i;
  let left = 2 * i + 1;
  let right = 2 * i + 2;

  if (left < n && arr[left] > arr[largest]) largest = left;
  if (right < n && arr[right] > arr[largest]) largest = right;

  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, n, largest);
  }
}`
  },
  linkedlist: {
    insert: `function insert(head, value, position) {
  let newNode = new Node(value);
  
  // Insert at head
  if (position === 0) {
    newNode.next = head;
    return newNode;
  }

  // Traverse to position
  let current = head;
  let index = 0;
  while (current && index < position - 1) {
    current = current.next;
    index++;
  }

  // Insert node
  if (current) {
    newNode.next = current.next;
    current.next = newNode;
  }
  return head;
}`,
    delete: `function deleteNode(head, value) {
  // Delete head
  if (head && head.value === value) {
    return head.next;
  }

  let current = head;
  let prev = null;

  // Search for node
  while (current && current.value !== value) {
    prev = current;
    current = current.next;
  }

  // Delete node if found
  if (current) {
    prev.next = current.next;
  }
  return head;
}`,
    search: `function search(head, value) {
  let current = head;
  let position = 0;
  
  // Traverse the list
  while (current) {
    if (current.value === value) {
      return position; // Found
    }
    current = current.next;
    position++;
  }
  
  return -1; // Not found
}`
  },
  stack: {
    push: `function push(stack, value) {
  // Add value to the top of stack
  stack.push(value);
  return stack;
}`,
    pop: `function pop(stack) {
  if (stack.length === 0) {
    return null; // Underflow
  }
  // Remove value from the top
  return stack.pop();
}`
  },
  queue: {
    enqueue: `function enqueue(queue, value) {
  // Add value to the rear
  queue.push(value);
  return queue;
}`,
    dequeue: `function dequeue(queue) {
  if (queue.length === 0) {
    return null; // Underflow
  }
  // Remove value from the front
  return queue.shift();
}`
  },
  tree: {
    bstInsert: `function insert(root, value) {
  if (!root) return new Node(value);
  let current = root;
  while (true) {
    if (value < current.value) {
      if (!current.left) {
        current.left = new Node(value);
        return root;
      }
      current = current.left;
    } else {
      if (!current.right) {
        current.right = new Node(value);
        return root;
      }
      current = current.right;
    }
  }
}`,
    bstDelete: `function deleteNode(root, value) {
  if (!root) return null;

  if (value < root.value) {
    root.left = deleteNode(root.left, value);
  } else if (value > root.value) {
    root.right = deleteNode(root.right, value);
  } else {
    // Node found
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    
    // Node with two children
    let minNode = findMin(root.right);
    root.value = minNode.value;
    root.right = deleteNode(root.right, minNode.value);
  }
  return root;
}`,
    bstSearch: `function search(root, value) {
  let current = root;
  
  while (current) {
    // Check current node
    if (value === current.value) {
      return current; // Found!
    }
    
    // Go left or right
    if (value < current.value) {
      current = current.left;
    } else {
      current = current.right;
    }
  }
  return null; // Not found
}`,
    inorder: `function inorder(node) {
  if (!node) return;
  
  // 1. Traverse left subtree
  inorder(node.left);
  
  // 2. Visit current node
  visit(node);
  
  // 3. Traverse right subtree
  inorder(node.right);
}`,
    preorder: `function preorder(node) {
  if (!node) return;
  
  // 1. Visit current node
  visit(node);
  
  // 2. Traverse left subtree
  preorder(node.left);
  
  // 3. Traverse right subtree
  preorder(node.right);
}`,
    postorder: `function postorder(node) {
  if (!node) return;
  
  // 1. Traverse left subtree
  postorder(node.left);
  
  // 2. Traverse right subtree
  postorder(node.right);
  
  // 3. Visit current node
  visit(node);
}`
  },
  heap: {
    insert: `function insert(heap, value) {
  heap.push(value);
  let i = heap.length - 1;
  
  // Bubble up
  while (i > 0) {
    let parent = Math.floor((i - 1) / 2);
    if (heap[parent] >= heap[i]) break;
    
    [heap[parent], heap[i]] = [heap[i], heap[parent]];
    i = parent;
  }
}`,
    extractMax: `function extractMax(heap) {
  if (heap.length === 0) return null;
  let max = heap[0];
  heap[0] = heap.pop();
  
  // Bubble down
  let i = 0;
  while (true) {
    let left = 2 * i + 1;
    let right = 2 * i + 2;
    let largest = i;
    
    if (left < heap.length && heap[left] > heap[largest]) largest = left;
    if (right < heap.length && heap[right] > heap[largest]) largest = right;
    
    if (largest === i) break;
    [heap[i], heap[largest]] = [heap[largest], heap[i]];
    i = largest;
  }
  return max;
}`
  }
};
