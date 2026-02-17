
// ===========================
// Navbar Component
// ===========================
const ENABLE_MOBILE_COMPACT_HEADER = false;

function Navbar({ activeTab, setActiveTab, isDark, onToggleTheme }) {
  const mobileQuery = '(max-width: 768px)';
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      return window.matchMedia(mobileQuery).matches;
    }
    return typeof window !== "undefined" ? window.innerWidth <= 768 : false;
  });
  const [animateLogo, setAnimateLogo] = React.useState(false);
  const [isScrolledDown, setIsScrolledDown] = React.useState(false);
  const isScrolledDownRef = React.useRef(false);
  const isMobileRef = React.useRef(isMobile);
  const rafIdRef = React.useRef(null);
  const logoTimerRef = React.useRef(null);
  const expandTimerRef = React.useRef(null);

  React.useEffect(() => {
    const subscribeMobileChanges = () => {
      if (typeof window.matchMedia !== "function") {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }

      const mediaQueryList = window.matchMedia(mobileQuery);
      const handleChange = (event) => setIsMobile(event.matches);
      setIsMobile(mediaQueryList.matches);

      if (typeof mediaQueryList.addEventListener === "function") {
        mediaQueryList.addEventListener('change', handleChange);
        return () => mediaQueryList.removeEventListener('change', handleChange);
      }

      mediaQueryList.addListener(handleChange);
      return () => mediaQueryList.removeListener(handleChange);
    };
    
    const handleScroll = () => {
      if (!ENABLE_MOBILE_COMPACT_HEADER) {
        if (isScrolledDownRef.current) {
          isScrolledDownRef.current = false;
          setIsScrolledDown(false);
        }
        return;
      }

      if (!isMobileRef.current) {
        if (isScrolledDownRef.current) {
          isScrolledDownRef.current = false;
          setIsScrolledDown(false);
        }
        return;
      }

      if (rafIdRef.current !== null) return;

      rafIdRef.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const compactOn = Math.max(72, SCROLL_DOWN_THRESHOLD);
        const expandAtTop = 16;
        let nextIsCompact = isScrolledDownRef.current;

        // Keep compact transition immediate once user scrolls down.
        if (currentScrollY > compactOn) {
          if (expandTimerRef.current !== null) {
            clearTimeout(expandTimerRef.current);
            expandTimerRef.current = null;
          }
          nextIsCompact = true;
        } else if (currentScrollY <= expandAtTop && isScrolledDownRef.current) {
          // Delay expanding near top slightly to avoid iOS/Android momentum bounce flicker.
          if (expandTimerRef.current === null) {
            expandTimerRef.current = setTimeout(() => {
              if (window.scrollY <= expandAtTop) {
                isScrolledDownRef.current = false;
                setIsScrolledDown(false);
              }
              expandTimerRef.current = null;
            }, 140);
          }
        }

        if (nextIsCompact !== isScrolledDownRef.current) {
          isScrolledDownRef.current = nextIsCompact;
          setIsScrolledDown(nextIsCompact);
        }

        rafIdRef.current = null;
      });
    };

    const unsubscribeMobileChanges = subscribeMobileChanges();
    if (ENABLE_MOBILE_COMPACT_HEADER) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    } else {
      isScrolledDownRef.current = false;
      setIsScrolledDown(false);
    }

    return () => {
      if (typeof unsubscribeMobileChanges === "function") {
        unsubscribeMobileChanges();
      }
      if (ENABLE_MOBILE_COMPACT_HEADER) {
        window.removeEventListener('scroll', handleScroll);
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (logoTimerRef.current !== null) {
        clearTimeout(logoTimerRef.current);
      }
      if (expandTimerRef.current !== null) {
        clearTimeout(expandTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  const handleLogoClick = () => {
    setAnimateLogo(true);
    if (logoTimerRef.current !== null) {
      clearTimeout(logoTimerRef.current);
    }
    logoTimerRef.current = setTimeout(() => {
      setAnimateLogo(false);
      logoTimerRef.current = null;
    }, 1000);
    setActiveTab('about', 'click');
  };

  const shouldCompactHeader = ENABLE_MOBILE_COMPACT_HEADER && isMobile && isScrolledDown;

  const headerClasses = `${isDark ? 'bg-black/90' : 'bg-white/90'} backdrop-blur shadow sticky top-0 z-50 transition-all duration-300 ease-in-out ${
    shouldCompactHeader ? 'header-compact' : 'header-expanded'
  }`;

  const mainContentWrapperClasses = isMobile
    ? `container mx-auto px-4 md:px-8 flex flex-row items-center justify-between ${shouldCompactHeader ? 'py-2' : 'py-3'}`
    : 'container mx-auto px-4 md:px-8 flex flex-col items-center justify-center py-3 md:flex-row md:justify-between md:items-center';

  const logoFrameClasses = `logo-frame group cursor-pointer select-none ${
    isMobile ? 'flex-shrink-0' : 'w-full text-center mb-4 md:w-auto md:text-left md:mb-0'
  } ${isDark ? 'text-slate-100' : 'text-slate-900'} ${animateLogo ? "logo-burst" : ""}`;
  const logoTextClasses = `logo-text group-hover:tracking-widest transition-all ${
    shouldCompactHeader ? 'logo-text-compact' : 'logo-text-expanded'
  }`;
  const logoImageClasses = isMobile
    ? 'h-7 w-7 object-contain inline-block m-0'
    : 'h-6 sm:h-8 w-auto inline-block mr-2 -mt-[0.1rem]';
  const themeButtonSizeClass = isMobile ? 'h-8 w-8' : 'h-10 w-10';

  return (
    <header className={headerClasses}>
      <div className={mainContentWrapperClasses}>
        <span className={logoFrameClasses} onClick={handleLogoClick}>
          <img
            src="assets/images/logoo.webp"
            alt="Madhav Kataria"
            className={logoImageClasses}
          />
          <span className={logoTextClasses}>Madhav Kataria</span>
        </span>
        <nav className={isMobile ? 'w-auto' : 'w-full md:w-auto'}>
          <ul className={`flex flex-row items-center ${isMobile ? 'gap-0.5 justify-end' : 'gap-1 w-full justify-center'}`}>
            {isMobile && activeTab !== 'about' && (
              <li className="relative">
                <button
                  className="about-tab-hint"
                  onClick={() => setActiveTab('about', 'click')}
                  aria-label="Go to About tab"
                  title="About"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="about-tab-hint-icon" fill="currentColor" aria-hidden="true">
                    <path d="M12 2.25a9.75 9.75 0 1 0 0 19.5a9.75 9.75 0 0 0 0-19.5Zm0 4.25a3.25 3.25 0 1 1 0 6.5a3.25 3.25 0 0 1 0-6.5Zm0 13.5a8.2 8.2 0 0 1-5.57-2.18a5.1 5.1 0 0 1 3.86-1.74h3.42a5.1 5.1 0 0 1 3.86 1.74A8.2 8.2 0 0 1 12 20Z"/>
                  </svg>
                </button>
              </li>
            )}
            {NAV_TABS.map(tab => (
              ((tab.id === 'privacy') || (isMobile && tab.id === 'about')) ? null : (
                <li key={tab.id} className="relative">
                  <button
                    className={`nav-link${activeTab === tab.id ? " active" : ""} ${isMobile ? 'px-2 py-1.5 text-[0.78rem]' : 'px-3 py-2'} rounded-md transition-all duration-300`}
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
                className={`inline-flex items-center justify-center ${themeButtonSizeClass} rounded-full transition-all duration-300 ${isDark ? 'text-amber-200 hover:text-amber-100 hover:bg-slate-900' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`}
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
