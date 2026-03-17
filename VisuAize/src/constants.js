// Default data for each data structure
export const DEFAULT_VALUES = {
    array: [50, 30, 20, 40, 10],
    linkedlist: [10, 20, 30, 40],
    tree: null, // Tree starts empty
    stack: [10, 20, 30, 40, 50],
    queue: [10, 20, 30, 40, 50],
    heap: [50, 40, 30, 20, 10], // Max-heap
};

// Speed presets for beginner mode
export const SPEED_PRESETS = {
    SLOW: 2000,
    MEDIUM: 1000,
    FAST: 500,
};

// Complexity data for all algorithms
export const COMPLEXITY_DATA = {
    array: {
        bubble: { time: "O(n²)", space: "O(1)" },
        insertion: { time: "O(n²)", space: "O(1)" },
        selection: { time: "O(n²)", space: "O(1)" },
        merge: { time: "O(n log n)", space: "O(n)" },
        linearSearch: { time: "O(n)", space: "O(1)" },
        binarySearch: { time: "O(log n)", space: "O(1)" },
        quickSort: { time: "O(n log n)", space: "O(log n)" },
        heapSort: { time: "O(n log n)", space: "O(1)" }
    },
    linkedlist: {
        insert: { time: "O(1) or O(n)", space: "O(1)" },
        delete: { time: "O(1) or O(n)", space: "O(1)" },
        search: { time: "O(n)", space: "O(1)" }
    },
    tree: {
        bstInsert: { time: "O(log n)", space: "O(log n)" },
        bstDelete: { time: "O(log n)", space: "O(log n)" },
        bstSearch: { time: "O(log n)", space: "O(1)" },
        inorder: { time: "O(n)", space: "O(h)" },
        preorder: { time: "O(n)", space: "O(h)" },
        postorder: { time: "O(n)", space: "O(h)" }
    },
    stack: {
        push: { time: "O(1)", space: "O(1)" },
        pop: { time: "O(1)", space: "O(1)" }
    },
    queue: {
        enqueue: { time: "O(1)", space: "O(1)" },
        dequeue: { time: "O(1)", space: "O(1)" }
    },
    heap: {
        insert: { time: "O(log n)", space: "O(1)" },
        extractMax: { time: "O(log n)", space: "O(1)" }
    }
};

// Default algorithm for each data structure
export const DEFAULT_ALGORITHMS = {
    array: "bubble",
    linkedlist: "insert",
    tree: "bstInsert",
    stack: "push",
    queue: "enqueue",
    heap: "insert",
};


// Input placeholders for each operation
export const INPUT_PLACEHOLDERS = {
    array: {
        bubble: "e.g. 50,30,20,40,10",
        insertion: "e.g. 50,30,20,40,10",
        selection: "e.g. 50,30,20,40,10",
        merge: "e.g. 50,30,20,40,10",
        linearSearch: "Data: 50,30,20,40,10 | Target: 30",
        binarySearch: "Data: 10,20,30,40,50 | Target: 30",
        quickSort: "e.g. 50,30,20,40,10",
        heapSort: "e.g. 50,30,20,40,10",
    },
    linkedlist: {
        insert: "e.g. 5,1 (value, position)",
        delete: "e.g. 3 (value)",
        search: "e.g. 30 (value)",
    },
    tree: {
        bstInsert: "Enter a number (0-100)",
        bstDelete: "Enter a number (0-100)",
        bstSearch: "Enter a number (0-100)",
        inorder: "No input needed",
        preorder: "No input needed",
        postorder: "No input needed",
    },
    stack: {
        push: "e.g. 60",
        pop: "No input needed",
    },
    queue: {
        enqueue: "e.g. 60",
        dequeue: "No input needed",
    },
    heap: {
        insert: "e.g. 60",
        extractMax: "No input needed",
    },
};

// Input descriptions for each operation
export const INPUT_DESCRIPTIONS = {
    array: {
        bubble: "Enter comma-separated numbers (e.g., 50,30,20,40,10)",
        insertion: "Enter comma-separated numbers (e.g., 50,30,20,40,10)",
        selection: "Enter comma-separated numbers (e.g., 50,30,20,40,10)",
        merge: "Enter comma-separated numbers (e.g., 50,30,20,40,10)",
        linearSearch: "Enter array data AND search target separately",
        binarySearch: "Enter array data AND search target (array will be sorted)",
        quickSort: "Enter comma-separated numbers (e.g., 50,30,20,40,10)",
        heapSort: "Enter comma-separated numbers (e.g., 50,30,20,40,10)",
    },
    linkedlist: {
        insert: "Format: value,position (e.g., 5,1)",
        delete: "Enter value to delete",
        search: "Enter value to search for in the linked list",
    },
    tree: {
        bstInsert: "Enter a number (0-100) to insert",
        bstDelete: "Enter a number (0-100) to delete",
        bstSearch: "Enter a number (0-100) to search for",
        inorder: "Visit nodes in order (Left, Root, Right)",
        preorder: "Visit nodes in preorder (Root, Left, Right)",
        postorder: "Visit nodes in postorder (Left, Right, Root)",
    },
    stack: {
        push: "Enter a number to push onto the stack",
        pop: "No input needed (pops from top)",
    },
    queue: {
        enqueue: "Enter a number to enqueue to the rear",
        dequeue: "No input needed (removes from front)",
    },
    heap: {
        insert: "Enter a number to insert into the max-heap",
        extractMax: "No input needed (extracts maximum element)",
    },
};

// Error messages
export const ERROR_MESSAGES = {
    INVALID_FORMAT: "Invalid input format",
    TOO_MANY_ELEMENTS: "Maximum 15 elements allowed",
    EMPTY_INPUT: "Please enter a value",
    TREE_VALUE_RANGE: "Please enter a value between 0 and 100",
    EMPTY_STRUCTURE: "Data structure is empty",
};

// Modes
export const MODES = {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
};

// Algorithm options dropdown data
export const ALGORITHM_OPTIONS = {
    array: ["bubble", "insertion", "selection", "merge", "quickSort", "heapSort", "linearSearch", "binarySearch"],
    linkedlist: ["insert", "delete", "search"],
    tree: ["bstInsert", "bstDelete", "bstSearch", "inorder", "preorder", "postorder"],
    stack: ["push", "pop"],
    queue: ["enqueue", "dequeue"],
    heap: ["insert", "extractMax"],
};

// Algorithms whose code snippets don't support numeric editing.
// These are simple operations (e.g. push/pop) with no meaningful tuneable values.
export const NON_EDITABLE_ALGORITHMS = {
    stack: ["push", "pop"],
    queue: ["enqueue", "dequeue"],
    linkedlist: ["insert", "delete", "search"],
    tree: ["inorder", "preorder", "postorder"],
};

// Background Theme Options
export const BACKGROUND_THEMES = [
    {
        id: 'default',
        name: 'Soft Pastel',
        light: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)',
        dark: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
    },
    {
        id: 'midnight',
        name: 'Midnight Aurora',
        light: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        dark: 'linear-gradient(135deg, #1a1c2c 0%, #4a192c 100%)'
    },
    {
        id: 'ocean',
        name: 'Deep Sea',
        light: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
        dark: 'linear-gradient(135deg, #09203f 0%, #537895 100%)'
    },
    {
        id: 'sunset',
        name: 'Crimson Sunset',
        light: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        dark: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    },
    {
        id: 'forest',
        name: 'Mystic Forest',
        light: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
        dark: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)'
    },
    {
        id: 'slate',
        name: 'Modern Slate',
        light: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        dark: 'linear-gradient(135deg, #232526 0%, #414345 100%)'
    }
];
