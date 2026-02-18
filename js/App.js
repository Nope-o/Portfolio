
// ===========================
// WinAnimationOverlay Component
// ===========================
function WinAnimationOverlay() {
  return (
    <div className="win-overlay-container">
      <div className="win-message-box animate-win-reveal">
        <span className="text-6xl animate-pulse-emoji">🎉</span>
        <h3 className="text-4xl font-extrabold text-blue-900 mt-4">You Won!</h3>
        <p className="text-lg sm:text-xl text-gray-700 mt-2 max-w-3xl mx-auto">
          🎉 You've unlocked my life journey! Here's how I've navigated challenges and milestones — I hope it inspires you too.
        </p>
        <span className="text-6xl animate-pulse-emoji">🎉</span>
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`firecracker firecracker-${i}`}></div>
      ))}
    </div>
  );
}
// ===========================
// Main App Component
// ===========================
const VALID_TAB_IDS = new Set(NAV_TABS.map((tab) => tab.id));
const NAVIGABLE_TABS = NAV_TABS.filter((tab) => tab.id !== "privacy");
const IMAGE_ASSET_PATTERN = /\.(avif|webp|png|jpe?g|gif|svg)(\?.*)?$/i;
const SWIPE_WARMUP_TRIGGER = 28;

function collectJourneyAssets() {
  if (typeof JOURNEY_TIMELINE_ITEMS === "undefined" || !Array.isArray(JOURNEY_TIMELINE_ITEMS)) {
    return [];
  }

  return JOURNEY_TIMELINE_ITEMS.flatMap((item) => [item?.logoUrl, item?.iconUrl]).filter(Boolean);
}

function collectProjectAssets() {
  const projects = Array.isArray(window.PROJECTS_DATA) ? window.PROJECTS_DATA : [];
  return projects.map((project) => project?.image).filter(Boolean);
}

