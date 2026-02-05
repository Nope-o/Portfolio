// ===========================
// Configuration & Constants
// ===========================
const NAV_TABS = [
  { id: 'about', label: 'About' },
  { id: 'journey', label: 'Life Journey', mobileLabel: 'Life' },
  { id: 'resume', label: 'Resume', mobileLabel: 'Resume' },
  { id: 'contact', label: 'Contact', mobileLabel: 'Contact' },
  { id: 'privacy', label: 'Privacy Policy', mobileLabel: 'Privacy' }
];

const GRID_SIZE = 7;
const SWIPE_THRESHOLD = 75;
const SCROLL_DOWN_THRESHOLD = 80;
const SCROLL_UP_THRESHOLD = 60;

// ===========================
// Audio System (Lazy-loaded)
// ===========================
let audioInitialized = false;
let winSynth, loseSynth, moveSynth;

const initializeAudio = () => {
  if (audioInitialized || typeof Tone === 'undefined') return;
  
  winSynth = new Tone.PolySynth(Tone.Synth, {
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.1, release: 0.5 }
  }).toDestination();

  loseSynth = new Tone.NoiseSynth({
    envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.3 }
  }).toDestination();

  moveSynth = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }
  }).toDestination();

  audioInitialized = true;
};

const playSound = async (type) => {
  if (!audioInitialized) initializeAudio();
  if (!audioInitialized || typeof Tone === 'undefined') return;

  try {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    switch (type) {
      case 'win':
        winSynth?.triggerAttackRelease(["C5", "E5", "G5", "C6"], "8n");
        break;
      case 'lose':
        loseSynth?.triggerAttackRelease("4n");
        break;
      case 'move':
        moveSynth?.triggerAttackRelease("C2", "16n");
        break;
    }
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
};

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

// ===========================
// Navbar Component
// ===========================
function Navbar({ activeTab, setActiveTab }) {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const [animateLogo, setAnimateLogo] = React.useState(false);
  const [isScrolledDown, setIsScrolledDown] = React.useState(false);
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    
    const handleScroll = () => {
      if (!isMobile) {
        setIsScrolledDown(false);
        return;
      }

      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && 
          currentScrollY > SCROLL_DOWN_THRESHOLD && 
          !isScrolledDown) {
        setIsScrolledDown(true);
      } else if (currentScrollY < lastScrollY.current && 
                 currentScrollY < SCROLL_UP_THRESHOLD && 
                 isScrolledDown) {
        setIsScrolledDown(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile, isScrolledDown]);

  const handleLogoClick = () => {
    setAnimateLogo(true);
    setTimeout(() => setAnimateLogo(false), 1000);
    setActiveTab('about', 'click');
  };

  const headerClasses = `bg-white/75 backdrop-blur shadow sticky top-0 z-50 transition-all duration-300 ease-in-out ${
    isMobile && isScrolledDown ? 'header-compact' : 'header-expanded'
  }`;

  const mainContentWrapperClasses = `container mx-auto px-4 md:px-8 flex ${
    isMobile && isScrolledDown 
      ? 'flex-row items-center justify-between py-2' 
      : 'flex-col items-center justify-center py-3 md:flex-row md:justify-between md:items-center'
  }`;

  const logoFrameClasses = `logo-frame group cursor-pointer select-none ${
    isMobile && isScrolledDown ? 'flex-shrink-0' : 'w-full text-center mb-4 md:w-auto md:text-left md:mb-0'
  } ${animateLogo ? "logo-burst" : ""}`;

  const logoTextClasses = `logo-text group-hover:tracking-widest transition-all ${
    isMobile && isScrolledDown ? 'hidden' : ''
  }`;

  return (
    <header className={headerClasses}>
      <div className={mainContentWrapperClasses}>
        <span className={logoFrameClasses} onClick={handleLogoClick}>
          <img
            src="logoo.webp"
            alt="Madhav Kataria"
            className="h-6 sm:h-8 w-auto inline-block mr-2 -mt-[0.1rem]"
          />
          <span className={logoTextClasses}>Madhav Kataria</span>
        </span>
        <nav className={`w-full ${isMobile && isScrolledDown ? 'block' : 'block md:block'} md:w-auto`}>
          <ul className={`flex flex-row items-center gap-1 w-full ${
            isMobile && isScrolledDown ? 'justify-end' : 'justify-center'
          }`}>
            {NAV_TABS.map(tab => (
              isMobile && tab.id === 'privacy' ? null : (
                <li key={tab.id} className="relative">
                  <button
                    className={`nav-link${activeTab === tab.id ? " active" : ""} px-3 py-2 rounded-md transition-all duration-300`}
                    onClick={() => setActiveTab(tab.id, 'click')}
                  >
                    {isMobile && tab.mobileLabel ? tab.mobileLabel : tab.label}
                    <span className="nav-underline"></span>
                  </button>
                </li>
              )
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

// ===========================
// About Component
// ===========================
function About({ showSection }) {
  return (
    <section className="about-bg p-8 rounded-3xl shadow-2xl mb-10 relative overflow-hidden" style={{ minHeight: '60vh' }}>
      <div className="relative z-10 flex about-flex-mobile md:flex-row flex-col items-center md:items-start space-y-6 md:space-y-0 md:space-x-10">
        <div className="flex-shrink-0 flex flex-col items-center md:items-start about-photo-mobile">
          <div className="about-photo-bg mb-3 mt-2 shadow-lg hover:scale-105 transition-transform duration-500">
            <img 
              src="Madhav-kataria.webp" 
              alt="Madhav Kataria" 
              className="rounded-full w-40 h-40 object-cover shadow-xl border-4 border-white"
              loading="lazy"
            />
          </div>
        </div>

        <div className="flex-grow about-text-mobile">
          <h2 className="text-4xl font-extrabold about-main-title mb-3 tracking-tight drop-shadow-sm">
            Hello, I'm <span>Madhav Kataria!</span>
          </h2>
          <p className="text-lg text-gray-100 leading-relaxed mb-2 card-float-in">
            Currently pursuing Bachelor's in Data Science and AI from IIT Guwahati.🎓
          </p>
          <p className="text-lg text-gray-200 leading-relaxed mb-3 card-float-in">
            I am a passionate and results-driven professional with expertise in <strong className="about-strong">Robotic Process Automation (RPA), Power Platform development (Power Apps, Power BI), and IT Infrastructure management</strong>. My journey is driven by a desire to <strong className="about-strong">build innovative solutions that enhance efficiency and reduce human errors</strong>, and continuously learn and grow.
          </p>
          <p className="text-md text-gray-300 mb-3 card-float-in">
            My unique value proposition lies in my ability to <strong className="about-strong">leverage AI, Data insights and automation to optimize organizational processes, specifically in the IT Infra Domain</strong>.
          </p>
          <div className="space-y-2 mb-6 card-float-in">
            <h3 className="text-xl font-semibold about-value">My Values:</h3>
            <ul className="list-disc list-inside text-gray-200">
              <li>Innovation & Continuous Learning</li>
              <li>Collaboration & Teamwork</li>
              <li>Integrity & Transparency</li>
              <li>User-Centric Approach</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-6">
        <button
          onClick={() => showSection('contact', 'click')}
          className="bg-gradient-to-r from-sky-900 to-blue-950 hover:from-blue-800 hover:to-blue-900 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          Get in Touch!
        </button>
        
        <button
          onClick={() => showSection('journey', 'click')}
          className="bg-gradient-to-r from-sky-900 to-blue-950 hover:from-blue-800 hover:to-blue-900 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          🚀 Explore My Journey
        </button>
      </div>
      <p className="text-center text-gray-300 mt-4 text-sm italic">
        "Driven by curiosity. Inspired by innovation. Always learning." ✨
      </p>
    </section>
  );
}
// ===========================
// PathfinderGame Component
// ===========================
function PathfinderGame({ onGameWin }) {
  const [board, setBoard] = React.useState([]);
  const [playerPos, setPlayerPos] = React.useState({ row: 0, col: 0 });
  const [endPos, setEndPos] = React.useState({ row: 0, col: 0 });
  const [gameStatus, setGameStatus] = React.useState('loading');
  const [isBoardInitialized, setIsBoardInitialized] = React.useState(false);
  const [playerOrientation, setPlayerOrientation] = React.useState('right');

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
    e.preventDefault();
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (gameStatusRef.current !== 'playing') return;
    e.preventDefault();
  };

  const handleTouchEnd = (e) => {
    if (gameStatusRef.current !== 'playing') return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - touchStartX.current;
    const dy = touchEndY - touchStartY.current;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      movePlayer(dx > 0 ? 'right' : 'left');
    } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SWIPE_THRESHOLD) {
      movePlayer(dy > 0 ? 'down' : 'up');
    }
  };

  if (gameStatus === 'loading' || !isBoardInitialized) {
    return (
      <section className="relative bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-white p-8 rounded-3xl shadow-2xl mb-10 max-w-xl mx-auto text-center flex flex-col items-center" style={{ minHeight: '600px' }}>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight drop-shadow-sm">Pathfinder's Puzzle</h2>
        <p className="text-gray-700 mb-6">Loading game... Please wait.</p>
      </section>
    );
  }

  return (
    <section className="relative bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-white p-8 rounded-3xl shadow-2xl mb-10 max-w-xl mx-auto text-center flex flex-col items-center" style={{ minHeight: '640px' }}>
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight drop-shadow-sm">Pathfinder's Puzzle</h2>
      <p className="text-gray-700 mb-6">Navigate the board to reach the destination. Use **Arrow Keys** or **Swipe** to move!</p>

      <div 
        className="game-grid mb-6"
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
                    <span className={playerOrientation === 'left' ? 'player-face-left' : ''}>
                      👻
                    </span>
                  ) : (isStart ? '🏠' : (isEnd ? '🏁' : (isObstacle ? '🚧' : '')))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {gameStatus === 'won' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-400/10 backdrop-blur-sm transition-all duration-700">
          <div className="bg-white text-black px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.7)] text-center text-xl font-bold">
            🎉 Congratulations! You've found your path!
          </div>
        </div>
      )}
      
      {gameStatus === 'lost' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-400/10 backdrop-blur-sm transition-all duration-700">
          <div className="bg-white text-black px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.7)] text-center text-xl font-bold">
            ❌ Oops! You hit an obstacle. Resetting...
          </div>
        </div>
      )}

      <button
        onClick={generateBoard}
        className="absolute bottom-14 left-4 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg font-semibold shadow-md transition-all duration-300 md:hidden"
      >
        {gameStatus === 'playing' ? 'Reset' : 'Play Again'}
      </button>

      <div className="absolute bottom-2 right-4 md:hidden">
        <div className="grid grid-rows-2 grid-cols-3 gap-1 w-40">
          <div></div>
          <button onClick={() => movePlayer('up')} className="control-button-directional bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-lg w-full">↑</button>
          <div></div>
          <button onClick={() => movePlayer('left')} className="control-button-directional bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-lg">←</button>
          <button onClick={() => movePlayer('down')} className="control-button-directional bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-lg w-full">↓</button>
          <button onClick={() => movePlayer('right')} className="control-button-directional bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-lg">→</button>
        </div>
      </div>

      <button
        onClick={generateBoard}
        className="mt-6 bg-gray-700 hover:bg-gray-800 text-white py-2 px-6 rounded-lg font-semibold transition-all duration-300 hidden md:block"
      >
        {gameStatus === 'playing' ? 'Reset Game' : 'Play Again'}
      </button>
    </section>
  );
}

