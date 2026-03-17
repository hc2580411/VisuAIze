import { useMemo } from "react";
const parseArrayInput = (input) => {
    if (!input || typeof input !== "string") return [];
    return input.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
};

// Algorithms
import { bubbleSortSteps } from "../algorithms/array/bubbleSort";
import { insertionSortSteps } from "../algorithms/array/insertionSort";
import { selectionSortSteps } from "../algorithms/array/selectionSort";
import { mergeSortSteps } from "../algorithms/array/mergeSort";
import { quickSortSteps } from "../algorithms/array/quickSort";
import { heapSortSteps } from "../algorithms/array/heapSort";
import { linearSearchSteps } from "../algorithms/array/linearSearch";
import { binarySearchSteps } from "../algorithms/array/binarySearch";
import { insertSteps } from "../algorithms/linkedlist/insert";
import { deleteSteps } from "../algorithms/linkedlist/delete";
import { searchSteps } from "../algorithms/linkedlist/search";
import { bstInsertSteps } from "../algorithms/tree/bstInsert";
import { bstDeleteSteps } from "../algorithms/tree/bstDelete";
import { bstSearchSteps } from "../algorithms/tree/bstSearch";
import { inorderSteps, preorderSteps, postorderSteps } from "../algorithms/tree/traversals";
import { pushSteps } from "../algorithms/stack/push";
import { popSteps } from "../algorithms/stack/pop";
import { enqueueSteps } from "../algorithms/queue/enqueue";
import { dequeueSteps } from "../algorithms/queue/dequeue";
import { heapInsertSteps } from "../algorithms/heap/insert";
import { heapExtractMaxSteps } from "../algorithms/heap/extractMax";

const algorithms = {
    array: {
        bubble: bubbleSortSteps,
        insertion: insertionSortSteps,
        selection: selectionSortSteps,
        merge: mergeSortSteps,
        quickSort: quickSortSteps,
        heapSort: heapSortSteps,
        linearSearch: linearSearchSteps,
        binarySearch: binarySearchSteps
    },
    linkedlist: {
        insert: insertSteps,
        delete: deleteSteps,
        search: searchSteps
    },
    tree: {
        bstInsert: bstInsertSteps,
        bstDelete: bstDeleteSteps,
        bstSearch: bstSearchSteps,
        inorder: inorderSteps,
        preorder: preorderSteps,
        postorder: postorderSteps
    },
    stack: {
        push: pushSteps,
        pop: popSteps
    },
    queue: {
        enqueue: enqueueSteps,
        dequeue: dequeueSteps
    },
    heap: {
        insert: heapInsertSteps,
        extractMax: heapExtractMaxSteps
    },
};

// Helper to convert list to array for display - moved outside hook to prevent recreation
const listToArray = (head) => {
    const arr = [];
    let current = head;
    while (current) {
        arr.push(current.value);
        current = current.next;
    }
    return arr;
};

