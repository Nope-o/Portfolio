// ===========================
// PROJECT COMPONENT
// ===========================
function Projects() {
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
    return visibility === "Public"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : "bg-amber-50 text-amber-800 border border-amber-200";
  };

  const getActionClasses = (style) => {
    if (style === "primary") {
      return "inline-flex w-auto items-center justify-center whitespace-nowrap px-3.5 py-2 rounded-full bg-blue-800 text-white text-sm sm:text-base font-semibold hover:bg-blue-700 transition";
    }
    if (style === "success") {
      return "inline-flex w-auto items-center justify-center whitespace-nowrap px-3.5 py-2 rounded-full bg-emerald-600 text-white text-sm sm:text-base font-semibold hover:bg-emerald-500 transition";
    }
    if (style === "ghost") {
      return "inline-flex w-auto items-center justify-center whitespace-nowrap px-3.5 py-2 rounded-full border border-slate-300 text-slate-700 text-sm sm:text-base font-semibold hover:bg-slate-100 transition";
    }
    return "inline-flex w-auto items-center justify-center whitespace-nowrap px-3.5 py-2 rounded-full bg-slate-200 text-slate-500 text-sm sm:text-base font-semibold cursor-not-allowed";
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

  return (
    <section className="mx-auto max-w-6xl bg-gradient-to-br from-slate-50/95 via-slate-100/90 to-blue-50/90 p-5 sm:p-7 rounded-3xl shadow-xl mb-10 border border-slate-200/70 backdrop-blur">
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-slate-50 to-blue-50 p-3 sm:p-4 mb-4 sm:mb-5">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-2xl font-extrabold text-slate-900 leading-tight">My Projects</h2>
          <p className="text-sm sm:text-sm text-slate-600 mt-1">Here are selected builds from my journey. Explore what is live, what is internal, and how each project creates real impact.</p>
        </div>
      </div>

      <div className="mb-5 sm:mb-6">
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full border border-slate-300 bg-slate-100/90 text-slate-700 hover:bg-slate-200 transition"
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
          <div className="mt-2.5 p-2.5 sm:p-3 rounded-xl bg-white/80 border border-slate-200">
            <div className="flex flex-wrap gap-2">
              {stackOptions.map((stack) => (
                <button
                  key={stack}
                  type="button"
                  onClick={() => setActiveStack(stack)}
                  className={`text-xs sm:text-sm px-3 py-1.5 rounded-full border font-semibold transition ${
                    activeStack === stack
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {stack}
                </button>
              ))}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-2">
              Active: <span className="font-semibold text-slate-700">{activeStack}</span>
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {filteredAndSortedProjects.length === 0 && (
          <p className="text-gray-600">
            No projects found for the selected stack.
          </p>
        )}
        {filteredAndSortedProjects.map((p, i) => (
          <div
            key={i}
            className="group bg-white/95 border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-300 h-full flex flex-col cursor-pointer"
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
            <div className="w-full h-40 sm:h-36 bg-gradient-to-br from-slate-100 to-slate-200/80 flex items-center justify-center p-3">
              <img
                src={p.image}
                alt={p.title}
                className="max-h-full w-full object-contain"
                loading="lazy"
              />
            </div>

            <div className="p-3.5 sm:p-4 min-h-[208px] flex flex-col">
              <div className="flex items-start justify-between gap-2.5 mb-2.5">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${getVisibilityClasses(p.visibility)}`}>
                  {p.visibility}
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-slate-500 shrink-0">{p.createdOn}</span>
              </div>

              <h3 className="text-xl sm:text-xl font-bold text-slate-900 mb-1.5 leading-tight">{p.title}</h3>
              <p className="text-slate-600 mb-3 text-base sm:text-sm leading-relaxed">{p.summary}</p>
              {!!(p.techStack && p.techStack.length) && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {p.techStack.slice(0, 3).map((stack) => (
                    <span key={stack} className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                      {stack}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto">
                <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-50 border border-slate-200 mb-2.5">
                  <span className="text-xs font-semibold text-blue-700">
                    {"\uD83D\uDC4D"} {likeCountBySlug[p.slug] ?? (p.likes || 0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCardLike(p.slug)}
                    disabled={!likesApiUrl || !!likedBySession[p.slug] || !!submittingBySlug[p.slug]}
                    className={`text-[11px] sm:text-xs px-2 py-0.5 rounded-full font-semibold transition ${
                      !likesApiUrl
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : likedBySession[p.slug]
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    }`}
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





