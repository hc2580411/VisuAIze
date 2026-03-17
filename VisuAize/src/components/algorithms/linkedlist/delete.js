// 假设 d3utils 在 src/utils/d3utils.js，则相对路径为 ../../utils/d3utils


export function deleteSteps(head, valueToDelete) {
  // 注意：在实际的链表算法中，通常会直接操作 head 指针，
  // 但为了简化可视化步骤，我们这里遵循你提供的、基于数组快照的逻辑。

  const originalArray = [];
  let current = head;
  while (current) {
    originalArray.push(current.value);
    current = current.next;
  }

  const steps = [];

  // 初始状态
  steps.push({
    nodes: [...originalArray],
    status: `Initial list: [${originalArray.join(', ')}]`,
    action: 'start',
    codeLine: 1
  });

  // 查找位置
  const deleteIndex = originalArray.indexOf(valueToDelete);

  if (deleteIndex !== -1) {
    // 找到位置
    steps.push({
      nodes: [...originalArray], // 保持原始数组，仅高亮
      deletePosition: deleteIndex,
      deletedValue: valueToDelete,
      status: `Found ${valueToDelete} at position ${deleteIndex}, preparing to delete`,
      action: 'found',
      codeLine: 11
    });

    // 删除步骤 (显示删除后的数组)
    const newArray = [
      ...originalArray.slice(0, deleteIndex),
      ...originalArray.slice(deleteIndex + 1)
    ];

    steps.push({
      nodes: newArray,
      deletePosition: deleteIndex, // 记录删除前的位置
      deletedValue: valueToDelete,
      status: `Deleting ${valueToDelete} from position ${deleteIndex}`,
      action: 'delete',
      codeLine: 17
    });

    // 完成步骤
    steps.push({
      nodes: newArray,
      status: `Successfully deleted ${valueToDelete}, new list: [${newArray.join(', ')}]`,
      action: 'complete',
      codeLine: 20,
      pauseBeforeClear: true
    });
  } else {
    // 未找到
    steps.push({
      nodes: originalArray,
      notFound: true,
      targetValue: valueToDelete,
      status: `Value ${valueToDelete} not found in list`,
      action: 'complete',
      codeLine: 20,
      pauseBeforeClear: true
    });
  }

  return steps;
}