export function insertionSortSteps(arr, options = {}) {
  const a = [...arr];
  const steps = [];

  // Allow custom starting index from code modifications
  const startI = options.startI ?? 1;

  steps.push({
    array: [...a],
    sorted: [0],
    message: startI > 1 ? `Starting Insertion Sort from index ${startI}` : "Start: Index 0 is considered sorted",
    codeLine: 1
  });

  for (let i = startI; i < a.length; i++) {
    let j = i;

    // Highlight key
    let currentSorted = Array.from({ length: i }, (_, k) => k);
    steps.push({
      array: [...a],
      compare: [i],
      sorted: currentSorted,
      message: `Selected key ${a[i]} at index ${i}`,
      codeLine: 3
    });

    while (j > 0) {
      // Compare
      steps.push({
        array: [...a],
        compare: [j - 1, j],
        sorted: currentSorted,
        message: `Comparing ${a[j]} and ${a[j - 1]}`,
        codeLine: 7
      });

      if (a[j - 1] > a[j]) {
        // Swap
        [a[j], a[j - 1]] = [a[j - 1], a[j]];

        steps.push({
          array: [...a],
          swap: [j - 1, j],
          sorted: currentSorted,
          message: `Swapped ${a[j]} and ${a[j - 1]}`,
          codeLine: 9
        });

        j--;
      } else {
        break;
      }
    }

    currentSorted = Array.from({ length: i + 1 }, (_, k) => k);
    steps.push({
      array: [...a],
      insert: j,
      sorted: currentSorted,
      message: `Inserted key at index ${j}`,
      codeLine: 3
    });
  }

  steps.push({
    array: [...a],
    sorted: Array.from({ length: a.length }, (_, k) => k),
    done: true,
    message: "Insertion Sort Complete!",
    codeLine: 15,
    pauseBeforeClear: true
  });

  return steps;
}