// ===========================
// WinAnimationOverlay Component
// ===========================
function WinAnimationOverlay() {
  return (
    <div className="win-overlay-container">
      <div className="win-message-box animate-win-reveal">
        <span className="text-6xl animate-pulse-emoji">🎉</span>
        <h3 className="text-4xl font-extrabold text-blue-900 mt-4">You Won!</h3>
        <p className="text-xl text-gray-700 mt-2">The path to knowledge is now open.</p>
        <span className="text-6xl animate-pulse-emoji">🎉</span>
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`firecracker firecracker-${i}`}></div>
      ))}
    </div>
  );
}
// ===========================
// Journey Component
// ===========================
function Journey({ setAppWinAnimation }) {
  const [showDetails, setShowDetails] = React.useState({});
  const [gameWon, setGameWon] = React.useState(false);
  const [animatingIcon, setAnimatingIcon] = React.useState(null);

  React.useEffect(() => {
    setGameWon(false);
  }, []);

  const toggleDetails = (index) => {
    setShowDetails(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleGameWin = () => {
    setAppWinAnimation(true);
    setTimeout(() => {
      setAppWinAnimation(false);
      setGameWon(true);
    }, 2000);
  };

  const timelineItems = [
    {
      title: "Started Bachelor's Degree at IIT Guwahati",
      time: "Year of Enrollment - Present",
      desc: "Began my Bachelor's in Data Science and AI from IIT Guwahati, diving deep into cutting-edge technologies and foundational concepts.",
      fullDesc: `Commenced a rigorous Bachelor's program in Data Science and AI at IIT Guwahati, one of India's premier technical institutions. This program has provided a strong foundation in algorithms, machine learning, artificial intelligence, and data analytics.`,
      logoUrl: "IITG_logo.webp",
      iconUrl: "https://cdn-icons-png.flaticon.com/128/4341/4341160.png"
    },
    {
      title: "Training at HCL TechBee Program",
      time: "Sept 2022 - Mar 2023",
      desc: "Completed intensive 6-month training focusing on Data Centre Operations, Linux CLI, networking, AWS, and basic programming.",
      fullDesc: `Underwent comprehensive 6-month training through the HCL TechBee Program. The curriculum covered Data Centre Operations, Linux CLI, network configuration, AWS cloud services, and programming fundamentals in Python, C, SQL, and Oracle.`,
      logoUrl: "hcl.webp",
      iconUrl: "https://cdn-icons-png.flaticon.com/128/1376/1376421.png"
    },
    {
      title: "Internship at HCL - Technical Support Engineer",
      time: "Mar 2023 - Sept 2023",
      desc: "Served as Technical Support Engineer for Ericsson Global Organization, achieving high resolve counts and contributing to knowledge base articles.",
      fullDesc: `Worked as a Technical Support Engineer intern for Ericsson Global Organization, providing first-line and second-line support for complex technical issues. Consistently achieved high resolve count and received user satisfaction certificates.`,
      logoUrl: "ericsson.webp",
      iconUrl: "https://cdn-icons-png.flaticon.com/128/10822/10822222.png"
    },
    {
      title: "Full-Time Role & Automation Engineer",
      time: "Sept 2023 - Present",
      desc: "Transitioned to a full-time role, focusing on automation with Power Apps and Power Automate, and developing Power BI reports.",
      fullDesc: `Transitioned into a full-time role as a Technical Support Engineer and Automation Specialist. Developed robust applications with Power Apps, automated tasks with Power Automate flows, and designed interactive Power BI reports.`,
      logoUrl: "hcl.webp",
      iconUrl: "https://cdn-icons-png.flaticon.com/128/4300/4300059.png"
    },
    {
      title: "Developed Key Power Platform Applications",
      time: "Ongoing",
      desc: "Successfully developed and deployed the Attendance Tracker and KBA Review applications, significantly improving operational efficiency.",
      fullDesc: `Led the development of critical applications using Microsoft Power Platform. Created Attendance Tracker for resource management and KBA Review application for knowledge article quality management. Both projects involved end-to-end development from requirements to deployment.`,
      logoUrl: "hcl.webp",
      iconUrl: "https://cdn-icons-png.flaticon.com/128/8899/8899687.png"
    },
    {
      title: "Recognized for Automation & Quality",
      time: "Ongoing",
      desc: "Received multiple HCL certificates and client appreciation for automation, reports, highest resolve count and user satisfaction.",
      fullDesc: `Consistently recognized for outstanding contributions to automation and quality initiatives. Received various certificates from HCL for Automation and Power BI Reports development. Work acknowledged by Ericsson's Global Quality and Process Head.`,
      logoUrl: "hcl.webp",
      iconUrl: "https://cdn-icons-png.flaticon.com/128/9961/9961540.png"
    }
  ];

  return (
    <section className="bg-gradient-to-br from-indigo-50/70 via-blue-50/70 to-white p-7 rounded-3xl shadow-2xl mb-10">
      <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2 tracking-tight drop-shadow-sm">My Life Journey & Experiences</h2>

      {!gameWon ? (
        <PathfinderGame onGameWin={handleGameWin} />
      ) : (
        <>
          <p className="text-center text-gray-800 text-lg mb-6 font-semibold animate-section-in">
            "🎉 You've unlocked my life journey! Here's how I've navigated challenges and milestones — I hope it inspires you too."
          </p>
          <p className="text-center text-gray-700 mb-6">Explore the significant milestones, professional growth, and personal experiences that have shaped my journey.</p>
          <div className="mt-10">
            <h3 className="text-xl font-bold text-blue-950 mb-2">Timeline....</h3>
            <ol className="timeline-list">
              {timelineItems.map((item, i) => (
                <li className="timeline-item" key={i}>
                  <span className="timeline-dot">
                    <img
                      src={item.iconUrl}
                      alt="icon"
                      className={`timeline-icon ${animatingIcon === i ? 'animate-jiggle' : ''}`}
                      loading="lazy"
                    />
                  </span>
                  <div className="flex-1">
                    <div 
                      className="timeline-content cursor-pointer flex justify-between items-start"
                      onClick={() => {
                        toggleDetails(i);
                        setAnimatingIcon(i);
                        setTimeout(() => setAnimatingIcon(null), 500);
                      }}
                    >
                      <div className="flex-grow">
                        <h4 className="font-bold text-slate-800">{item.title}</h4>
                        <span className="block text-gray-500 text-xs mb-1">{item.time}</span>
                        <p className="text-slate-700">{item.desc}</p>
                      </div>
                      {item.logoUrl && (
                        <img 
                          src={item.logoUrl} 
                          alt={`${item.title} logo`} 
                          className="w-10 h-10 object-contain ml-4 mt-1 flex-shrink-0"
                          loading="lazy"
                        />
                      )}
                      {!showDetails[i] && (
                        <div className="absolute bottom-2 right-2">
                          <svg className="w-6 h-6 text-gray-400 animate-bounce-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7-7-7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className={`timeline-details mt-2${showDetails[i] ? ' open' : ''}`} onClick={() => toggleDetails(i)}>
                      {showDetails[i] && <p>{item.fullDesc}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <p className="text-center text-gray-700 mt-8 text-lg font-semibold">Learning and developing skills to contribute and make a meaningful impact!</p>
          </div>
        </>
      )}
    </section>
  );
}

// ===========================
// Resume Component
// ===========================
function Resume() {
  return (
    <section className="bg-white p-7 rounded-3xl shadow-2xl mb-10 relative">
      <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-6 tracking-tight drop-shadow-sm">Resume</h2>
      
      <div className="absolute top-4 right-4">
        <a 
          href="Madhav_Kataria_Resume.pdf" 
          download="Madhav_Kataria_Resume.pdf"
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-700 font-semibold text-sm hover:underline flex items-center"
        >
          Download
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      </div>

      <div id="resume-content" className="card-float-in mb-6 bg-gradient-to-br from-slate-100 via-gray-50 to-white rounded-xl p-6 shadow-md">
        <div className="text-lg font-semibold text-gray-800 mb-2">Professional Summary</div>
        <p className="text-gray-700 mb-2">Currently pursuing a Bachelor's in <strong>Data Science and Artificial Intelligence from IIT Guwahati</strong>, with <strong>3+ years</strong> of experience at <strong>HCL Technologies</strong>, including work as a supplier to <strong>Ericsson Global</strong>.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <h3 className="font-bold text-lg text-blue-900 mb-2">Core Expertise</h3>
            <ul className="list-disc ml-6 text-gray-700">
              <li>RPA Development using Microsoft Power Automate</li>
              <li>Custom Applications via Power Apps Platform</li>
              <li>Power BI Reports and Dashboards</li>
              <li>Data Analysis in IT Infrastructure Domain</li>
            </ul>
            
            <h3 className="font-bold text-lg text-blue-900 mt-5 mb-2">Key Certifications</h3>
            <ul className="list-disc ml-6 text-gray-700">
              <li><a href="https://www.credly.com/badges/513343d0-0d83-4761-9916-f6324436d81f/public_url" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Google Cloud Associate</a></li>
              <li><a href="https://learn.microsoft.com/api/credentials/share/en-in/MadhavKataria-2316/D68B6A617A2B34D0?sharingId=D371C6433FF7895E" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Power Automate RPA Developer</a></li>
              <li><a href="https://learn.microsoft.com/api/credentials/share/en-in/MadhavKataria-2316/94FFC17678CF74E8?sharingId=D371C6433FF7895E" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Power BI Data Analyst</a></li>
              <li><a href="https://learn.microsoft.com/api/credentials/share/en-us/MadhavKataria-2316/FBC420B1E155F51?sharingId=D371C6433FF7895E" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Azure Fundamentals</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg text-blue-900 mb-2">Technical Skills</h3>
            
            <div className="mb-4">
              <div className="font-semibold">Machine Learning & AI</div>
              <div className="text-gray-600 text-sm mb-1">Python libraries: Pandas, Scikit-learn, NumPy</div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">Pandas</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">Scikit-learn</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">NumPy</span>
              </div>
              
              <div className="font-semibold">Cloud Computing</div>
              <div className="text-gray-600 text-sm mb-1">AWS, Azure, GCP</div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">AWS</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">Azure</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">GCP</span>
              </div>
              
              <div className="font-semibold">Microsoft Power Platform</div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">Power BI</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">PowerApps</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">Power Automate</span>
              </div>
            </div>
            
            <h3 className="font-bold text-lg text-blue-900 mt-5 mb-2">Key Achievements</h3>
            <ul className="list-disc ml-6 text-gray-700">
              <li>Developed Python automation scripts for network management</li>
              <li>Created multiple PowerApps solutions improving operational efficiency</li>
              <li>Designed Power BI dashboards for Mondelēz International</li>
              <li>Received 50+ client appreciations for exceptional support</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
// ===========================
// Contact Component
// ===========================
function Contact() {
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    setSent(false);
    const form = e.target;
    const formData = new FormData(form);

    try {
      const response = await fetch("https://formspree.io/f/myzjynok", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData
      });
      const data = await response.json();
      if (data.ok) {
        setSent(true);
        form.reset();
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    }
    setLoading(false);
  }

  return (
    <section className="bg-gradient-to-br from-indigo-50/80 via-blue-50/80 to-white p-8 rounded-3xl shadow-2xl mb-10 max-w-lg mx-auto">
      <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-6 tracking-tight drop-shadow-sm">Contact Me</h2>
      <p className="text-center text-gray-700 mb-6 flex items-center justify-center">
        This isn't just a form — it's the start of a good conversation. &nbsp; <span className="text-4xl animate-bounce">😉</span>
      </p>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1 font-semibold text-gray-700">Your Name</label>
          <input 
            name="name" 
            required 
            className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-700 transition bg-white/90" 
            type="text" 
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold text-gray-700">Your Email</label>
          <input 
            name="email" 
            required 
            className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-700 transition bg-white/90" 
            type="email" 
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold text-gray-700">Message</label>
          <textarea 
            name="message" 
            required 
            className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-700 transition bg-white/90" 
            rows="4" 
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-full font-semibold shadow-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-300 pulse disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
        {sent && <p className="text-green-600 text-center mt-2">Thank you! Your message has been sent.</p>}
        {error && <p className="text-red-600 text-center mt-2">Sorry, something went wrong. Please try emailing me directly.</p>}
      </form>
      <div className="mt-6 text-center text-gray-600">
        <div className="mb-2">Or email directly:</div>
        <a href="mailto:contact.madhavkataria@gmail.com" aria-label="Email Madhav Kataria" className="text-blue-700 font-semibold hover:underline">Send an Email</a>
        <div className="mt-2">
          <a href="https://www.linkedin.com/in/madhav-k-804904262/" target="_blank" rel="noopener noreferrer" aria-label="Connect with Madhav Kataria on LinkedIn" className="text-blue-700 font-semibold hover:underline">Connect on LinkedIn</a>
        </div>
      </div>
    </section>
  );
}

// ===========================
// PrivacyPolicy Component
// ===========================
function PrivacyPolicy({ setActiveTab }) {
  const effectiveDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <section className="bg-white p-8 rounded-3xl shadow-2xl mb-10 mx-auto max-w-2xl relative">
      <button
        onClick={() => setActiveTab('about', 'click')}
        className="absolute top-4 left-4 w-12 h-12 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors duration-200"
        aria-label="Go back to About section"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-6 tracking-tight drop-shadow-sm">Privacy Policy</h2>
      <p className="text-gray-700 mb-4"><strong>Effective Date: {effectiveDate}</strong></p>
      
      <p className="text-gray-700 mb-6">
        Thank you for visiting Madhav Kataria - Personal Website. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect information when you use our website.
      </p>

      <div className="border-t border-gray-300 my-6"></div>

      <h3 className="text-2xl font-bold text-gray-800 mb-4">1. Information We Collect</h3>
      <p className="text-gray-700 mb-4">
        When you visit our Site, we may automatically collect certain information about your visit, including your IP address. This is done through basic scripts and is used solely for analytics or security purposes.
      </p>
      <p className="text-gray-700 mb-4">We do not collect:</p>
      <ul className="list-disc list-inside text-gray-700 mb-4 pl-4">
        <li>Personal identifiers like your name or email address.</li>
        <li>Any sensitive data.</li>
        <li>Any data through cookies or local storage.</li>
      </ul>

      <div className="border-t border-gray-300 my-6"></div>

      <h3 className="text-2xl font-bold text-gray-800 mb-4">2. How We Use the Information</h3>
      <p className="text-gray-700 mb-4">We use the collected IP addresses to:</p>
      <ul className="list-disc list-inside text-gray-700 mb-4 pl-4">
        <li>Understand visitor traffic patterns and improve the website.</li>
        <li>Monitor for spam, abuse, or unauthorized access.</li>
        <li>Perform basic usage analytics.</li>
      </ul>

      <div className="border-t border-gray-300 my-6"></div>

      <h3 className="text-2xl font-bold text-gray-800 mb-4">3. Cookies and Tracking</h3>
      <p className="text-gray-700 mb-4">
        We do not use cookies or similar tracking technologies on this website. Your device does not store any data from our site beyond standard browser caching.
      </p>

      <div className="border-t border-gray-300 my-6"></div>

      <h3 className="text-2xl font-bold text-gray-800 mb-4">4. Contact Us</h3>
      <p className="text-gray-700 mb-4">
        If you have questions about this Privacy Policy, contact: <a href="mailto:contact.madhavkataria@gmail.com" className="text-blue-700 hover:underline">contact.madhavkataria@gmail.com</a>
      </p>
    </section>
  );
}

// ===========================
// Main App Component
// ===========================
function App() {
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '');
    const validTabIds = NAV_TABS.map(tab => tab.id);
    return validTabIds.includes(hash) ? hash : 'about';
  };

  const [activeTab, setActiveTabState] = React.useState(getInitialTab);
  const [touchStartX, setTouchStartX] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const [transitionDirection, setTransitionDirection] = React.useState('animate-section-in');
  const [showFullPageWinAnimation, setShowFullPageWinAnimation] = React.useState(false);
  const [showBackToTop, setShowBackToTop] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => { 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }, [activeTab]);

  React.useEffect(() => {
    const handleHashChange = () => {
      setActiveTabState(getInitialTab());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const setActiveTab = (tabId, origin = 'click') => {
    const navigableTabs = NAV_TABS.filter(tab => tab.id !== 'privacy');
    const oldIndex = navigableTabs.findIndex(tab => tab.id === activeTab);
    const newIndex = navigableTabs.findIndex(tab => tab.id === tabId);

    if (origin === 'swipe' && isMobile) {
      if (newIndex > oldIndex) {
        setTransitionDirection('slide-in-right');
      } else if (newIndex < oldIndex) {
        setTransitionDirection('slide-in-left');
      }
    } else {
      setTransitionDirection('animate-section-in');
    }
    setActiveTabState(tabId);
    window.location.hash = tabId;
  };

  const handleTouchStart = (e) => {
    if (isMobile && activeTab !== 'privacy') {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e) => {
    if (isMobile && activeTab !== 'privacy') {
      const touchEndX = e.changedTouches[0].clientX;
      const swipeDistance = touchEndX - touchStartX;

      const navigableTabs = NAV_TABS.filter(tab => tab.id !== 'privacy');
      const currentIndex = navigableTabs.findIndex(tab => tab.id === activeTab);

      if (swipeDistance > SWIPE_THRESHOLD && currentIndex > 0) {
        setActiveTab(navigableTabs[currentIndex - 1].id, 'swipe');
      } else if (swipeDistance < -SWIPE_THRESHOLD && currentIndex < navigableTabs.length - 1) {
        setActiveTab(navigableTabs[currentIndex + 1].id, 'swipe');
      }
    }
  };

  const components = {
    about: <About showSection={setActiveTab} />,
    journey: <Journey setAppWinAnimation={setShowFullPageWinAnimation} />,
    resume: <Resume />,
    contact: <Contact />,
    privacy: <PrivacyPolicy setActiveTab={setActiveTab} />
  };

  const currentYear = new Date().getFullYear();

  return (
    <>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main
        className="container mx-auto max-w-3xl px-4 py-8 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div key={activeTab} className={transitionDirection}>
          {components[activeTab]}
        </div>
      </main>
      
      <footer className="w-full text-center py-4 text-gray-600 text-sm bg-white/75 backdrop-blur shadow-inner mt-auto">
        <div className={`flex flex-col items-center ${!isMobile ? 'md:flex-row md:justify-center' : ''}`}>
          <span>© {currentYear} - Crafted with ❤️ and lots of ☕</span>
          <span className="hidden md:inline-block md:mx-2">|</span>
          <button
            onClick={() => setActiveTab('privacy', 'click')}
            className="text-blue-700 font-semibold hover:underline mt-1 md:mt-0"
          >
            Privacy Policy
          </button>
        </div>
      </footer>

      {showFullPageWinAnimation && <WinAnimationOverlay />}
      
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-4 right-4 z-50 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-full p-3 shadow-lg transition-opacity duration-500"
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </>
  );
}

// ===========================
// Initialize App
// ===========================
ReactDOM.render(<App />, document.getElementById('root'));

// IP logger (moved from HTML)
fetch("https://ip-logger.madhavkataria000.workers.dev/").catch(console.error);
