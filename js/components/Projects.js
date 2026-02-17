// ===========================
// PROJECT COMPONENT
// ===========================
function Projects({ isDark }) {
  const projects = Array.isArray(window.PROJECTS_DATA) ? window.PROJECTS_DATA : [];
  const likesApiUrl = window.LIKES_API_URL;
  const [likesBySlug, setLikesBySlug] = React.useState({});
  const [likedBySession, setLikedBySession] = React.useState({});
  const [submittingBySlug, setSubmittingBySlug] = React.useState({});
  const [showThanksOverlay, setShowThanksOverlay] = React.useState(false);
  const [activeStack, setActiveStack] = React.useState("All");
  const [showFilters, setShowFilters] = React.useState(false);

  React.useEffect(() => {
    if (!likesApiUrl) return;

    const slugs = projects.map((p) => p.slug).filter(Boolean);
    if (slugs.length === 0) return;

    const likedMap = {};
    slugs.forEach((slug) => {
      try {
        likedMap[slug] = sessionStorage.getItem(`projectLiked:${slug}`) === "1";
      } catch (err) {
        likedMap[slug] = false;
      }
    });
    setLikedBySession(likedMap);

    const loadLikes = async () => {
      const entries = await Promise.all(
        slugs.map(async (slug) => {
          try {
            const response = await fetch(
              `${likesApiUrl}?slug=${encodeURIComponent(slug)}&ts=${Date.now()}`,
              { cache: "no-store" }
            );
            const data = await response.json();
            const count = Number(data.count);
            if (!Number.isNaN(count)) {
              try {
                localStorage.setItem(`projectRemoteLike:${slug}`, String(count));
              } catch (err) {}
              return [slug, count];
            }
          } catch (err) {}

          try {
            const cached = parseInt(localStorage.getItem(`projectRemoteLike:${slug}`) || "0", 10) || 0;
            return [slug, cached];
          } catch (err) {
            return [slug, 0];
          }
        })
      );

      setLikesBySlug((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    };

    loadLikes();
  }, [projects, likesApiUrl]);

  const incrementLike = async (slug) => {
    const response = await fetch(likesApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({ slug })
    });
    const result = await response.json();
    const count = Number(result.count);
    if (Number.isNaN(count)) {
      throw new Error("Invalid like count response");
    }
    return count;
  };

  const handleCardLike = async (slug) => {
    if (!slug || likedBySession[slug] || submittingBySlug[slug] || !likesApiUrl) return;

    setSubmittingBySlug((prev) => ({ ...prev, [slug]: true }));
    try {
      const nextCount = await incrementLike(slug);
      setLikesBySlug((prev) => ({ ...prev, [slug]: nextCount }));
      try {
        localStorage.setItem(`projectRemoteLike:${slug}`, String(nextCount));
        sessionStorage.setItem(`projectLiked:${slug}`, "1");
      } catch (err) {}
      setLikedBySession((prev) => ({ ...prev, [slug]: true }));
      window.analytics?.track("project_liked", {
        project_slug: slug,
        source: "project_card"
      });
      setShowThanksOverlay(true);
      setTimeout(() => setShowThanksOverlay(false), 1400);
    } catch (err) {
      setSubmittingBySlug((prev) => ({ ...prev, [slug]: false }));
      return;
    }
    setSubmittingBySlug((prev) => ({ ...prev, [slug]: false }));
  };

  const stackOptions = React.useMemo(() => {
    const allStacks = new Set(["All"]);
    projects.forEach((project) => {
      (project.techStack || []).forEach((stack) => allStacks.add(stack));
    });
    return Array.from(allStacks);
  }, [projects]);

  const likeCountBySlug = React.useMemo(() => {
    const map = {};
    projects.forEach((project) => {
      const slug = project.slug;
      if (!slug) {
        map[slug] = project.likes || 0;
        return;
      }
      if (Object.prototype.hasOwnProperty.call(likesBySlug, slug)) {
        map[slug] = likesBySlug[slug];
        return;
      }
      try {
        const cached = parseInt(localStorage.getItem(`projectRemoteLike:${slug}`) || "", 10);
        map[slug] = Number.isNaN(cached) ? (project.likes || 0) : cached;
      } catch (err) {
        map[slug] = project.likes || 0;
      }
    });
    return map;
  }, [projects, likesBySlug]);

  const filteredAndSortedProjects = React.useMemo(() => {
    const filtered = activeStack === "All"
      ? projects
      : projects.filter((project) => (project.techStack || []).includes(activeStack));

    return [...filtered].sort((a, b) => {
      const aLikes = likeCountBySlug[a.slug] ?? (a.likes || 0);
      const bLikes = likeCountBySlug[b.slug] ?? (b.likes || 0);
      return bLikes - aLikes;
    });
  }, [projects, activeStack, likeCountBySlug]);

  const getVisibilityClasses = (visibility) => {
    if (!isDark) {
      return visibility === "Public"
        ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
        : "bg-amber-100 text-amber-700 border border-amber-300";
    }
    return visibility === "Public"
      ? "bg-emerald-500/18 text-emerald-200 shadow-[0_6px_16px_rgba(16,185,129,0.16)]"
      : "bg-amber-500/18 text-amber-200 shadow-[0_6px_16px_rgba(245,158,11,0.14)]";
  };

  const getStatusClasses = (status) => {
    if (!isDark) {
      if (status === "Under Development") {
        return "bg-amber-100 text-amber-700 border border-amber-300";
      }
      if (status === "Live") {
        return "bg-blue-100 text-blue-700 border border-blue-300";
      }
      return "bg-slate-100 text-slate-700 border border-slate-300";
    }
    if (status === "Under Development") {
      return "bg-amber-500/18 text-amber-200 shadow-[0_6px_16px_rgba(245,158,11,0.14)]";
    }
    if (status === "Live") {
      return "bg-blue-500/18 text-blue-200 shadow-[0_6px_16px_rgba(59,130,246,0.15)]";
    }
    return "bg-slate-500/18 text-slate-200 shadow-[0_6px_16px_rgba(71,85,105,0.15)]";
  };

  const getActionClasses = (style) => {
    if (!isDark) {
      if (style === "primary") {
        return "inline-flex w-auto items-center justify-center whitespace-nowrap px-3.5 py-2 rounded-full bg-blue-700 text-white text-sm sm:text-base font-semibold hover:bg-blue-600 transition";
      }
      if (style === "success") {
        return "inline-flex w-auto items-center justify-center whitespace-nowrap px-3.5 py-2 rounded-full bg-emerald-600 text-white text-sm sm:text-base font-semibold hover:bg-emerald-500 transition";
      }
      if (style === "ghost") {
        return "inline-flex w-auto items-center justify-center whitespace-nowrap px-3.5 py-2 rounded-full border border-slate-300 text-slate-700 text-sm sm:text-base font-semibold hover:bg-slate-100 transition";
      }
      return "inline-flex w-auto items-center justify-center whitespace-nowrap px-3.5 py-2 rounded-full bg-slate-200 text-slate-500 text-sm sm:text-base font-semibold cursor-not-allowed";
    }
    if (style === "primary") {
      return "inline-flex w-auto items-center justify-center whitespace-nowrap px-3.5 py-2 rounded-full bg-blue-800 text-white text-sm sm:text-base font-semibold hover:bg-blue-700 transition";
    }
    if (style === "success") {
      return "inline-flex w-auto items-center justify-center whitespace-nowrap px-3.5 py-2 rounded-full bg-emerald-600 text-white text-sm sm:text-base font-semibold hover:bg-emerald-500 transition";
    }
    if (style === "ghost") {
      return "inline-flex w-auto items-center justify-center whitespace-nowrap px-3.5 py-2 rounded-full bg-slate-700/50 text-slate-100 text-sm sm:text-base font-semibold hover:bg-slate-600/60 transition";
    }
    return "inline-flex w-auto items-center justify-center whitespace-nowrap px-3.5 py-2 rounded-full bg-slate-200 text-slate-500 text-sm sm:text-base font-semibold cursor-not-allowed";
  };

  const getLikeButtonClasses = (slug) => {
    if (!likesApiUrl || likedBySession[slug]) {
      return isDark
        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
        : "bg-slate-200 text-slate-500 cursor-not-allowed";
    }
    return isDark
      ? "bg-blue-500/20 text-blue-200 hover:bg-blue-500/30"
      : "bg-blue-100 text-blue-700 hover:bg-blue-200";
  };

  const getDefaultDetailAction = (project) => {
    const actions = Array.isArray(project?.actions) ? project.actions : [];
    const knowMore = actions.find(
      (action) =>
        action &&
        action.style !== "disabled" &&
        typeof action.label === "string" &&
        action.label.toLowerCase().includes("know more")
    );
    if (knowMore) return knowMore;

    const internalAction = actions.find(
      (action) =>
        action &&
        action.style !== "disabled" &&
        !action.external &&
        typeof action.href === "string" &&
        action.href.trim().length > 0
    );
    return internalAction || null;
  };

  const openProjectDetail = (project) => {
    const action = getDefaultDetailAction(project);
    if (!action || !action.href) return;
    window.analytics?.track("project_opened", {
      project_slug: project?.slug || "",
      project_title: project?.title || "",
      via: "card"
    });

    if (action.external) {
      window.open(action.href, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.href = action.href;
  };

  const thanksOverlay = showThanksOverlay && typeof document !== "undefined"
    ? ReactDOM.createPortal(
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
        <div className="bg-white border border-blue-200 rounded-2xl px-6 py-5 shadow-2xl text-center animate-section-in">
          <div className="text-3xl mb-1">{"\uD83C\uDF89"}</div>
          <p className="text-blue-900 font-bold">Thank you for your feedback!</p>
        </div>
      </div>,
      document.body
    )
    : null;

  const themeStyles = isDark
    ? {
      sectionClass: "mx-auto max-w-6xl bg-transparent p-5 sm:p-7 rounded-3xl mb-10",
      heroPanelClass: "rounded-2xl bg-transparent p-3 sm:p-4 mb-4 sm:mb-5 relative",
      headingClass: "text-2xl sm:text-2xl font-extrabold text-white leading-tight",
      introClass: "text-sm sm:text-sm text-slate-200 mt-1",
      filterBtnClass: "inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full bg-slate-900/55 text-slate-100 hover:bg-slate-800/55 transition shadow-[0_10px_24px_rgba(2,6,23,0.35)]",
      filterPanelClass: "mt-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-900/40 shadow-[0_10px_24px_rgba(2,6,23,0.35)]",
      inactiveFilterClass: "bg-slate-900/50 text-slate-100 border-transparent hover:bg-slate-800/55",
      activeLabelClass: "text-[11px] sm:text-xs text-slate-300 mt-2",
      activeValueClass: "font-semibold text-slate-100",
      cardClass: "group about-bg rounded-2xl overflow-hidden shadow-none hover:-translate-y-0.5 transition duration-300 h-full flex flex-col cursor-pointer",
      cardTitleClass: "px-3.5 sm:px-4 pt-3 pb-2 bg-transparent text-center",
      cardTitleTextClass: "text-lg sm:text-xl font-bold text-white leading-tight",
      metaDateClass: "text-[11px] sm:text-xs font-medium text-slate-300 shrink-0",
      summaryClass: "text-slate-200 mb-3 text-base sm:text-sm leading-relaxed",
      techChipClass: "text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-slate-800/70 text-slate-200 shadow-[0_6px_16px_rgba(2,6,23,0.25)]",
      likeBarClass: "flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-900/45 mb-2.5",
      likeCountClass: "text-xs font-semibold text-blue-300",
      emptyStateClass: "text-slate-300"
    }
    : {
      sectionClass: "mx-auto max-w-6xl bg-transparent p-5 sm:p-7 rounded-3xl mb-10",
      heroPanelClass: "rounded-2xl bg-white/55 p-3 sm:p-4 mb-4 sm:mb-5 relative",
      headingClass: "text-2xl sm:text-2xl font-extrabold text-slate-900 leading-tight",
      introClass: "text-sm sm:text-sm text-slate-700 mt-1",
      filterBtnClass: "inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full border border-slate-300 bg-white/85 text-slate-700 hover:bg-white transition",
      filterPanelClass: "mt-2.5 p-2.5 sm:p-3 rounded-xl bg-white/80 border border-slate-200 shadow-sm",
      inactiveFilterClass: "bg-white text-slate-700 border-slate-300 hover:bg-slate-100",
      activeLabelClass: "text-[11px] sm:text-xs text-slate-600 mt-2",
      activeValueClass: "font-semibold text-slate-800",
      cardClass: "group bg-gradient-to-br from-white via-slate-50 to-slate-100 rounded-2xl overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-0.5 transition duration-300 h-full flex flex-col cursor-pointer",
      cardTitleClass: "px-3.5 sm:px-4 pt-3 pb-2 bg-gradient-to-r from-white to-slate-100 text-center",
      cardTitleTextClass: "text-lg sm:text-xl font-bold text-slate-900 leading-tight",
      metaDateClass: "text-[11px] sm:text-xs font-medium text-slate-500 shrink-0",
      summaryClass: "text-slate-600 mb-3 text-base sm:text-sm leading-relaxed",
      techChipClass: "text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-700",
      likeBarClass: "flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-50 border border-slate-300 mb-2.5",
      likeCountClass: "text-xs font-semibold text-blue-700",
      emptyStateClass: "text-slate-600"
    };

  return (
    <section className={themeStyles.sectionClass}>
      <div className={themeStyles.heroPanelClass}>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className={themeStyles.headingClass}>My Projects</h2>
          <p className={themeStyles.introClass}>Here are selected builds from my journey. Explore what is live, what is internal, and how each project creates real impact.</p>
        </div>
      </div>

      <div className="mb-5 sm:mb-6">
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={themeStyles.filterBtnClass}
            aria-expanded={showFilters}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" />
            </svg>
            <span>Filter Projects</span>
          </button>
        </div>
        {showFilters && (
          <div className={themeStyles.filterPanelClass}>
            <div className="flex flex-wrap gap-2">
              {stackOptions.map((stack) => (
                <button
                  key={stack}
                  type="button"
                  onClick={() => setActiveStack(stack)}
                  className={`text-xs sm:text-sm px-3 py-1.5 rounded-full border font-semibold transition ${
                    activeStack === stack
                      ? "bg-blue-700 text-white border-blue-700"
                      : themeStyles.inactiveFilterClass
                  }`}
                >
                  {stack}
                </button>
              ))}
            </div>
            <p className={themeStyles.activeLabelClass}>
              Active: <span className={themeStyles.activeValueClass}>{activeStack}</span>
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {filteredAndSortedProjects.length === 0 && (
          <p className={themeStyles.emptyStateClass}>
            No projects found for the selected stack.
          </p>
        )}
        {filteredAndSortedProjects.map((p, i) => (
          <div
            key={i}
            className={themeStyles.cardClass}
            onClick={(e) => {
              if (e.target.closest("a, button")) return;
              openProjectDetail(p);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openProjectDetail(p);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Open details for ${p.title}`}
          >
            <div className={themeStyles.cardTitleClass}>
              <h3 className={themeStyles.cardTitleTextClass}>{p.title}</h3>
            </div>

            <div className="w-full h-44 sm:h-40 bg-transparent flex items-center justify-center p-2 sm:p-2.5">
              <img
                src={p.image}
                alt={p.title}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>

            <div className="p-3.5 sm:p-4 min-h-[208px] flex flex-col">
              <div className="flex items-start justify-between gap-2.5 mb-2.5">
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${getVisibilityClasses(p.visibility)}`}>
                    {p.visibility}
                  </span>
                  {!!p.status && (
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${getStatusClasses(p.status)}`}>
                      {p.status}
                    </span>
                  )}
                </div>
                <span className={themeStyles.metaDateClass}>{p.createdOn}</span>
              </div>

              <p className={themeStyles.summaryClass}>{p.summary}</p>
              {!!(p.techStack && p.techStack.length) && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {p.techStack.slice(0, 3).map((stack) => (
                    <span key={stack} className={themeStyles.techChipClass}>
                      {stack}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto">
                <div className={themeStyles.likeBarClass}>
                  <span className={themeStyles.likeCountClass}>
                    {"\uD83D\uDC4D"} {likeCountBySlug[p.slug] ?? (p.likes || 0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCardLike(p.slug)}
                    disabled={!likesApiUrl || !!likedBySession[p.slug] || !!submittingBySlug[p.slug]}
                    className={`text-[11px] sm:text-xs px-2 py-0.5 rounded-full font-semibold transition ${getLikeButtonClasses(p.slug)}`}
                    aria-label={`Like ${p.title}`}
                  >
                    {!likesApiUrl
                      ? "Likes Off"
                      : likedBySession[p.slug]
                      ? "Feedback Sent"
                      : (submittingBySlug[p.slug] ? "Submitting..." : "Like")}
                  </button>
                </div>

                <div className="flex flex-nowrap gap-1.5 pt-0.5 overflow-x-auto">
                {p.actions.map((action, actionIdx) => (
                  action.style === "disabled" ? (
                    <span key={actionIdx} className={getActionClasses(action.style)} aria-disabled="true">
                      {action.label}
                    </span>
                  ) : (
                    <a
                      key={actionIdx}
                      href={action.href}
                      target={action.external ? "_blank" : undefined}
                      rel={action.external ? "noopener noreferrer" : undefined}
                      className={getActionClasses(action.style)}
                      onClick={() => {
                        window.analytics?.track("project_cta_clicked", {
                          project_slug: p?.slug || "",
                          project_title: p?.title || "",
                          action_label: action?.label || "",
                          action_href: action?.href || "",
                          external: Boolean(action?.external)
                        });
                      }}
                    >
                      {action.label}
                    </a>
                  )
                ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {thanksOverlay}
    </section>
  );
}
