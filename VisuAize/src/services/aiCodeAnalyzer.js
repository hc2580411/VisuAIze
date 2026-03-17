/**
 * AI Code Analyzer Service
 * Analyzes user-provided code to determine the data structure type
 * and validates if it can be visualized with existing data types.
 */

// Supported data types for visualization
const SUPPORTED_DATA_TYPES = ['array', 'linkedlist', 'tree', 'stack', 'queue', 'heap'];

// Keywords and patterns that indicate specific data structures
const DATA_TYPE_PATTERNS = {
    array: {
        keywords: ['arr', 'array', 'sort', 'search', 'bubble', 'insertion', 'selection', 'merge', 'binary'],
        patterns: [
            /\[\s*\d+\s*\]/,          // Array indexing
            /\.length/,                // Array length
            /\.slice\(/,               // Array slice
            /\.push\(/,               // Array push
            /\.pop\(/,                // Array pop (could also be stack)
            /for\s*\(\s*let\s+\w+\s*=\s*0/,  // For loop with index
            /arr\[\w+\]/,             // Array access pattern
        ],
        functionPatterns: [
            /sort/i,
            /bubble/i,
            /insertion\s*sort/i,
            /selection\s*sort/i,
            /merge\s*sort/i,
            /search/i,
            /binary\s*search/i,
            /linear\s*search/i,
        ]
    },
    linkedlist: {
        keywords: ['node', 'next', 'head', 'linked', 'list', 'prev', 'previous'],
        patterns: [
            /\.next\s*=/,              // Setting next pointer
            /\.next\s*;/,              // Accessing next
            /current\s*=\s*\w+\.next/, // Traversal pattern
            /node\.next/,              // Node next access
            /head\s*=/,                // Head assignment
            /new\s+Node\(/,            // Node creation
        ],
        functionPatterns: [
            /insert/i,
            /delete/i,
            /search/i,
            /traverse/i,
            /reverse/i,
        ]
    },
    tree: {
        keywords: ['root', 'left', 'right', 'tree', 'bst', 'binary', 'node', 'children'],
        patterns: [
            /\.left\s*=/,              // Setting left child
            /\.right\s*=/,             // Setting right child
            /root\.left/,              // Root left access
            /root\.right/,             // Root right access
            /\.children/,              // Children array (for general trees)
            /current\.left/,           // Current left
            /current\.right/,          // Current right
            /new\s+TreeNode\(/,        // Tree node creation
        ],
        functionPatterns: [
            /insert/i,
            /delete/i,
            /search/i,
            /inorder/i,
            /preorder/i,
            /postorder/i,
            /bfs/i,
            /dfs/i,
        ]
    },
    stack: {
        keywords: ['stack', 'push', 'pop', 'top', 'lifo', 'peek'],
        patterns: [
            /stack\.push\(/,           // Stack push
            /stack\.pop\(/,            // Stack pop
            /stack\[\s*stack\.length\s*-\s*1\s*\]/, // Stack top access
            /\.peek\(/,                // Stack peek
        ],
        functionPatterns: [
            /push/i,
            /pop/i,
            /peek/i,
            /is\s*empty/i,
        ]
    },
    queue: {
        keywords: ['queue', 'enqueue', 'dequeue', 'front', 'rear', 'fifo'],
        patterns: [
            /queue\.push\(/,           // Queue enqueue
            /queue\.shift\(/,          // Queue dequeue
            /\.enqueue\(/,             // Enqueue method
            /\.dequeue\(/,             // Dequeue method
        ],
        functionPatterns: [
            /enqueue/i,
            /dequeue/i,
            /front/i,
            /rear/i,
        ]
    },
    heap: {
        keywords: ['heap', 'heapify', 'extract', 'max', 'min', 'parent', 'bubble'],
        patterns: [
            /Math\.floor\(\s*\(\s*\w+\s*-\s*1\s*\)\s*\/\s*2\s*\)/, // Parent index calculation
            /2\s*\*\s*\w+\s*\+\s*1/,                               // Left child calculation
            /2\s*\*\s*\w+\s*\+\s*2/,                               // Right child calculation
            /heapify/i,                                            // Heapify function
            /bubble\s*up/i,                                        // Bubble up
            /bubble\s*down/i,                                      // Bubble down
            /sift\s*up/i,                                          // Sift up
            /sift\s*down/i,                                        // Sift down
        ],
        functionPatterns: [
            /insert/i,
            /extract/i,
            /heapify/i,
            /max/i,
            /min/i,
        ]
    }
};

/**
 * Calculate the confidence score for a given data type
 * @param {string} code - The user's code
 * @param {string} dataType - The data type to check
 * @returns {number} - Confidence score (0-100)
 */
function calculateConfidence(code, dataType) {
    const config = DATA_TYPE_PATTERNS[dataType];
    if (!config) return 0;

    let score = 0;
    const lowerCode = code.toLowerCase();

    // Check keywords (each keyword match adds 5 points)
    config.keywords.forEach(keyword => {
        if (lowerCode.includes(keyword.toLowerCase())) {
            score += 5;
        }
    });

    // Check patterns (each pattern match adds 15 points)
    config.patterns.forEach(pattern => {
        if (pattern.test(code)) {
            score += 15;
        }
    });

    // Check function name patterns (each match adds 20 points)
    config.functionPatterns.forEach(pattern => {
        if (pattern.test(code)) {
            score += 20;
        }
    });

    // Cap at 100
    return Math.min(score, 100);
}

/**
 * Analyze user code to determine the most likely data structure type
 * @param {string} code - The user's algorithm code
 * @returns {Object} - Analysis result with detected type and confidence
 */
export function analyzeCode(code) {
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
        return {
            success: false,
            error: 'Please provide valid code to analyze',
            detectedType: null,
            confidence: 0,
            allScores: {}
        };
    }

    // Calculate confidence scores for all data types
    const scores = {};
    SUPPORTED_DATA_TYPES.forEach(type => {
        scores[type] = calculateConfidence(code, type);
    });

    // Find the type with highest confidence
    let maxScore = 0;
    let detectedType = null;

    Object.entries(scores).forEach(([type, score]) => {
        if (score > maxScore) {
            maxScore = score;
            detectedType = type;
        }
    });

    // Require minimum confidence threshold
    const MIN_CONFIDENCE = 20;

    if (maxScore < MIN_CONFIDENCE) {
        return {
            success: false,
            error: 'Could not determine the data structure type. Please ensure your code uses recognizable patterns for arrays, linked lists, trees, stacks, queues, or heaps.',
            detectedType: null,
            confidence: 0,
            allScores: scores
        };
    }

    return {
        success: true,
        detectedType,
        confidence: maxScore,
        allScores: scores,
        message: `✨ Analysis complete! I've identified this as a ${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)} algorithm (${maxScore}% confidence). Preparing your visualization...`
    };
}

/**
 * Validate that code is safe to execute (basic checks)
 * @param {string} code - The user's code
 * @returns {Object} - Validation result
 */
export function validateCodeSafety(code) {
    const dangerousPatterns = [
        /eval\s*\(/,
        /Function\s*\(/,
        /new\s+Function/,
        /setTimeout\s*\(/,
        /setInterval\s*\(/,
        /document\./,
        /window\./,
        /fetch\s*\(/,
        /XMLHttpRequest/,
        /import\s+/,
        /require\s*\(/,
        /process\./,
        /global\./,
        /__proto__/,
        /prototype\s*\[/,
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(code)) {
            return {
                safe: false,
                error: 'Code contains potentially unsafe patterns. Please remove any browser APIs, network calls, or dynamic code execution.'
            };
        }
    }

    return { safe: true };
}

