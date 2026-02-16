
// ===========================
// Navbar Component
// ===========================
function Navbar({ activeTab, setActiveTab }) {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const [animateLogo, setAnimateLogo] = React.useState(false);
  const [isScrolledDown, setIsScrolledDown] = React.useState(false);
  const isScrolledDownRef = React.useRef(false);
  const rafIdRef = React.useRef(null);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    
    const handleScroll = () => {
      if (!isMobile) {
        if (isScrolledDownRef.current) {
          isScrolledDownRef.current = false;
          setIsScrolledDown(false);
        }
        return;
      }

      if (rafIdRef.current !== null) return;

      rafIdRef.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const compactOn = Math.max(90, SCROLL_DOWN_THRESHOLD + 20);
        const expandAtTop = 4;
        let nextIsCompact = isScrolledDownRef.current;

        // On mobile, avoid threshold ping-pong due dynamic browser chrome + header height changes.
        // Compact once user has clearly scrolled down, and only expand again very near absolute top.
        if (currentScrollY > compactOn) {
          nextIsCompact = true;
        } else if (currentScrollY <= expandAtTop) {
          nextIsCompact = false;
        }

        if (nextIsCompact !== isScrolledDownRef.current) {
          isScrolledDownRef.current = nextIsCompact;
          setIsScrolledDown(nextIsCompact);
        }

        rafIdRef.current = null;
      });

      if (window.scrollY <= 1 && isScrolledDownRef.current) {
        isScrolledDownRef.current = false;
        setIsScrolledDown(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isMobile]);

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
    isMobile && isScrolledDown ? 'logo-text-compact' : 'logo-text-expanded'
  }`;

  return (
    <header className={headerClasses}>
      <div className={mainContentWrapperClasses}>
        <span className={logoFrameClasses} onClick={handleLogoClick}>
          <img
            src="assets/images/logoo.webp"
            alt="Madhav Kataria"
            className="h-6 sm:h-8 w-auto inline-block mr-2 -mt-[0.1rem]"
          />
          <span className={logoTextClasses}>Madhav Kataria</span>
        </span>
        <nav className={`w-full ${isMobile && isScrolledDown ? 'block' : 'block md:block'} md:w-auto`}>
          <ul className="flex flex-row items-center gap-1 w-full justify-center">
            {NAV_TABS.map(tab => (
              (isMobile && (tab.id === 'privacy' || tab.id === 'about')) ? null : (
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