function App() {
  const themeStorageKey = window.THEME_STORAGE_KEY || "portfolioTheme";
  const mobileQuery = '(max-width: 768px)';
  const getInitialTab = React.useCallback(() => {
    const hash = window.location.hash.replace('#', '');
    return VALID_TAB_IDS.has(hash) ? hash : 'about';
  }, []);

  const [activeTab, setActiveTabState] = React.useState(getInitialTab);
  const [theme, setTheme] = React.useState(() => {
    if (typeof window.getPortfolioTheme === "function") {
      return window.getPortfolioTheme();
    }
    try {
      return localStorage.getItem(themeStorageKey) === "light" ? "light" : "dark";
    } catch (err) {
      return "dark";
    }
  });
  const [touchStartX, setTouchStartX] = React.useState(0);
  const [dragX, setDragX] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const touchStartY = React.useRef(0);
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      return window.matchMedia(mobileQuery).matches;
    }
    return typeof window !== "undefined" ? window.innerWidth <= 768 : false;
  });
  const [transitionDirection, setTransitionDirection] = React.useState('animate-section-in');
  const [cancelSwipe, setCancelSwipe] = React.useState(false);
  const [showFullPageWinAnimation, setShowFullPageWinAnimation] = React.useState(false);
  const [showBackToTop, setShowBackToTop] = React.useState(false);
  const showBackToTopRef = React.useRef(false);
  const dragRafRef = React.useRef(null);
  const dragTargetXRef = React.useRef(0);
  const swipeWarmupTargetRef = React.useRef("");
  const prefetchedAssetsRef = React.useRef(new Set());
  const warmupTaskRef = React.useRef({ type: "", id: null });

  const tabAssetMap = React.useMemo(() => ({
    about: ["assets/images/Madhav-kataria.webp"],
    journey: collectJourneyAssets(),
    projects: collectProjectAssets(),
    resume: ["Madhav_Kataria_Resume.pdf"],
    contact: [],
    privacy: []
  }), []);

  const prefetchAsset = React.useCallback((assetUrl) => {
    if (typeof assetUrl !== "string") return;
    const trimmedUrl = assetUrl.trim();
    if (!trimmedUrl || prefetchedAssetsRef.current.has(trimmedUrl)) return;
    prefetchedAssetsRef.current.add(trimmedUrl);

    if (IMAGE_ASSET_PATTERN.test(trimmedUrl) || trimmedUrl.startsWith("data:image/")) {
      const img = new Image();
      img.decoding = "async";
      img.src = trimmedUrl;
      return;
    }

    const prefetchLink = document.createElement("link");
    prefetchLink.rel = "prefetch";
    prefetchLink.href = trimmedUrl;
    prefetchLink.as = "fetch";
    document.head.appendChild(prefetchLink);
  }, []);

  const warmTabAssets = React.useCallback((tabId) => {
    if (typeof tabId !== "string" || !tabId) return;
    const assets = Array.isArray(tabAssetMap[tabId]) ? tabAssetMap[tabId] : [];
    assets.forEach(prefetchAsset);
  }, [prefetchAsset, tabAssetMap]);

  const getWarmupTabs = React.useCallback((tabId) => {
    const currentIndex = NAVIGABLE_TABS.findIndex((tab) => tab.id === tabId);
    if (currentIndex === -1) return [tabId];

    const tabs = [tabId];
    if (currentIndex > 0) tabs.push(NAVIGABLE_TABS[currentIndex - 1].id);
    if (currentIndex < NAVIGABLE_TABS.length - 1) tabs.push(NAVIGABLE_TABS[currentIndex + 1].id);
    return tabs;
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 300;
      if (shouldShow !== showBackToTopRef.current) {
        showBackToTopRef.current = shouldShow;
        setShowBackToTop(shouldShow);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    const tabsToWarm = getWarmupTabs(activeTab);
    const warmAssets = () => {
      tabsToWarm.forEach((tabId) => {
        warmTabAssets(tabId);
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(warmAssets, { timeout: 900 });
      warmupTaskRef.current = { type: "idle", id: idleId };
    } else {
      const timeoutId = window.setTimeout(warmAssets, 80);
      warmupTaskRef.current = { type: "timeout", id: timeoutId };
    }

    return () => {
      if (warmupTaskRef.current.type === "idle" && warmupTaskRef.current.id !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(warmupTaskRef.current.id);
      } else if (warmupTaskRef.current.type === "timeout" && warmupTaskRef.current.id !== null) {
        window.clearTimeout(warmupTaskRef.current.id);
      }
      warmupTaskRef.current = { type: "", id: null };
    };
  }, [activeTab, getWarmupTabs, warmTabAssets]);

  const warmSwipeDirectionAssets = React.useCallback((dx) => {
    if (Math.abs(dx) < SWIPE_WARMUP_TRIGGER) return;
    const currentIndex = NAVIGABLE_TABS.findIndex((tab) => tab.id === activeTab);
    if (currentIndex === -1) return;

    const targetIndex = dx > 0 ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= NAVIGABLE_TABS.length) return;

    const targetTabId = NAVIGABLE_TABS[targetIndex].id;
    if (!targetTabId || swipeWarmupTargetRef.current === targetTabId) return;

    swipeWarmupTargetRef.current = targetTabId;
    warmTabAssets(targetTabId);
  }, [activeTab, warmTabAssets]);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
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
  }, [getInitialTab]);

  React.useEffect(() => {
    if (typeof window.applyPortfolioTheme === "function") {
      window.applyPortfolioTheme(theme);
    } else {
      try {
        localStorage.setItem(themeStorageKey, theme);
      } catch (err) {}
      if (typeof document !== "undefined" && document.body) {
        document.body.dataset.theme = theme;
      }
      if (typeof document !== "undefined" && document.documentElement) {
        document.documentElement.dataset.theme = theme;
      }
    }

    let themeSwitchTimer = null;
    if (typeof document !== "undefined" && document.body) {
      const bodyEl = document.body;
      bodyEl.classList.remove("theme-switching");
      void bodyEl.offsetWidth;
      bodyEl.classList.add("theme-switching");
      themeSwitchTimer = window.setTimeout(() => {
        bodyEl.classList.remove("theme-switching");
      }, 1300);
    }

    return () => {
      if (themeSwitchTimer !== null) {
        clearTimeout(themeSwitchTimer);
      }
      if (typeof document !== "undefined" && document.body) {
        document.body.classList.remove("theme-switching");
      }
    };
  }, [theme]);

  const setActiveTab = (tabId, origin = 'click') => {
    const oldIndex = NAVIGABLE_TABS.findIndex(tab => tab.id === activeTab);
    const newIndex = NAVIGABLE_TABS.findIndex(tab => tab.id === tabId);

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
    if (e.target.closest('.game-grid')) {
      swipeWarmupTargetRef.current = "";
      return;
    }
    if (isMobile && activeTab !== 'privacy') {
      swipeWarmupTargetRef.current = "";
      setTouchStartX(e.touches[0].clientX);
      touchStartY.current = e.touches[0].clientY;
      setIsDragging(false); // DO NOT start dragging yet
    }
  };
  const handleTouchMove = (e) => {
    if (!isMobile || activeTab === 'privacy') return;
    if (e.target.closest('.game-grid')) return;
  
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY.current;
  
    // Only activate swipe if horizontal intent is clear
    if (!isDragging) {
      if (Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        setIsDragging(true);
      } else {
        return; // allow vertical scroll
      }
    }

    warmSwipeDirectionAssets(dx);
    dragTargetXRef.current = dx * 0.8;
    if (dragRafRef.current === null) {
      dragRafRef.current = requestAnimationFrame(() => {
        setDragX(dragTargetXRef.current);
        dragRafRef.current = null;
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (!isMobile || activeTab === 'privacy') {
      swipeWarmupTargetRef.current = "";
      setDragX(0);
      setIsDragging(false);
      return;
    }
    if (!isDragging) {
      swipeWarmupTargetRef.current = "";
      return;
    }
    if (e.target.closest('.game-grid')) return;

    if (isMobile && activeTab !== 'privacy') {
      const swipeDistance = dragX;

      const currentIndex = NAVIGABLE_TABS.findIndex(tab => tab.id === activeTab);

      if (swipeDistance > SWIPE_THRESHOLD && currentIndex > 0) {
        setCancelSwipe(false);
        setActiveTab(NAVIGABLE_TABS[currentIndex - 1].id, 'swipe');
      } 
      else if (swipeDistance < -SWIPE_THRESHOLD && currentIndex < NAVIGABLE_TABS.length - 1) {
        setCancelSwipe(false);
        setActiveTab(NAVIGABLE_TABS[currentIndex + 1].id, 'swipe');
      } 
      else {
        // Cancel swipe → animate back smoothly
        setCancelSwipe(true);
      }
      
      setTimeout(() => setDragX(0), 10);
      setIsDragging(false);
      swipeWarmupTargetRef.current = "";

    }
  };

  React.useEffect(() => {
    return () => {
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (activeTab === 'privacy') {
      setDragX(0);
      setIsDragging(false);
      setCancelSwipe(false);
    }
    swipeWarmupTargetRef.current = "";
  }, [activeTab]);

  const isDark = theme !== "light";
  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'about':
        return <About showSection={setActiveTab} isDark={isDark} />;
      case 'journey':
        return <Journey setAppWinAnimation={setShowFullPageWinAnimation} isDark={isDark} />;
      case 'projects':
        return <Projects isDark={isDark} />;
      case 'resume':
        return <Resume isDark={isDark} />;
      case 'contact':
        return <Contact isDark={isDark} />;
      case 'privacy':
        return <PrivacyPolicy setActiveTab={setActiveTab} isDark={isDark} />;
      default:
        return <About showSection={setActiveTab} isDark={isDark} />;
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} onToggleTheme={toggleTheme} />
        <main
          className="container mx-auto w-full overflow-hidden relative px-4 py-8 flex-1"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
        <div
          key={activeTab}
          className={
            !isDragging
              ? (cancelSwipe ? 'animate-snap-back' : transitionDirection)
              : ''
          }

          style={{
            transform: `translateX(${dragX}px)`,
            opacity: isDragging ? 1 - Math.abs(dragX) / 600 : 1,
            transition: isDragging
              ? 'none'
              : cancelSwipe
                ? 'transform 0.25s ease-out'
                : 'transform 0.35s cubic-bezier(.4,0,.2,1)'

          }}
        >
          {renderActiveSection()}
        </div>
      </main>
      
      <footer className={`w-full text-center py-4 text-sm backdrop-blur shadow-inner mt-auto ${isDark ? 'bg-transparent text-slate-300' : 'bg-transparent text-gray-800'}`}>
        <div className={`flex flex-col items-center ${!isMobile ? 'md:flex-row md:justify-center' : ''}`}>
          <span>© {currentYear} - Crafted with ❤️ and lots of ☕</span>
          <span className="hidden md:inline-block md:mx-2">|</span>
          <button
            onClick={() => setActiveTab('privacy', 'click')}
            className={`font-semibold underline underline-offset-2 hover:no-underline mt-1 md:mt-0 ${isDark ? 'text-sky-300' : 'text-blue-900'}`}
          >
            Privacy Policy
          </button>
        </div>
      </footer>

      {showFullPageWinAnimation && <WinAnimationOverlay />}
      
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed bottom-4 right-4 z-50 rounded-full p-3 shadow-lg transition-opacity duration-500 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-100' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}


// ===========================
// Initialize App
// ===========================
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// IP logger (production-hardened):
// 1) sendBeacon (best for background/unload reliability)
// 2) keepalive fetch POST (no-cors)
// 3) fallback keepalive GET
const IP_LOG_ENDPOINT =
  typeof window.IP_LOG_ENDPOINT === "string" ? window.IP_LOG_ENDPOINT.trim() : "";
let ipLogInitSent = false;

function sendIpLog(eventName = "app_init") {
  if (!IP_LOG_ENDPOINT) return;
  const payload = JSON.stringify({
    event: eventName,
    ts: new Date().toISOString(),
    href: window.location.href,
    referrer: document.referrer || "",
    ua: navigator.userAgent || ""
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "text/plain;charset=UTF-8" });
      if (navigator.sendBeacon(IP_LOG_ENDPOINT, blob)) return;
    }
  } catch (_) {}

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => {
        try {
          controller.abort();
        } catch (_) {}
      }, 2500)
    : null;

  fetch(IP_LOG_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    cache: "no-store",
    keepalive: true,
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: payload,
    signal: controller ? controller.signal : undefined
  })
    .catch(() => {
      const q = `?t=${Date.now()}&event=${encodeURIComponent(eventName)}`;
      return fetch(`${IP_LOG_ENDPOINT}${q}`, {
        method: "GET",
        mode: "no-cors",
        cache: "no-store",
        keepalive: true
      }).catch(() => {});
    })
    .finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });
}

function sendInitialIpLogOnce() {
  if (ipLogInitSent) return;
  ipLogInitSent = true;
  sendIpLog("app_init");
}

if (IP_LOG_ENDPOINT) {
  sendInitialIpLogOnce();
  window.addEventListener("pagehide", () => sendIpLog("pagehide"), { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      sendIpLog("visibility_hidden");
    }
  });
}
