// ===========================
// Pathfinding Algorithm (BFS)
// ===========================
const isPathAvailable = (board, start, end) => {
  const numRows = board.length;
  const numCols = board[0].length;
  const visited = Array.from({ length: numRows }, () => Array(numCols).fill(false));
  const queue = [start];
  const directions = [
    { row: -1, col: 0 }, // up
    { row: 1, col: 0 },  // down
    { row: 0, col: -1 }, // left
    { row: 0, col: 1 }   // right
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    const { row, col } = current;

    if (row === end.row && col === end.col) return true;

    if (
      row < 0 || row >= numRows ||
      col < 0 || col >= numCols ||
      visited[row][col] ||
      board[row][col] === 'X'
    ) {
      continue;
    }

    visited[row][col] = true;
    directions.forEach(dir => {
      queue.push({ row: row + dir.row, col: col + dir.col });
    });
  }

  return false;
};
