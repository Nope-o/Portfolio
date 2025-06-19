// Define navigation tabs
const NAV_TABS = [
  { id: 'about', label: 'About' },
  { id: 'journey', label: 'Life Journey', mobileLabel: 'Life' }, // Journey tab will now house the game
  { id: 'resume', label: 'Resume', mobileLabel: 'Resume' },
  { id: 'contact', label: 'Contact', mobileLabel: 'Contact' },
  { id: 'privacy', label: 'Privacy Policy', mobileLabel: 'Privacy' }
];

/**
 * Navbar Component: Handles navigation, mobile responsiveness, and logo animation.
 * @param {object} props - Component props.
 * @param {string} props.activeTab - The currently active tab.
 * @param {function} props.setActiveTab - Function to set the active tab.
 */
function Navbar({ activeTab, setActiveTab }) {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const [animateLogo, setAnimateLogo] = React.useState(false); // State for logo animation
  const [isScrolledDown, setIsScrolledDown] = React.useState(false); // State for scroll detection for header
  const lastScrollY = React.useRef(0); // Ref to store last scroll position

  // Effect to handle window resize and scroll for header compact/detailed view
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const handleScroll = () => {
      if (isMobile) { // Only apply this behavior on mobile
        const currentScrollY = window.scrollY;

        // Define scroll thresholds for hysteresis to prevent flickering
        const scrollDownThreshold = 80; // User scrolls down past this to become compact
        const scrollUpThreshold = 60; // User scrolls up past this to revert to expanded

        // Only change state if scrolling past a threshold AND the state is different
        if (currentScrollY > lastScrollY.current && currentScrollY > scrollDownThreshold && !isScrolledDown) {
          setIsScrolledDown(true);
        } else if (currentScrollY < lastScrollY.current && currentScrollY < scrollUpThreshold && isScrolledDown) {
          setIsScrolledDown(false);
        }
        lastScrollY.current = currentScrollY;
      } else {
        // Ensure it's never compact on desktop
        setIsScrolledDown(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    // Initial check on mount
    handleResize();
    handleScroll(); // Call once on mount to set initial state

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile, isScrolledDown]); // Added isScrolledDown to dependency array for reliable updates

  // Handle logo click to trigger animation and navigate to About section
  const handleLogoClick = () => {
    setAnimateLogo(true); // Trigger animation
    setTimeout(() => setAnimateLogo(false), 1000); // Reset after 1 second
    setActiveTab('about', 'click'); // Navigate to About section
  };

  // Determine header classes based on scroll state for mobile
  const headerClasses = `bg-white/75 backdrop-blur shadow sticky top-0 z-50 transition-all duration-300 ease-in-out
                         ${isMobile && isScrolledDown ? 'header-compact' : 'header-expanded'}`;

  // Conditional classes for the main content wrapper (logo and nav)
  const mainContentWrapperClasses = `container mx-auto px-4 md:px-8
                                     flex ${isMobile && isScrolledDown ? 'flex-row items-center justify-between py-2' : 'flex-col items-center justify-center py-3 md:flex-row md:justify-between md:items-center'}`;

  // Conditional classes for logo frame
  const logoFrameClasses = `logo-frame group cursor-pointer select-none
                            ${isMobile && isScrolledDown ? 'flex-shrink-0' : 'w-full text-center mb-4 md:w-auto md:text-left md:mb-0'}
                            ${animateLogo ? "logo-burst" : ""}`;

  // Conditional classes for logo text
  const logoTextClasses = `logo-text group-hover:tracking-widest transition-all
                           ${isMobile && isScrolledDown ? 'hidden' : ''}`; // Hidden when compact

  // Conditional classes for navigation container
  const navContainerClasses = `w-full ${isMobile && isScrolledDown ? 'block' : 'block md:block'} md:w-auto`;

  // Conditional classes for navigation list
  const navListClasses = `flex flex-row items-center gap-1 w-full
                          ${isMobile && isScrolledDown ? 'justify-end' : 'justify-center'}`; // Tabs to right on compact, centered otherwise

  return (
    <header className={headerClasses}>
      <div className={mainContentWrapperClasses}>
        <span
          className={logoFrameClasses}
          onClick={handleLogoClick}
        >
          <img
            src="logoo.webp"
            alt="Madhav Kataria"
            className="h-6 sm:h-8 w-auto inline-block mr-2 -mt-[0.1rem]"
          />
          <span className={logoTextClasses}>Madhav Kataria</span>
          <span className="absolute -top-3 -right-6 hidden md:inline-block animate-bounce text-2xl text-blue-900">★</span>
        </span>
        <nav className={navContainerClasses}>
          <ul className={navListClasses}>
            {NAV_TABS.map(tab => (
              (isMobile && tab.id === 'privacy') ? null : (
                <li key={tab.id} className="relative">
                  <button
                    className={"nav-link" + (activeTab === tab.id ? " active" : "") + " px-3 py-2 rounded-md transition-all duration-300"}
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

/**
 * About Component: Displays introductory information about Madhav Kataria.
 * @param {object} props - Component props.
 * @param {function} props.showSection - Function to navigate to a specific section.
 */
function About({ showSection }) {
  return (
    <section className="about-bg p-8 rounded-3xl shadow-2xl mb-10 relative overflow-hidden" style={{ minHeight: '60vh' }}>
      <div className="relative z-10 flex about-flex-mobile md:flex-row flex-col items-center md:items-start space-y-6 md:space-y-0 md:space-x-10">
        <div className="flex-shrink-0 flex flex-col items-center md:items-start about-photo-mobile">
          <div className="about-photo-bg mb-3 mt-2 shadow-lg hover:scale-105 transition-transform duration-500">
            <img src="Madhav-kataria.webp" alt="Madhav Kataria" className="rounded-full w-40 h-40 object-cover shadow-xl border-4 border-white" />
          </div>
        </div>
        <div className="flex-grow about-text-mobile">
          <h2 className="text-4xl font-extrabold about-main-title mb-3 tracking-tight drop-shadow-sm">
            Hello, I'm <span>Madhav Kataria!</span>
          </h2>
          <p className="text-lg text-gray-100 leading-relaxed mb-2 card-float-in">
            Currently pursuing Bachelor's in Data Science and AI from IIT Guwahati.
          </p>
          <p className="text-lg text-gray-200 leading-relaxed mb-3 card-float-in">
            I am a passionate and results-driven professional with expertise in <strong className="about-strong">Robotic Process Automation (RPA), Power Platform development (Power Apps, Power BI), and IT Infrastructure management</strong>. My journey is driven by a desire to <strong className="about-strong">build innovative solutions that enhance efficiency and reduce human errors</strong>, and continuously learn and grow. I thrive on challenges and am always seeking new opportunities to make a meaningful impact.
          </p>
          <p className="text-md text-gray-300 mb-3 card-float-in">
            My unique value proposition lies in my ability to <strong className="about-strong">leverage AI, Data insights and automation to optimize organizational processes, specifically in the IT Infra Domain</strong>. I am motivated by <strong className="about-strong">solving complex problems, fostering collaborative environments, and pushing creative boundaries to deliver tangible improvements.</strong>
          </p>
          <div className="space-y-2 mb-6 card-float-in">
            <h3 className="text-xl font-semibold about-value">My Values:</h3>
            <ul className="list-disc list-inside text-gray-200">
              <li>Innovation &amp; Continuous Learning</li>
              <li>Collaboration &amp; Teamwork</li>
              <li>Integrity &amp; Transparency</li>
              <li>User-Centric Approach</li>
            </ul>
          </div>
          <button onClick={() => showSection('contact', 'click')}
            className="bg-gradient-to-r from-sky-900 to-blue-950 hover:from-blue-800 hover:to-blue-900 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 pulse"
          >
            Get in Touch!
          </button>
        </div>
      </div>
    </section>
  );
}

// Initialize Tone.js instruments for sound effects
const winSynth = new Tone.PolySynth(Tone.Synth, {
  envelope: {
    attack: 0.02,
    decay: 0.1,
    sustain: 0.1,
    release: 0.5,
  },
}).toDestination();

const loseSynth = new Tone.NoiseSynth({
  envelope: {
    attack: 0.01,
    decay: 0.2,
    sustain: 0,
    release: 0.3,
  },
}).toDestination();

// New: Synth for movement sound
const moveSynth = new Tone.MembraneSynth({
  pitchDecay: 0.02,
  octaves: 2,
  envelope: {
    attack: 0.001,
    decay: 0.1,
    sustain: 0,
    release: 0.05,
  },
}).toDestination();

// Function to play a winning sound
function playWinSound() {
  // Ensure Tone.js is started (required for sound to play)
  if (Tone.context.state !== 'running') {
    Tone.start();
  }
  // Play a triumphant arpeggio
  winSynth.triggerAttackRelease(["C5", "E5", "G5", "C6"], "8n");
}

// Function to play a losing sound
function playLoseSound() {
  // Ensure Tone.js is started
  if (Tone.context.state !== 'running') {
    Tone.start();
  }
  // Play a short, discordant noise
  loseSynth.triggerAttackRelease("4n");
}

// New: Function to play a movement sound
function playMoveSound() {
  // Ensure Tone.js is started
  if (Tone.context.state !== 'running') {
    Tone.start();
  }
  // Play a subtle percussive sound
  moveSynth.triggerAttackRelease("C2", "16n");
}


/**
 * PathfinderGame Component: Implements a simple grid-based pathfinding game.
 * Players navigate a grid, avoiding obstacles to reach a destination.
 * @param {object} props - Component props.
 * @param {function} props.onGameWin - Callback function when the game is won.
 */
function PathfinderGame({ onGameWin }) {
  const GRID_SIZE = 7; // Increased grid size for more challenge
  const [board, setBoard] = React.useState([]);
  const [playerPos, setPlayerPos] = React.useState({ row: 0, col: 0 });
  const [endPos, setEndPos] = React.useState({ row: 0, col: 0 });
  const [gameStatus, setGameStatus] = React.useState('loading'); // 'loading', 'playing', 'won', 'lost'
  const [isBoardInitialized, setIsBoardInitialized] = React.useState(false); // New state to confirm board is ready
  const [playerOrientation, setPlayerOrientation] = React.useState('right'); // 'right' or 'left'

  // Refs to hold the *latest* state values for the event listener (to avoid stale closures)
  const playerPosRef = React.useRef(playerPos);
  const boardRef = React.useRef(board);
  const gameStatusRef = React.useRef(gameStatus);

  // Update refs whenever the state changes
  React.useEffect(() => { playerPosRef.current = playerPos; }, [playerPos]);
  React.useEffect(() => { boardRef.current = board; }, [board]);
  React.useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);

  // Function to move the player based on direction
  const movePlayer = React.useCallback((direction) => {
    if (gameStatusRef.current !== 'playing') return;

    let newRow = playerPosRef.current.row;
    let newCol = playerPosRef.current.col;
    let currentOrientation = playerOrientation; // Keep current orientation by default

    switch (direction) {
      case 'up': newRow--; break;
      case 'down': newRow++; break;
      case 'left': newCol--; currentOrientation = 'left'; break;
      case 'right': newCol++; currentOrientation = 'right'; break;
      default: return;
    }

    // Check boundaries
    if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
      // Check for obstacle
      if (boardRef.current[newRow][newCol] === 'X') {
        setGameStatus('lost');
        playLoseSound(); // Play lose sound when hitting obstacle
      } else {
        setPlayerPos({ row: newRow, col: newCol });
        setPlayerOrientation(currentOrientation); // Update player orientation
        playMoveSound(); // Play move sound on successful movement
      }
    }
  }, [playerOrientation]); // Added playerOrientation as a dependency

  // Function to generate a random board with start, end, and obstacles
  const generateBoard = React.useCallback(() => {
    setGameStatus('loading'); // Reset status to loading on board generation
    setIsBoardInitialized(false); // Mark board as not initialized yet

    let newBoard = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(''));
    let startR, startC, endR, endC;

    // Ensure start and end are distinct AND sufficiently far apart
    do {
      startR = Math.floor(Math.random() * GRID_SIZE);
      startC = Math.floor(Math.random() * GRID_SIZE);
      endR = Math.floor(Math.random() * GRID_SIZE);
      endC = Math.floor(Math.random() * GRID_SIZE);
    } while (
      (startR === endR && startC === endC) || // Ensure start and end are different spots
      (Math.abs(startR - endR) + Math.abs(startC - endC) < Math.floor(GRID_SIZE / 2)) // Ensure minimum distance
    );

    newBoard[startR][startC] = 'S';
    newBoard[endR][endC] = 'E';

    // Add obstacles (around 20-30% of the cells, avoiding S and E)
    const numObstacles = Math.floor(GRID_SIZE * GRID_SIZE * 0.25);
    for (let i = 0; i < numObstacles; i++) {
      let r, c;
      do {
        r = Math.floor(Math.random() * GRID_SIZE);
        c = Math.floor(Math.random() * GRID_SIZE);
      } while (newBoard[r][c] !== ''); // Ensure obstacle is placed on an empty cell
      newBoard[r][c] = 'X';
    }

    setPlayerPos({ row: startR, col: startC });
    setEndPos({ row: endR, col: endC });
    setBoard(newBoard);
    setGameStatus('playing'); // Set game status to playing only after board is generated
    setIsBoardInitialized(true); // Mark board as initialized
    setPlayerOrientation('right'); // Reset player orientation on new game
  }, []);

  // Effect to initialize board when component mounts
  React.useEffect(() => {
    generateBoard();
  }, [generateBoard]); // generateBoard is memoized, so this runs once on mount

  // Effect for keyboard event listener (arrow keys)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isBoardInitialized || gameStatusRef.current !== 'playing') {
        return;
      }
      switch (e.key) {
        case 'ArrowUp': movePlayer('up'); break;
        case 'ArrowDown': movePlayer('down'); break;
        case 'ArrowLeft': movePlayer('left'); break;
        case 'ArrowRight': movePlayer('right'); break;
        default: return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isBoardInitialized, movePlayer]); // Depend on isBoardInitialized and memoized movePlayer

  // Effect to check win condition.
  React.useEffect(() => {
    if (isBoardInitialized && playerPos.row === endPos.row && playerPos.col === endPos.col && gameStatus === 'playing') {
      setGameStatus('won');
      playWinSound(); // Play win sound when reaching destination
      onGameWin();
    }
  }, [playerPos, endPos, gameStatus, onGameWin, isBoardInitialized]);

  // Show loading message until the board is initialized
  if (gameStatus === 'loading' || !isBoardInitialized) {
    return (
      <section className="relative bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-white p-8 rounded-3xl shadow-2xl mb-10 max-w-xl mx-auto text-center flex flex-col items-center"> {/* Removed minHeight */}
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight drop-shadow-sm">Pathfinder's Puzzle</h2>
        <p className="text-gray-700 mb-6">Loading game... Please wait.</p>
      </section>
    );
  }

  const playerEmoji = '👻'; // Ghost emoji as the character

  return (
    <section className="relative bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-white p-8 rounded-3xl shadow-2xl mb-10 max-w-xl mx-auto text-center flex flex-col items-center"> {/* Removed minHeight */}
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight drop-shadow-sm">Pathfinder's Puzzle</h2>
      <p className="text-gray-700 mb-6">Navigate the board to reach the destination. Use **Arrow Keys** or **Swipe** to move!</p>

      <div className="game-grid mb-6">
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
                <div key={cIdx} className={`${cellClass}`}>
                  {isPlayer ? (
                    <span className={`${playerOrientation === 'left' ? 'player-face-left' : ''}`}>
                      {playerEmoji}
                    </span>
                  ) : (isStart ? '🏠' : (isEnd ? '🏁' : (isObstacle ? '🚧' : '')))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {gameStatus === 'won' && (
        <div className="game-message won-message">
          Congratulations! You've found your path!
        </div>
      )}
      {gameStatus === 'lost' && (
        <div className="game-message lost-message">
          Oops! You hit an obstacle. Try again!
        </div>
      )}

      {/* Mobile-only controls container */}
      {/* Changed to be flex-col and mb-6 to push it further down */}
      <div className="flex flex-col items-center px-4 md:hidden w-full mb-6">
        {/* Reset button */}
        <button
          onClick={generateBoard}
          className="control-button-mobile bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-full font-semibold shadow-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-300 pulse mb-4" {/* Added mb-4 for spacing */}
        >
          {gameStatus === 'playing' ? 'Reset' : 'Play Again'}
        </button>

        {/* Directional buttons */}
        <div className="grid grid-rows-2 grid-cols-3 gap-1 w-40">
          {/* Row 1 */}
          <div></div> {/* Empty block 1 */}
          <button onClick={() => movePlayer('up')} className="control-button-directional bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-lg w-full">↑</button> {/* Block 2: Up */}
          <div></div> {/* Empty block 3 */}

          {/* Row 2 */}
          <button onClick={() => movePlayer('left')} className="control-button-directional bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-lg">←</button> {/* Block 4: Left */}
          <button onClick={() => movePlayer('down')} className="control-button-directional bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-lg w-full">↓</button> {/* Block 5: Down */}
          <button onClick={() => movePlayer('right')} className="control-button-directional bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-lg">→</button> {/* Block 6: Right */}
        </div>
      </div>

      {/* Desktop Reset button - visible only on desktop */}
      <button
        onClick={generateBoard}
        className="mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-6 rounded-full font-semibold shadow-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-300 pulse hidden md:block"
      >
        {gameStatus === 'playing' ? 'Reset Game' : 'Play Again'}
      </button>
    </section>
  );
}

/**
 * WinAnimationOverlay Component: Displays a full-page animation when the game is won.
 */
function WinAnimationOverlay() {
  return (
    <div className="win-overlay-container">
      <div className="win-message-box animate-win-reveal">
        <span className="text-6xl animate-pulse-emoji">🎉</span>
        <h3 className="text-4xl font-extrabold text-blue-900 mt-4">You Won!</h3>
        <p className="text-xl text-gray-700 mt-2">The path to knowledge is now open.</p>
        <span className="text-6xl animate-pulse-emoji">🎉</span>
      </div>
      {/* Firecracker effects */}
      <div className="firecracker firecracker-1"></div>
      <div className="firecracker firecracker-2"></div>
      <div className="firecracker firecracker-3"></div>
      <div className="firecracker firecracker-4"></div>
      <div className="firecracker firecracker-5"></div>
    </div>
  );
}

/**
 * Journey Component: Displays a timeline of life experiences or the Pathfinder game.
 * @param {object} props - Component props.
 * @param {function} props.setAppWinAnimation - Function to control the full-page win animation.
 */
function Journey({ setAppWinAnimation }) { // Receive setAppWinAnimation prop
  const [showDetails, setShowDetails] = React.useState({});
  // New state to control whether the game or the journey timeline is shown
  const [gameWon, setGameWon] = React.useState(false); // Initial state: game not yet won

  // Reset gameWon state and win animation state when Journey component mounts
  React.useEffect(() => {
    setGameWon(false);
  }, []); // Empty dependency array means this runs once on mount

  const toggleDetails = (index) => {
    setShowDetails(prev => ({
      ...prev,
      [index]: !prev[index] // This toggles the state, so clicking an open tab will close it
    }));
  };

  const handleGameWin = () => {
    setAppWinAnimation(true); // Show the full-page animation
    setTimeout(() => {
      setAppWinAnimation(false); // Hide animation after some time
      setGameWon(true); // Then reveal the journey
    }, 2000); // 2 seconds for the animation to play
  };

  // Timeline items data
  const timelineItems = [
    {
      title: "Started Bachelor's Degree at IIT Guwahati",
      time: "Year of Enrollment - Present",
      desc: "Began my Bachelor's in Data Science and AI from IIT Guwahati, diving deep into cutting-edge technologies and foundational concepts.",
      fullDesc: `Commenced a rigorous Bachelor's program in Data Science and AI at IIT Guwahati, one of India's premier technical institutions. This program has provided a strong foundation in algorithms, machine learning, artificial intelligence, and data analytics. Actively involved in various academic projects and research initiatives, exploring advanced topics and developing practical skills in data manipulation, model building, and system optimization. My coursework includes subjects like advanced statistics, deep learning, natural language processing, and big data technologies, preparing me for a career at the forefront of data innovation.`,
      logoUrl: "IITG_logo.webp"
    },
    {
      title: "Training at HCL TechBee Program",
      time: "Sept 2022 - Mar 2023",
      desc: "Completed intensive 6-month training focusing on Data Centre Operations, Linux CLI, networking, AWS, and basic programming.",
      fullDesc: `Underwent comprehensive 6-month training through the HCL TechBee Program, designed to equip me with essential IT skills. The curriculum covered Data Centre Operations, providing insights into managing and maintaining critical IT infrastructure. Gained practical experience with Linux CLI, network configuration, and DHCP/IP setup. Acquired fundamental knowledge in networking concepts using Cisco VLANs, routing protocols, and SSH. Understood Windows Server administration, including Active Directory and RAID setup. Received hands-on training in Amazon Web Services (AWS), focusing on cloud services like EC2, S3, and VPC, and Elastic Beanstalk. Additionally, I was introduced to basic programming concepts in Python, C, SQL, and Oracle, laying a strong foundation for future development roles. This program fostered a practical, problem-solving approach to IT challenges.`,
      logoUrl: "hcl.webp"
    },
    {
      title: "Internship at HCL - Technical Support Engineer",
      time: "Mar 2023 - Sept 2023",
      desc: "Served as Technical Support Engineer for Ericsson Global Organization, achieving high resolve counts and contributing to knowledge base articles.",
      fullDesc: `Worked as a Technical Support Engineer intern for Ericsson Global Organization, providing first-line and second-line support for complex technical issues. My responsibilities included diagnosing and resolving hardware and software problems, troubleshooting network connectivity, and assisting users with various IT-related queries. Consistently achieved high resolve count and received user satisfaction certificates, demonstrating effective problem-solving skills. Received recognition from the Global Quality and Process Head at Ericsson for contributions. Actively contributed to the internal knowledge base by drafting detailed technical articles for new technologies and solutions, improving efficiency for the support team and self-service options for users. Participated in the Skill India platform under managerial guidance, showcasing technical abilities in a competitive environment.`,
      logoUrl: "ericsson.webp"
    },
    {
      title: "Full-Time Role & Automation Specialist",
      time: "Sept 2023 - Present",
      desc: "Transitioned to a full-time role, focusing on automation with Power Apps and Power Automate, and developing Power BI reports.",
      fullDesc: `Transitioned into a full-time role as a Technical Support Engineer and Automation Specialist. A significant portion of my role involves developing and implementing automation solutions using Microsoft Power Platform. This includes creating robust applications with Power Apps to streamline business processes, automating repetitive tasks with Power Automate flows, and designing interactive Power BI reports to provide data-driven insights. I am responsible for identifying automation opportunities, gathering requirements from stakeholders, and delivering solutions that enhance operational efficiency, reduce manual effort, and improve accuracy across various IT infrastructure domains. I collaborate closely with cross-functional teams to ensure seamless integration and deployment of automation initiatives. Developed an attendance tracker application on the Power Apps platform to streamline project resource management. Implemented automated data archiving processes, including duplication removal, improving data integrity. Created a KBA-review application and Power BI reports to enhance knowledge management and data-driven insights. Developed scripts for browser cache and cookies management to improve system performance and user experience.`,
      logoUrl: "hcl.webp"
    },
    {
      title: "Developed Key Power Platform Applications",
      time: "Ongoing",
      desc: "Successfully developed and deployed the Attendance Tracker and KBA Review applications, significantly improving operational efficiency.",
      fullDesc: `Led the development and deployment of critical applications using the Microsoft Power Platform, resulting in significant operational improvements. The 'Attendance Tracker' application, built with Power Apps and Power Automate, centralized resource management, tracked daily attendance, calculated absenteeism percentage calculation by role/location/Manager, automated data archiving using Power Automate, automated correction of incorrect attendance records, and real-time Power BI reporting and analytics. Technologies used: Power Apps, Power BI, Power Automate, SharePoint.

The 'KBA Review' application, also on Power Apps, transformed knowledge article quality management. It enabled structured reviews, integrated Gen-AI Bot optimization formatting, automated dynamic email notifications to L2 teams, and facilitated a ticketing tool-like workflow for knowledge base article updates. This includes a knowledge article quality review system, Gen-AI Bot optimization formatting, dashboards to track ongoing activities, automated dynamic email system to different L2 teams after KBA review, automated assignment to L2 groups, automated feedback to SD when changes are completed, and ticketing tool-like workflow management. Technologies used: Power Apps, Power BI, Power Automate, AI Integration.

Both projects involved end-to-end development, from requirements gathering to deployment and post-launch support, demonstrating my ability to deliver high-impact solutions. Leveraging the Microsoft Power Platform to automate processes and provide data-driven solutions for HCL and Ericsson: developed tools for attendance tracking with role-based access and automated shift reminders; integrated Power Apps with ticketing systems to streamline workflows; created and delivered data reports using Power BI for Mondelez EUC and EUC Tech departments, providing valuable insights.`,
      logoUrl: "hcl.webp"
    },
    {
      title: "Recognized for Automation & Quality",
      time: "Ongoing",
      desc: "Received multiple HCL certificates and client appreciation for automation, reports, highest resolve count and user satisfaction, with work recognized by Ericsson's Global Quality Head.",
      fullDesc: `Consistently recognized for outstanding contributions to automation and quality initiatives. Received various motivating certificates by HCL including the certificate for Automation and creating Power BI Reports, developing applications using Power Apps and USATs etc. Consistently achieved the highest resolve count among peers and garnered widespread user satisfaction, evidenced by over 50 positive client feedback instances. My work has been specifically acknowledged by the Global Quality and Process Head of Ericsson, highlighting the significant impact of my automation efforts on their global operations. Additionally, I contributed to drafting numerous useful Knowledge-Based Articles (KBAs), further enhancing knowledge management. I was also proud to represent at the State Level for Cloud Computing at Skill India in Bangalore, showcasing my technical expertise. Recognized Performing Artist on All India Radio (Nationally Broadcasted).`,
      logoUrl: "ericsson.webp"
    }
  ];

  return (
    <section className="bg-gradient-to-br from-indigo-50/70 via-blue-50/70 to-white p-7 rounded-3xl shadow-2xl mb-10">
      <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2 tracking-tight drop-shadow-sm">My Life Journey &amp; Experiences</h2>

      {!gameWon ? (
        // Render the game if not won yet
        <PathfinderGame onGameWin={handleGameWin} />
      ) : (
        // Render the journey content if game is won
        <>
          <p className="text-center text-gray-800 text-lg mb-6 font-semibold animate-section-in">
            Congratulations on navigating the puzzle! It seems you've mastered the art of finding a path. Now, allow me to share the journey I've walked.
          </p>
          <p className="text-center text-gray-700 mb-6">Explore the significant milestones, professional growth, and personal experiences that have shaped my journey.</p>
          <div className="mt-10">
            <h3 className="text-xl font-bold text-blue-950 mb-2">Timeline....</h3>
            <ol className="timeline-list">
              {timelineItems.map((item, i) => (
                <li key={i} className="timeline-item">
                  <span className="timeline-dot">{i + 1}</span>
                  <div className="flex-1">
                    <div className="timeline-content cursor-pointer flex justify-between items-start" onClick={() => toggleDetails(i)}>
                      <div className="flex-grow">
                        <h4 className="font-bold text-slate-800">{item.title}</h4>
                        <span className="block text-gray-500 text-xs mb-1">{item.time}</span>
                        <p className="text-slate-700">{item.desc}</p>
                      </div>
                      {item.logoUrl && (
                        <img src={item.logoUrl} alt={`${item.title} logo`} className="w-10 h-10 object-contain ml-4 mt-1 flex-shrink-0" onError="this.onerror=null;this.src='https://placehold.co/40x40/f1f5f9/1e293b?text=Logo';" />
                      )}
                      {/* New indicator arrow at the bottom-right */}
                      {!showDetails[i] && (
                        <div className="absolute bottom-2 right-2"> {/* Positioned at bottom-right */}
                          <svg className="w-6 h-6 text-gray-400 animate-bounce-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7-7-7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Added onClick to timeline-details as well */}
                    <div className={`timeline-details mt-2${showDetails[i] ? ' open' : ''}`} onClick={() => toggleDetails(i)}>
                      {showDetails[i] && (
                        <p>{item.fullDesc}</p>
                      )}
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

/**
 * Resume Component: Displays resume content and provides a download option.
 */
function Resume() {
  function downloadResume() {
    const element = document.getElementById('resume-content');
    if (!element) return;
    const opt = {
      margin: 0.3,
      filename: 'Madhav_Kataria_Resume.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: "#fff" },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  }
  return (
    <section className="bg-white p-7 rounded-3xl shadow-2xl mb-10 relative"> {/* Added relative positioning here */}
      <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-6 tracking-tight drop-shadow-sm">Resume</h2>
      {/* Download button moved to top right corner */}
      <div className="absolute top-4 right-4">
        <button onClick={downloadResume} className="text-blue-700 font-semibold text-sm hover:underline flex items-center">
          Download
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
      <div id="resume-content" className="card-float-in mb-6 bg-gradient-to-br from-slate-100 via-gray-50 to-white rounded-xl p-6 shadow-md">
        <div className="text-lg font-semibold text-gray-800 mb-2">Professional Summary</div>
        <p className="text-gray-700 mb-2">Currently pursuing a Bachelor’s in <strong>Data Science and Artificial Intelligence from IIT Guwahati</strong>, offering a solid academic grounding in analytics and machine learning alongside practical industry exposure.
          Have nearly <strong>3 years</strong> of experience at <strong>HCL Technologies</strong>, including work as a supplier to <strong>Ericsson Global</strong>, delivering end-to-end solutions in RPA using <strong>Microsoft Power Automate</strong>, custom business applications via <strong>Power Apps</strong>, and enterprise-grade dashboards and reports with <strong>Power BI</strong>.</p>
        <p className="text-gray-700 mb-2">Demonstrated ability to analyze complex organizational data within the IT Infrastructure domain, with a consistent focus on identifying patterns, improving processes, and monitoring SLA and KPI performance.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <h3 className="font-bold text-lg text-blue-900 mb-2">Core Expertise</h3>
            <ul className="list-disc ml-6 text-gray-700">
              <li>Experience in Developing RPA (Robotic Process Automation) using Microsoft Power Automate Platform</li>
              <li>Experience in Developing Custom Applications via Power Apps Platform to make the process efficient and reduce human errors</li>
              <li>Experience in Developing industry level Power BI Reports and Dashboards</li>
              <li>Experience in Analyzing and understanding Organizational Data specifically in IT Infra Domain and tracking trends affecting targets (SLAs, KPIs etc)</li>
            </ul>
            <h3 className="font-bold text-lg text-blue-900 mt-5 mb-2">Certifications</h3>
            <ul className="list-disc ml-6 text-gray-700">
              <li>
                <a href="https://www.credly.com/badges/513343d0-0d83-4761-9916-f6324436d81f/public_url" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Google Cloud Associate Certificate</a>
              </li>
              <li>
                <a href="https://learn.microsoft.com/api/credentials/share/en-us/MadhavKataria-2316/FBC420B1E155F51?sharingId=D371C6433FF7895E" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Microsoft Certified: Azure Fundamentals</a>
              </li>
              <li>
                <a href="https://learn.microsoft.com/api/credentials/share/en-us/MadhavKataria/ADFE157B160ACCDB?sharingId=D371C6433FF7895E" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Microsoft Certified: Azure Data Fundamentals</a>
              </li>
              <li>
                <a href="https://learn.microsoft.com/api/credentials/share/en-us/MadhavKataria/4A3C78C162C56208?sharingId=D371C6433FF7895E" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Microsoft Certified: Azure AI Fundamentals</a>
              </li>
              <li>IIT Workshops: AI, Cybersecurity, Machine Learning.</li>
              <li>Various motivating certificates from HCL-Tech including the certificate for Automation and creating Power BI Reports, developing applications using Power Apps and USATs etc.</li>
              <li>CBSE Certificate: Full Marks in Information Technologies (2018).</li>
              <li>Innovation: Certificate for innovation from the govt of india</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg text-blue-900 mb-2">Technical Skills</h3>
            <div className="mb-4">
              <div className="font-semibold">Machine Learning &amp; AI</div>
              <div className="text-gray-600 text-sm mb-1">Good knowledge of training ML models via Python libraries like "pandas", "Scikit-learn", and "NumPy". Building Custom AI bots using Different APIs.</div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">Python</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">Pandas</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">Scikit-learn</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">NumPy</span>
              </div>
              <div className="font-semibold">Cloud Computing</div>
              <div className="text-gray-600 text-sm mb-1">Good knowledge Cloud Computing on platforms like AWS, Azure and GCP (EC2, VPC, AWS Elastic Beanstalk, CloudWatch, EC2 Auto Scaling, Elastic Load Balancing, AWS IAM, LAMBDA, S3 buckets).</div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">AWS</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">Azure</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">GCP</span>
              </div>
              <div className="font-semibold">Data Centre Operations</div>
              <div className="text-gray-600 text-sm mb-1">Switching-VLAN, trunking, inter VLAN routing, MLS-SVI, port security, VTP, STP, RSTP. Routing- static, Dynamic, RIP V2, OSPF, DHCP server, SSH, Telnet, CHAP, PAP, Access List.</div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">Cisco Packet Tracer</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">Switching</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">Routing</span>
              </div>
              <div className="font-semibold">System Administration</div>
              <div className="text-gray-600 text-sm mb-1">Good knowledge of troubleshooting Office 365, SharePoints, File systems, Citrix, MFA etc with OS including Linux, Windows and MAC.</div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">Office 365</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">Linux</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">MacOS</span>
                <span className="bg-blue-900 text-sky-100 px-2 py-0.5 rounded-full text-xs">Windows</span>
              </div>
            </div>
            <h3 className="font-bold text-lg text-blue-900 mt-5 mb-2">Achievements &amp; Recognition</h3>
            <ul className="list-disc ml-6 text-gray-700">
              <li>Self-volunteered appreciation from clients. Proud to have 50+ such positive feedback</li>
              <li>Work recognized by the Global Quality and Process head of Ericsson</li>
              <li>Contributed to drafting useful Knowledge Based Articles (KBA)</li>
              <li>Represented at State Level for Cloud Computing at Skill India (Bangalore)</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Contact Component: Provides a contact form and direct contact links.
 */
function Contact() {
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Handle form submission
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
        headers: {
          Accept: "application/json"
        },
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
        This isn’t just a form — it’s the start of a good conversation. &nbsp; <span className="text-4xl animate-bounce">😉</span>
      </p>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1 font-semibold text-gray-700">Your Name</label>
          <input name="name" required className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-700 transition bg-white/90" type="text" />
        </div>
        <div>
          <label className="block mb-1 font-semibold text-gray-700">Your Email</label>
          <input name="email" required className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-700 transition bg-white/90" type="email" />
        </div>
        <div>
          <label className="block mb-1 font-semibold text-gray-700">Message</label>
          <textarea name="message" required className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-700 transition bg-white/90" rows="4" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-full font-semibold shadow-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-300 pulse disabled:opacity-70 disabled:cursor-not-allowed"
        >{loading ? "Sending..." : "Send Message"}</button>
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

/**
 * PrivacyPolicy Component: Displays the privacy policy details.
 * @param {object} props - Component props.
 * @param {function} props.setActiveTab - Function to set the active tab (for back navigation).
 */
function PrivacyPolicy({ setActiveTab }) { // Added setActiveTab prop
  // Get current date for "Effective Date"
  const effectiveDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const yourName = "Madhav Kataria"; // Replaced with your name
  const yourWebsiteName = "Madhav Kataria - Personal Website"; // Replaced with your website name
  const yourDomain = "madhav-kataria.site"; // Replaced with your actual domain
  const contactEmail = "contact.madhavkataria@gmail.com"; // Replaced with your contact email

  return (
    <section className="bg-white p-8 rounded-3xl shadow-2xl mb-10 mx-auto max-w-2xl relative"> {/* Added relative for positioning back button */}
      {/* Back button */}
      <button
        onClick={() => setActiveTab('about', 'click')} /* Pass 'click' origin */
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
        Thank you for visiting {yourWebsiteName} ("we", "our", or "us"). Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect information when you use our website, {yourDomain} (the "Site").
      </p>

      <div className="border-t border-gray-300 my-6"></div>

      <h3 className="text-2xl font-bold text-gray-800 mb-4">1. Information We Collect</h3>
      <p className="text-gray-700 mb-4">
        When you visit our Site, we may automatically collect certain information about your visit, including your IP address. This is done through basic scripts and is used solely for analytics or security purposes.
      </p>
      <p className="text-700 mb-4">We do not collect:</p>
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
      <p className="text-gray-700 mb-4">
        This information is not shared with third parties and is only accessible to us.
      </p>

      <div className="border-t border-gray-300 my-6"></div>

      <h3 className="text-2xl font-bold text-gray-800 mb-4">3. Cookies and Tracking</h3>
      <p className="text-gray-700 mb-4">
        We do not use cookies or similar tracking technologies on this website. Your device does not store any data from our site beyond standard browser caching.
      </p>

      <div className="border-t border-gray-300 my-6"></div>

      <h3 className="text-2xl font-bold text-gray-800 mb-4">4. Data Sharing</h3>
      <p className="text-gray-700 mb-4">
        We do not share, sell, or rent your data to anyone. The information is kept secure and used strictly for internal, non-commercial purposes.
      </p>

      <div className="border-t border-gray-300 my-6"></div>

      <h3 className="text-2xl font-bold text-gray-800 mb-4">5. Data Retention</h3>
      <p className="text-gray-700 mb-4">
        IP addresses and related metadata may be stored temporarily (e.g., in server logs) and are deleted or anonymized after a reasonable period unless needed for security or technical analysis.
      </p>

      <div className="border-t border-gray-300 my-6"></div>

      <h3 className="text-2xl font-bold text-gray-800 mb-4">7. Contact Us</h3>
      <p className="text-gray-700 mb-4">
        If you have questions about this Privacy Policy, contact: <a href={`mailto:${contactEmail}`} className="text-blue-700 hover:underline">{contactEmail}</a>
      </p>
    </section>
  );
}

/**
 * App Component: The main application component that manages tabs and global animations.
 */
function App() {
  const [activeTab, setActiveTabState] = React.useState('about');
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  // New state for controlling animation direction
  const [transitionDirection, setTransitionDirection] = React.useState('animate-section-in');
  // New state for controlling full-page win animation
  const [showFullPageWinAnimation, setShowFullPageWinAnimation] = React.useState(false);


  // Effect to handle window resize for mobile view detection
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to scroll to top when active tab changes
  React.useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [activeTab]);

  /**
   * Custom setActiveTab function to control tab transitions and animations.
   * @param {string} tabId - The ID of the tab to activate.
   * @param {string} origin - The origin of the tab change ('click' or 'swipe').
   */
  const setActiveTab = (tabId, origin = 'click') => {
    // Swipe navigation for main tabs (excluding privacy)
    if (origin === 'swipe' && isMobile && tabId !== 'privacy') {
      const navigableTabs = NAV_TABS.filter(tab => tab.id !== 'privacy');
      const oldIndex = navigableTabs.findIndex(tab => tab.id === activeTab);
      const newIndex = navigableTabs.findIndex(tab => tab.id === tabId);

      if (newIndex > oldIndex) {
        setTransitionDirection('slide-in-right'); // Swiped left, new content slides in from right
      } else if (newIndex < oldIndex) {
        setTransitionDirection('slide-in-left'); // Swiped right, new content slides in from left
      }
    } else {
      setTransitionDirection('animate-section-in'); // Default slide-up animation for clicks
    }
    setActiveTabState(tabId);
  };

  // Map of components for easier rendering
  const components = {
    about: <About showSection={setActiveTab} />,
    journey: <Journey setAppWinAnimation={setShowFullPageWinAnimation} />, // Pass the new prop
    resume: <Resume />,
    contact: <Contact />,
    privacy: <PrivacyPolicy setActiveTab={setActiveTab} />
  };

  return (
    <>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main
        className="container mx-auto max-w-3xl px-4 py-8 overflow-hidden" /* Re-added overflow-hidden to main */
      >
        {/* Conditional rendering with animation class and key for re-render */}
        <div key={activeTab} className={transitionDirection}>
          {components[activeTab]}
        </div>
      </main>
      <footer className="w-full text-center py-4 text-gray-600 text-sm bg-white/75 backdrop-blur shadow-inner mt-auto">
        © 2025 - Crafted with ❤️ and lots of ☕
        <span className="mx-2">|</span>
        <button onClick={() => setActiveTab('privacy', 'click')} className="text-blue-700 font-semibold hover:underline">Privacy Policy</button>
      </footer>
      {showFullPageWinAnimation && <WinAnimationOverlay />} {/* Render full-page animation here */}
    </>
  );
}

// Render the main App component into the 'root' div
ReactDOM.render(<App />, document.getElementById('root'));

// Fetch IP logger (moved from original HTML)
fetch("https://ip-logger.madhavkataria000.workers.dev/").catch(console.error);
