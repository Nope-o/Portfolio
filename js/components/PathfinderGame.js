// ===========================
// PathfinderGame Component
// ===========================
function PathfinderGame({ onGameWin, isDark }) {
  const [board, setBoard] = React.useState([]);
  const [playerPos, setPlayerPos] = React.useState({ row: 0, col: 0 });
  const [endPos, setEndPos] = React.useState({ row: 0, col: 0 });
  const [gameStatus, setGameStatus] = React.useState('loading');
  const [isBoardInitialized, setIsBoardInitialized] = React.useState(false);
  const [playerOrientation, setPlayerOrientation] = React.useState('right');
  const [lastMoveDirection, setLastMoveDirection] = React.useState('right');
  const GAME_SWIPE_THRESHOLD = 30;
  const touchStartX = React.useRef(0);
  const touchStartY = React.useRef(0);
  const playerPosRef = React.useRef(playerPos);
  const boardRef = React.useRef(board);
  const gameStatusRef = React.useRef(gameStatus);

  React.useEffect(() => { playerPosRef.current = playerPos; }, [playerPos]);
  React.useEffect(() => { boardRef.current = board; }, [board]);
  React.useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);

  const movePlayer = React.useCallback((direction) => {
    if (gameStatusRef.current !== 'playing') return;

    let newRow = playerPosRef.current.row;
    let newCol = playerPosRef.current.col;
    let currentOrientation = playerOrientation;

    switch (direction) {
      case 'up': newRow--; break;
      case 'down': newRow++; break;
      case 'left': newCol--; currentOrientation = 'left'; break;
      case 'right': newCol++; currentOrientation = 'right'; break;
      default: return;
    }

    if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
      if (boardRef.current[newRow][newCol] === 'X') {
        setGameStatus('lost');
        playSound('lose');
      } else {
        setLastMoveDirection(direction);
        setPlayerPos({ row: newRow, col: newCol });
        setPlayerOrientation(currentOrientation);
        playSound('move');
      }
    }
  }, [playerOrientation]);

  const generateBoard = React.useCallback(() => {
    setGameStatus('loading');
    setIsBoardInitialized(false);

    let newBoard, startR, startC, endR, endC;
    let validBoard = false;

    while (!validBoard) {
      newBoard = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(''));

      do {
        startR = Math.floor(Math.random() * GRID_SIZE);
        startC = Math.floor(Math.random() * GRID_SIZE);
        endR = Math.floor(Math.random() * GRID_SIZE);
        endC = Math.floor(Math.random() * GRID_SIZE);
      } while (
        (startR === endR && startC === endC) ||
        (Math.abs(startR - endR) + Math.abs(startC - endC) < Math.floor(GRID_SIZE / 0.7))
      );

      newBoard[startR][startC] = 'S';
      newBoard[endR][endC] = 'E';

      const numObstacles = Math.floor(GRID_SIZE * GRID_SIZE * 0.40);
      for (let i = 0; i < numObstacles; i++) {
        let r, c;
        do {
          r = Math.floor(Math.random() * GRID_SIZE);
          c = Math.floor(Math.random() * GRID_SIZE);
        } while (newBoard[r][c] !== '');
        newBoard[r][c] = 'X';
      }

      validBoard = isPathAvailable(
        newBoard,
        { row: startR, col: startC },
        { row: endR, col: endC }
      );
    }

    setPlayerPos({ row: startR, col: startC });
    setEndPos({ row: endR, col: endC });
    setBoard(newBoard);
    setGameStatus('playing');
    setIsBoardInitialized(true);
    setPlayerOrientation('right');
    setLastMoveDirection('right');
  }, []);

  React.useEffect(() => {
    generateBoard();
  }, [generateBoard]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isBoardInitialized || gameStatusRef.current !== 'playing') return;
      
      switch (e.key) {
        case 'ArrowUp': movePlayer('up'); break;
        case 'ArrowDown': movePlayer('down'); break;
        case 'ArrowLeft': movePlayer('left'); break;
        case 'ArrowRight': movePlayer('right'); break;
        default: return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBoardInitialized, movePlayer]);

  React.useEffect(() => {
    if (isBoardInitialized && 
        playerPos.row === endPos.row && 
        playerPos.col === endPos.col && 
        gameStatus === 'playing') {
      setGameStatus('won');
      playSound('win');
      onGameWin();
    }
  }, [playerPos, endPos, gameStatus, onGameWin, isBoardInitialized]);

  React.useEffect(() => {
    if (gameStatus === 'lost') {
      const timer = setTimeout(() => {
        generateBoard();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameStatus, generateBoard]);
  const handleTouchStart = (e) => {
    if (gameStatusRef.current !== 'playing') return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (gameStatusRef.current !== 'playing') return;
    
    // Calculate the movement direction
    const touchCurrentX = e.touches[0].clientX;
    const touchCurrentY = e.touches[0].clientY;
    const dx = touchCurrentX - touchStartX.current;
    const dy = touchCurrentY - touchStartY.current;
    
    // Only prevent default if the movement is primarily horizontal
    // This allows vertical scrolling while preventing horizontal swipes
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
    }
  };
  
const handleTouchEnd = (e) => {
  if (gameStatusRef.current !== 'playing') return;

  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;

  const dx = touchEndX - touchStartX.current;
  const dy = touchEndY - touchStartY.current;

  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > GAME_SWIPE_THRESHOLD) {
    movePlayer(dx > 0 ? 'right' : 'left');
  } 
  else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > GAME_SWIPE_THRESHOLD) {
    movePlayer(dy > 0 ? 'down' : 'up');
  }
};

  const sectionClass = isDark
    ? "relative bg-transparent p-6 sm:p-8 rounded-3xl shadow-none mb-8 max-w-3xl mx-auto text-center flex flex-col items-center"
    : "relative bg-gradient-to-br from-white via-slate-50 to-blue-50/90 p-6 sm:p-8 rounded-3xl shadow-xl mb-8 max-w-3xl mx-auto text-center flex flex-col items-center border border-slate-200/80";
  const titleClass = isDark
    ? "text-3xl md:text-4xl font-extrabold text-slate-100 mb-4 tracking-tight"
    : "text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight";
  const loadingTextClass = isDark ? "text-slate-300 mb-6" : "text-gray-700 mb-6";
  const introClass = isDark ? "text-slate-300 mb-4 max-w-2xl" : "text-slate-700 mb-4 max-w-2xl";
  const boardShellClass = isDark
    ? "w-full max-w-[540px] rounded-2xl bg-transparent shadow-none p-0 mb-4 flex flex-col items-center"
    : "w-full max-w-[540px] rounded-2xl border border-slate-300/70 bg-white/80 shadow-[0_10px_30px_rgba(30,41,59,0.12)] p-3 sm:p-4 mb-5 flex flex-col items-center";
  const tipClass = isDark ? "hidden md:block text-[12px] text-slate-400" : "hidden md:block text-[12px] text-slate-500";
  const mobileResetClass = isDark
    ? "absolute bottom-14 left-4 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg font-semibold shadow-md transition-all duration-300 md:hidden"
    : "absolute bottom-14 left-4 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg font-semibold shadow-md transition-all duration-300 md:hidden";
  const mobileControlClass = isDark
    ? "control-button-directional bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg"
    : "control-button-directional bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-lg";
  const desktopResetClass = isDark
    ? "mt-4 bg-slate-700 hover:bg-slate-600 text-white py-2.5 px-7 rounded-xl font-semibold transition-all duration-300 hidden md:block shadow-sm"
    : "mt-4 bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-7 rounded-xl font-semibold transition-all duration-300 hidden md:block shadow-sm";
  const lostBoxClass = isDark
    ? "bg-slate-900 text-slate-100 px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.45)] text-center text-xl font-bold"
    : "bg-white text-black px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.7)] text-center text-xl font-bold";
  const statusOverlay = gameStatus === 'lost' && typeof document !== "undefined"
    ? ReactDOM.createPortal(
      <div className="fixed inset-0 z-[1200] flex items-center justify-center backdrop-blur-sm transition-all duration-700 bg-red-400/10">
        <div className={lostBoxClass}>
          ❌ Oops! You hit an obstacle. Resetting...
        </div>
      </div>,
      document.body
    )
    : null;

  if (gameStatus === 'loading' || !isBoardInitialized) {
    return (
      <section className={sectionClass} style={{ minHeight: '560px' }}>
        <h2 className={titleClass}>Pathfinder's Puzzle</h2>
        <p className={loadingTextClass}>Loading game... Please wait.</p>
      </section>
    );
  }

  return (
    <section className={sectionClass} style={{ minHeight: '620px' }}>
      <h2 className={titleClass}>Pathfinder's Puzzle</h2>
      <p className={introClass}>
        Help reach your friendly ghost 👻 to his destination (
        <span className="girl-ghost-inline" aria-label="girl ghost logo">
          <span className="end-ghost-female" aria-hidden="true">👻</span>
          <span className="end-bow" aria-hidden="true">🎀</span>
        </span>
        ). Use <strong>Arrow Keys</strong> or <strong>Swipe</strong> on <strong>board</strong> to help him move.
      </p>


      <div className={boardShellClass}>
      <div 
        className="game-grid mb-3 mx-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {board.map((row, rIdx) => (
          <div key={rIdx} className="game-row">
            {row.map((cell, cIdx) => {
              const isPlayer = playerPos.row === rIdx && playerPos.col === cIdx;
              const isStart = board[rIdx][cIdx] === 'S';
              const isEnd = board[rIdx][cIdx] === 'E';
              const isObstacle = board[rIdx][cIdx] === 'X';

              let cellClass = 'game-cell';
              if (isPlayer) cellClass += ' player-cell';
              else if (isStart) cellClass += ' start-cell';
              else if (isEnd) cellClass += ' end-cell';
              else if (isObstacle) cellClass += ' obstacle-cell';

              return (
                <div key={cIdx} className={cellClass}>
                  {isPlayer ? (
                    <span className={`ghost-motion ghost-step-${lastMoveDirection}`}>
                      <span className={`player-ghost ${playerOrientation === 'right' ? 'player-face-left' : ''}`}>
                        👻
                      </span>
                    </span>
                  ) : (
                    isStart ? "🏠" : (
                      isEnd ? (
                        <span className="end-destination">
                          <span className="end-ghost-female" aria-hidden="true">👻</span>
                          <span className="end-bow" aria-hidden="true">🎀</span>
                        </span>
                      ) : (
                        isObstacle ? <span className="obstacle-cross">✖</span> : ""
                      )
                    )
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
        <p className={tipClass}>Tip: Use arrow keys for precise movement.</p>
      </div>

      {statusOverlay}
      <button
        onClick={generateBoard}
        className={mobileResetClass}
      >
        {gameStatus === 'playing' ? 'Reset' : 'Play Again'}
      </button>

      <div className="absolute bottom-2 right-4 md:hidden">
        <div className="grid grid-rows-2 grid-cols-3 gap-1 w-40">
          <div></div>
          <button onClick={() => movePlayer('up')} className={`${mobileControlClass} w-full`}>↑</button>
          <div></div>
          <button onClick={() => movePlayer('left')} className={mobileControlClass}>←</button>
          <button onClick={() => movePlayer('down')} className={`${mobileControlClass} w-full`}>↓</button>
          <button onClick={() => movePlayer('right')} className={mobileControlClass}>→</button>
        </div>
      </div>

      <button
        onClick={generateBoard}
        className={desktopResetClass}
      >
        {gameStatus === 'playing' ? 'Reset Game' : 'Play Again'}
      </button>
    </section>
  );
}
