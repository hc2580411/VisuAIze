/**
 * Generates animation steps for linked list insertion
 * @param {Object} head - Head node of the linked list
 * @param {number} value - Value to insert
 * @param {number} position - Position to insert at
 * @returns {Array} Animation steps
 */
export function insertSteps(head, value, position) {
  const originalArray = [];
  let current = head;
  while (current) {
    originalArray.push(current.value);
    current = current.next;
  }

  const steps = [];

  // Initial state
  steps.push({
    nodes: [...originalArray],
    status: `Initial list: [${originalArray.join(', ')}]`,
    action: 'start',
    codeLine: 1
  });

  // Adjust position (ensure valid position)
  const actualPosition = Math.min(Math.max(0, position), originalArray.length);

  // Highlight insert position before insertion
  steps.push({
    nodes: [...originalArray],
    insertPosition: actualPosition,
    insertedValue: value,
    status: `Preparing to insert ${value} at position ${actualPosition}`,
    action: 'prepare_insert',
    codeLine: 11
  });

  // Generate new array
  const newArray = [
    ...originalArray.slice(0, actualPosition),
    value,
    ...originalArray.slice(actualPosition)
  ];

  // Insert step
  steps.push({
    nodes: newArray,
    insertPosition: actualPosition,
    insertedValue: value,
    status: `Inserting ${value} at position ${actualPosition}`,
    action: 'insert',
    codeLine: 19
  });

  // Completion step
  steps.push({
    nodes: newArray,
    status: `Successfully inserted ${value}, new list: [${newArray.join(', ')}]`,
    action: 'complete',
    codeLine: 23,
    pauseBeforeClear: true
  });

  return steps;
}