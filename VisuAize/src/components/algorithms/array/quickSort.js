export function quickSortSteps(arr) {
    const steps = [];
    const array = [...arr];

    function partition(left, right) {
        const pivotValue = array[right];
        steps.push({
            array: [...array],
            activeIndices: [right],
            message: `Selected pivot: ${pivotValue} at index ${right}`,
            codeLine: 13
        });

        let i = left - 1;
        for (let j = left; j < right; j++) {
            steps.push({
                array: [...array],
                activeIndices: [j, right],
                compare: [j, right],
                message: `Comparing ${array[j]} with pivot ${pivotValue}`,
                codeLine: 16
            });

            if (array[j] < pivotValue) {
                i++;
                [array[i], array[j]] = [array[j], array[i]];
                steps.push({
                    array: [...array],
                    activeIndices: [i, j],
                    swap: [i, j],
                    message: `Swap ${array[i]} and ${array[j]}`,
                    codeLine: 19
                });
            }
        }

        [array[i + 1], array[right]] = [array[right], array[i + 1]];
        steps.push({
            array: [...array],
            activeIndices: [i + 1, right],
            swap: [i + 1, right],
            message: `Place pivot ${pivotValue} at index ${i + 1}`,
            codeLine: 22
        });

        return i + 1;
    }

    function sort(left, right) {
        if (left < right) {
            const pivotIndex = partition(left, right);
            sort(left, pivotIndex - 1);
            sort(pivotIndex + 1, right);
        }
    }

    sort(0, array.length - 1);

    steps.push({
        array: [...array],
        activeIndices: [],
        sorted: array.map((_, i) => i),
        message: "Array sorted using Quick Sort!",
        codeLine: 10,
        action: 'complete'
    });

    return steps;
}