export default function useAlgorithmSteps({
    dataType,
    algo,
    input,
    searchTarget,
    currentTreeRoot,
    currentListHead,
    currentStack,
    currentQueue,
    currentHeap,
    codeModifications,
    playTrigger, // Increment this to force steps to recompute on every Play press
}) {

    const result = useMemo(() => {
        try {
            // Input Validation
            if (dataType === "tree") {
                if (input && !/^\d{1,3}$/.test(input)) {
                    return { steps: [], error: "Input must be a number (0-100)" };
                }
                const num = parseInt(input);
                if (input && (num < 0 || num > 100)) {
                    return { steps: [], error: "Value must be between 0 and 100" };
                }
            } else if (dataType === "array") {
                const arr = parseArrayInput(input);
                if (arr.length > 15) {
                    return { steps: [], error: "No more than 15 inputs allowed" };
                }
            }

            const algorithmToUse = algorithms[dataType]?.[algo];

            // If algorithm doesn't exist for this data type, return empty steps
            // This can happen during data type switching before the algo state updates
            if (!algorithmToUse) {
                return { steps: [], error: "" };
            }

            if (dataType === "array") {
                // Use default values if input is null, undefined, or empty string
                const arr = (!input || input.trim() === '') ? [50, 30, 20, 40, 10] : parseArrayInput(input);

                // Handle search algorithms with dual input
                if (algo === "linearSearch" || algo === "binarySearch") {
                    const target = parseInt(searchTarget);
                    if (!searchTarget || isNaN(target)) {
                        return {
                            steps: [{
                                array: arr,
                                sorted: [],
                                message: "Enter a search target value",
                                codeLine: 0,
                            }],
                            error: ""
                        };
                    }
                    return { steps: algorithmToUse(arr, target, codeModifications), error: "" };
                }

                // Regular sorting algorithms - pass codeModifications as options
                return { steps: algorithmToUse(arr, codeModifications || {}), error: "" };
            }

            if (dataType === "linkedlist") {
                const list = currentListHead;

                if (algo === "insert") {
                    if (!input)
                        return {
                            steps: [
                                {
                                    nodes: listToArray(list),
                                    status: "Enter value,position to insert",
                                },
                            ],
                            error: "",
                        };
                    const parts = input.split(",");
                    const val = parseInt(parts[0]);
                    const pos = parseInt(parts[1]);

                    if (isNaN(val) || isNaN(pos))
                        return {
                            steps: [
                                { nodes: listToArray(list), status: "Invalid input format" },
                            ],
                            error: "Invalid input format",
                        };

                    return { steps: algorithmToUse(list, val, pos), error: "" };
                }
                if (algo === "delete") {
                    if (!input)
                        return {
                            steps: [
                                { nodes: listToArray(list), status: "Enter value to delete" },
                            ],
                            error: "",
                        };
                    const val = parseInt(input);
                    if (isNaN(val))
                        return {
                            steps: [
                                { nodes: listToArray(list), status: "Invalid input format" },
                            ],
                            error: "Invalid input format",
                        };

                    return { steps: algorithmToUse(list, val), error: "" };
                }
                if (algo === "search") {
                    // Linked list search uses searchTarget for the value to find
                    if (!searchTarget)
                        return {
                            steps: [
                                { nodes: listToArray(list), status: "Enter value to search" },
                            ],
                            error: "",
                        };
                    const val = parseInt(searchTarget);
                    if (isNaN(val))
                        return {
                            steps: [
                                { nodes: listToArray(list), status: "Invalid search target" },
                            ],
                            error: "Invalid search target",
                        };

                    return { steps: algorithmToUse(list, val), error: "" };
                }
            }

            if (dataType === "tree") {
                // For bstSearch, use searchTarget instead of input
                if (algo === "bstSearch") {
                    const val = parseInt(searchTarget);
                    if (!searchTarget || isNaN(val) || val < 0 || val > 100)
                        return {
                            steps: [
                                { root: currentTreeRoot, message: "Enter a number (0-100) to search for" },
                            ],
                            error: "Please enter a value between 0 and 100",
                        };
                    return { steps: algorithmToUse(currentTreeRoot, val), error: "" };
                }

                // For traversals, no input is needed
                if (algo === "inorder" || algo === "preorder" || algo === "postorder") {
                    if (!currentTreeRoot) {
                        return { steps: [], error: "Tree is empty" };
                    }
                    return { steps: algorithmToUse(currentTreeRoot), error: "" };
                }

                // For other tree operations, use regular input
                const val = parseInt(input);
                if (isNaN(val))
                    return {
                        steps: [
                            { root: currentTreeRoot, message: "Enter a number (0-100) to start" },
                        ],
                        error: "",
                    };

                if (algo === "bstInsert") {
                    return { steps: algorithmToUse(currentTreeRoot, val), error: "" };
                }
                if (algo === "bstDelete") {
                    return { steps: algorithmToUse(currentTreeRoot, val), error: "" };
                }
            }

            if (dataType === "stack") {
                if (algo === "push") {
                    if (!input)
                        return {
                            steps: [
                                { stack: currentStack, message: "Enter a number to push" },
                            ],
                            error: "",
                        };
                    const val = parseInt(input);
                    if (isNaN(val))
                        return {
                            steps: [
                                { stack: currentStack, message: "Invalid input format" },
                            ],
                            error: "Invalid input format",
                        };
                    return { steps: algorithmToUse(currentStack, val), error: "" };
                }
                if (algo === "pop") {
                    return { steps: algorithmToUse(currentStack), error: "" };
                }
            }

            if (dataType === "queue") {
                if (algo === "enqueue") {
                    if (!input)
                        return {
                            steps: [
                                { queue: currentQueue, message: "Enter a number to enqueue" },
                            ],
                            error: "",
                        };
                    const val = parseInt(input);
                    if (isNaN(val))
                        return {
                            steps: [
                                { queue: currentQueue, message: "Invalid input format" },
                            ],
                            error: "Invalid input format",
                        };
                    return { steps: algorithmToUse(currentQueue, val), error: "" };
                }
                if (algo === "dequeue") {
                    return { steps: algorithmToUse(currentQueue), error: "" };
                }
            }

            if (dataType === "heap") {
                if (algo === "insert") {
                    if (!input)
                        return {
                            steps: [{ heap: currentHeap, message: "Enter a number to insert" }],
                            error: "",
                        };
                    const val = parseInt(input);
                    if (isNaN(val))
                        return {
                            steps: [{ heap: currentHeap, message: "Invalid input format" }],
                            error: "Invalid input format",
                        };
                    return { steps: algorithmToUse(currentHeap, val), error: "" };
                }
                if (algo === "extractMax") {
                    return { steps: algorithmToUse(currentHeap), error: "" };
                }
            }

            return { steps: [], error: "" };
        } catch (e) {
            console.error(e);
            return { steps: [], error: e.message };
        }
    }, [
        dataType,
        algo,
        input,
        searchTarget,
        currentTreeRoot,
        currentListHead,
        currentStack,
        currentQueue,
        currentHeap,
        codeModifications,
        playTrigger, // Forces recompute on every Play press
    ]);

    return result;
}
