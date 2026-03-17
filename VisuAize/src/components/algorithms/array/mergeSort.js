export function mergeSortSteps(arr) {
    const steps = [];
    const a = [...arr];
    const n = a.length;

    // Initial state
    steps.push({
        array: [...a],
        sorted: [],
        message: "Starting Merge Sort",
        codeLine: 1,
        variables: { left: 0, right: n - 1 }
    });

    function merge(arr, left, mid, right) {
        const leftArr = arr.slice(left, mid + 1);
        const rightArr = arr.slice(mid + 1, right + 1);

        steps.push({
            array: [...arr],
            highlight: Array.from({ length: right - left + 1 }, (_, i) => left + i),
            message: `Merging subarrays [${left}..${mid}] and [${mid + 1}..${right}]`,
            codeLine: 13,
            variables: { left, right, mid }
        });

        let i = 0, j = 0, k = left;

        while (i < leftArr.length && j < rightArr.length) {
            steps.push({
                array: [...arr],
                compare: [left + i, mid + 1 + j],
                message: `Comparing ${leftArr[i]} and ${rightArr[j]}`,
                codeLine: 19,
                variables: { left, right, mid, i, j }
            });

            if (leftArr[i] <= rightArr[j]) {
                arr[k] = leftArr[i];
                i++;
            } else {
                arr[k] = rightArr[j];
                j++;
            }

            steps.push({
                array: [...arr],
                insert: k,
                message: `Placed ${arr[k]} at position ${k}`,
                codeLine: 20,
                variables: { left, right, mid, i, j }
            });

            k++;
        }

        while (i < leftArr.length) {
            arr[k] = leftArr[i];
            steps.push({
                array: [...arr],
                insert: k,
                message: `Copying remaining element ${arr[k]}`,
                codeLine: 26,
                variables: { left, right, mid, i, j }
            });
            i++;
            k++;
        }

        while (j < rightArr.length) {
            arr[k] = rightArr[j];
            steps.push({
                array: [...arr],
                insert: k,
                message: `Copying remaining element ${arr[k]}`,
                codeLine: 27,
                variables: { left, right, mid, i, j }
            });
            j++;
            k++;
        }

        steps.push({
            array: [...arr],
            sorted: Array.from({ length: right - left + 1 }, (_, i) => left + i),
            message: `Merged subarray [${left}..${right}]`,
            codeLine: 13,
            variables: { left, right, mid }
        });
    }

    function mergeSortHelper(arr, left, right) {
        if (left < right) {
            const mid = Math.floor((left + right) / 2);

            steps.push({
                array: [...arr],
                highlight: Array.from({ length: right - left + 1 }, (_, i) => left + i),
                message: `Dividing array at mid = ${mid}`,
                codeLine: 3,
                variables: { left, right, mid }
            });

            mergeSortHelper(arr, left, mid);
            mergeSortHelper(arr, mid + 1, right);
            merge(arr, left, mid, right);
        }
    }

    mergeSortHelper(a, 0, n - 1);

    steps.push({
        array: [...a],
        sorted: Array.from({ length: n }, (_, i) => i),
        done: true,
        message: "Array is fully sorted!",
        codeLine: 1,
        variables: { left: 0, right: n - 1 },
        pauseBeforeClear: true
    });

    return steps;
}
