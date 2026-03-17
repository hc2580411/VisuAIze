/**
 * Creates a debounced function that delays invoking func until after delay ms
 * have elapsed since the last time the debounced function was invoked.
 * @param {Function} fn - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} The debounced function
 */
export const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

/**
 * Creates a linked list from an array of values
 * @param {Array} arr - The array of values
 * @returns {Object|null} The head of the linked list
 */
export const createList = (arr) => {
    if (!arr || arr.length === 0) return null;
    let head = { value: arr[0], next: null };
    let current = head;
    for (let i = 1; i < arr.length; i++) {
        current.next = { value: arr[i], next: null };
        current = current.next;
    }
    return head;
};

/**
 * Creates a simple binary search tree from an array of values
 * @param {Array} arr - The array of values
 * @returns {Object|null} The root of the tree
 */
let _nodeIdCounter = 0;

export const createBinaryTree = (arr) => {
    if (!arr || arr.length === 0) return null;

    const createNode = (val) => ({
        name: val,
        children: [],
        id: `tree-node-${_nodeIdCounter++}`
    });

    const root = createNode(arr[0]);

    const insert = (node, val) => {
        if (val < node.name) {
            if (node.children.find(c => c.name < node.name)) {
                insert(node.children.find(c => c.name < node.name), val);
            } else {
                const newNode = createNode(val);
                node.children.push(newNode);
                node.children.sort((a, b) => a.name - b.name);
            }
        } else {
            if (node.children.find(c => c.name > node.name)) {
                insert(node.children.find(c => c.name > node.name), val);
            } else {
                const newNode = createNode(val);
                node.children.push(newNode);
                node.children.sort((a, b) => a.name - b.name);
            }
        }
    };

    for (let i = 1; i < arr.length; i++) {
        insert(root, arr[i]);
    }

    return root;
};
