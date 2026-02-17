
// ===========================
// Navbar Component
// ===========================
function Navbar({ activeTab, setActiveTab, isDark, onToggleTheme }) {
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

  const headerClasses = `${isDark ? 'bg-black/84' : 'bg-white/75'} backdrop-blur shadow sticky top-0 z-50 transition-all duration-300 ease-in-out ${
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
              ((tab.id === 'privacy') || (isMobile && tab.id === 'about')) ? null : (
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
            <li className="relative">
              <button
                className={`inline-flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 ${isDark ? 'text-amber-200 hover:text-amber-100 hover:bg-slate-900' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`}
                onClick={onToggleTheme}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M12 4.75a.75.75 0 0 1 .75.75v1.2a.75.75 0 0 1-1.5 0V5.5a.75.75 0 0 1 .75-.75Zm0 12.55a.75.75 0 0 1 .75.75v1.2a.75.75 0 0 1-1.5 0v-1.2a.75.75 0 0 1 .75-.75Zm7.25-5.3a.75.75 0 0 1 .75.75.75.75 0 0 1-.75.75h-1.2a.75.75 0 0 1 0-1.5h1.2ZM5.95 12a.75.75 0 0 1 0 1.5h-1.2a.75.75 0 0 1 0-1.5h1.2Zm10.11-5.36a.75.75 0 0 1 1.06 0l.85.85a.75.75 0 0 1-1.06 1.06l-.85-.85a.75.75 0 0 1 0-1.06Zm-9.19 9.19a.75.75 0 0 1 1.06 0l.85.85a.75.75 0 0 1-1.06 1.06l-.85-.85a.75.75 0 0 1 0-1.06Zm10.04 1.91a.75.75 0 0 1-1.06 0 .75.75 0 0 1 0-1.06l.85-.85a.75.75 0 1 1 1.06 1.06l-.85.85ZM7.72 7.49a.75.75 0 1 1-1.06-1.06l.85-.85a.75.75 0 0 1 1.06 1.06l-.85.85ZM12 8.25A3.75 3.75 0 1 1 8.25 12 3.75 3.75 0 0 1 12 8.25Z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M14.7 3.3a.75.75 0 0 1 .9.95 8.24 8.24 0 0 0 10.15 10.15.75.75 0 0 1 .95.9 9.76 9.76 0 1 1-11.99-11.99Z"/>
                  </svg>
                )}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
