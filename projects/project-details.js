(function renderProjectDetails() {
  const app = document.getElementById("project-root");
  if (!app) return;
  const themeStorageKey = window.THEME_STORAGE_KEY || "portfolioTheme";
  const getTheme = () => {
    if (typeof window.getPortfolioTheme === "function") {
      return window.getPortfolioTheme();
    }
    try {
      return localStorage.getItem(themeStorageKey) === "light" ? "light" : "dark";
    } catch (err) {
      return "dark";
    }
  };
  const applyTheme = (theme) => {
    if (typeof window.applyPortfolioTheme === "function") {
      window.applyPortfolioTheme(theme);
      return;
    }
    if (document.body) {
      document.body.dataset.theme = theme === "light" ? "light" : "dark";
    }
  };

  applyTheme(getTheme());

  const pathParts = window.location.pathname.replace(/\/+$/, "").split("/");
  const slug = decodeURIComponent(pathParts[pathParts.length - 1] || "");
  const dataMap = window.PROJECT_DETAILS || {};
  const data = dataMap[slug];
  const likesApiUrl = typeof window.LIKES_API_URL === "string" ? window.LIKES_API_URL.trim() : "";
  const likesEnabled = Boolean(likesApiUrl);

  if (!data) {
    app.innerHTML = `
      <div class="empty">
        <strong>Project not found:</strong> "${slug}"<br />
        Add it in <code>projects/project-details-data.js</code> and create a folder path like
        <code>projects/${slug}/index.html</code>.
      </div>
    `;
    return;
  }

  const visibilityClass = (data.visibility || "").toLowerCase() === "public" ? "public" : "internal";
  const highlights = (Array.isArray(data.highlights) ? data.highlights : []).filter(
    (item) => typeof item === "string" && item.trim().length > 0
  );
  const requirementsSource = Array.isArray(data.requirements)
    ? data.requirements
    : (Array.isArray(data.requirement) ? data.requirement : []);
  const requirements = requirementsSource.filter((item) => typeof item === "string" && item.trim().length > 0);
  const stack = (Array.isArray(data.techStack) ? data.techStack : []).filter(
    (item) => typeof item === "string" && item.trim().length > 0
  );
  const mvpSource = Array.isArray(data.mvp)
    ? data.mvp
    : (Array.isArray(data.valueProposition) ? data.valueProposition : []);
  const mvp = mvpSource.filter((item) => typeof item === "string" && item.trim().length > 0);
  const gallery = (Array.isArray(data.gallery) ? data.gallery : []).filter(
    (img) => img && typeof img.src === "string" && img.src.trim()
  );
  const links = (Array.isArray(data.links) ? data.links : []).filter(
    (link) => link && typeof link.label === "string" && link.label.trim() && typeof link.href === "string" && link.href.trim()
  );
  const hasOverview = typeof data.overview === "string" && data.overview.trim().length > 0;
  const hasRequirements = requirements.length > 0;
  const hasHighlights = highlights.length > 0;
  const hasMvp = mvp.length > 0;
  const hasStack = stack.length > 0;
  const hasCapabilityCard = hasMvp || hasStack;
  const hasLinks = links.length > 0;
  const hasGallery = gallery.length > 0;
  const heroFitClass = (data.heroFit || "contain").toLowerCase() === "cover" ? "hero-fit-cover" : "hero-fit-contain";
  const headerIconSrc = data.headerIcon || data.heroImage || data.logoImage || "../../assets/images/logoo.webp";
  const categoryLabel = hasStack ? stack[0] : (data.visibility || "Project");
  const statusLabel = data.status || "Active";
  const headerSublineClean = `${categoryLabel} | ${statusLabel}`;
  const headerFeatureLine = Array.isArray(data.headerHighlights)
    ? data.headerHighlights.filter((item) => typeof item === "string" && item.trim()).join(" | ")
    : (typeof data.headerHighlights === "string" ? data.headerHighlights.trim() : "");
  const likeKey = `projectLiked:${slug}`;
  const remoteLikeCacheKey = `projectRemoteLike:${slug}`;
  const likeEmoji = "\uD83D\uDC4D";
  const submittingEmoji = "\u23F3";

  const getSessionValue = (key, defaultValue) => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw === null ? defaultValue : raw;
    } catch (err) {
      return defaultValue;
    }
  };

  const setSessionValue = (key, value) => {
    try {
      sessionStorage.setItem(key, value);
    } catch (err) {}
  };

  const getLocalValue = (key, defaultValue) => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultValue : raw;
    } catch (err) {
      return defaultValue;
    }
  };

  const setLocalValue = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (err) {}
  };

  const alreadyLiked = getSessionValue(likeKey, "0") === "1";
  const cachedRemote = parseInt(getLocalValue(remoteLikeCacheKey, ""), 10);
  const initialLikes = Number.isNaN(cachedRemote) ? (data.likes || 0) : cachedRemote;

  app.innerHTML = `
    <header class="header">
      <a class="back-btn" href="../../#projects">Back</a>
      <div class="header-center">
        <h1>${data.title}</h1>
        ${headerFeatureLine ? "" : `<p class="brand-subline">${headerSublineClean}</p>`}
        ${headerFeatureLine ? `<p class="brand-subline-secondary">${headerFeatureLine}</p>` : ""}
      </div>
      <section class="header-like card like-compact">
        <div class="like-row">
          <h2 id="like-prompt" class="${alreadyLiked || !likesEnabled ? "is-hidden" : ""}">Do you like it?</h2>
          <button
            id="like-btn"
            class="action like-emoji-btn ${alreadyLiked ? "secondary" : "primary"} ${alreadyLiked || !likesEnabled ? "is-hidden" : ""}"
            ${alreadyLiked || !likesEnabled ? "disabled" : ""}
            title="${alreadyLiked ? "Feedback submitted" : (likesEnabled ? "Submit like" : "Likes disabled")}"
            aria-label="${alreadyLiked ? "Feedback already submitted" : (likesEnabled ? "Submit like" : "Likes disabled")}"
          >
            👍
          </button>
          <p class="likes-note">Likes: <strong id="likes-count">${initialLikes}</strong></p>
        </div>
        <p id="like-status" class="like-status">
          ${alreadyLiked ? "Thank you for liking, it means a lot!" : (likesEnabled ? "" : "Likes are currently disabled to reduce backend costs.")}
        </p>
      </section>
      <span class="brand-link header-logo" aria-hidden="true">
        <img src="${headerIconSrc}" alt="${data.title} icon" />
      </span>
    </header>

    <section class="hero">
      <div class="hero-media">
        <img class="hero-img ${heroFitClass}" src="${data.heroImage}" alt="${data.title}" />
      </div>
      <div class="hero-meta-strip">
        <div class="meta">
          <span class="pill ${visibilityClass}">${data.visibility || "Internal"}</span>
          <span class="pill info">Created: ${data.createdOn || "N/A"}</span>
          <span class="pill info">Status: ${data.status || "Active"}</span>
        </div>
      </div>
    </section>

    ${hasLinks ? `
    <section class="card links-strip">
      <h2>Quick Actions</h2>
      <div class="actions">
        ${links
          .map(
            (link, idx) => `
              <a
                class="action ${link.style || (idx === 0 ? "primary" : "secondary")}"
                href="${link.href}"
                ${link.external ? 'target="_blank" rel="noopener noreferrer"' : ""}
              >
                ${link.label}
              </a>
            `
          )
          .join("")}
        ${hasGallery ? `
          <a class="action gallery-jump" href="#project-gallery" data-gallery-jump="true">
            Gallery
          </a>
        ` : ""}
      </div>
    </section>` : ""}

    <section class="grid">
      ${hasOverview ? `
      <article class="card">
        <h2>Overview</h2>
        <p>${data.overview}</p>
      </article>` : ""}
      ${hasHighlights ? `
      <article class="card">
        <h2>Highlights</h2>
        <ul class="list">
          ${highlights.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </article>` : ""}
      ${hasCapabilityCard ? `
      <article class="card capability-card">
        <h2>${hasMvp ? "MVP" : "Tech Stack"}</h2>
        ${hasMvp ? `
        <ul class="list mvp-list">
          ${mvp.map((item) => `<li>${item}</li>`).join("")}
        </ul>` : ""}
        ${hasMvp && hasStack ? `<h3 class="subheading">Tech Stack</h3>` : ""}
        ${hasStack ? `
        <div class="stack">
          ${stack.map((item) => `<span class="tag">${item}</span>`).join("")}
        </div>` : ""}
      </article>` : ""}
      ${hasRequirements ? `
      <article class="card">
        <h2>Requirements</h2>
        <ul class="list">
          ${requirements.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </article>` : ""}
    </section>

    ${hasGallery ? `
    <section id="project-gallery" class="card gallery-card">
      <h2>Gallery</h2>
      <div class="gallery">
        ${gallery
          .map(
            (img) =>
              `<img class="gallery-image" src="${img.src}" alt="${img.alt || data.title}" loading="lazy" />`
          )
          .join("")}
      </div>
    </section>` : ""}
  `;

  const likeBtn = document.getElementById("like-btn");
  const likesCount = document.getElementById("likes-count");
  const likeStatus = document.getElementById("like-status");
  const likePrompt = document.getElementById("like-prompt");

  window.addEventListener("storage", (event) => {
    if (event.key === themeStorageKey) {
      applyTheme(event.newValue === "light" ? "light" : "dark");
    }
  });

  const syncLikeCount = async () => {
    if (!likesEnabled) return;
    try {
      const response = await fetch(
        `${likesApiUrl}?slug=${encodeURIComponent(slug)}&ts=${Date.now()}`,
        { cache: "no-store" }
      );
      const result = await response.json();
      const count = Number(result.count);
      if (!Number.isNaN(count) && likesCount) {
        likesCount.textContent = String(count);
        setLocalValue(remoteLikeCacheKey, String(count));
      }
    } catch (err) {}
  };

  const incrementLike = async () => {
    if (!likesEnabled) {
      throw new Error("Likes are disabled");
    }
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

  const showThankYouOverlay = () => {
    const existing = document.getElementById("thankyou-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "thankyou-overlay";
    overlay.className = "thankyou-overlay";
    overlay.innerHTML = `
      <div class="thankyou-box">
        <span class="thankyou-emoji">&#127881;</span>
        <h3 class="thankyou-title">Thank You!</h3>
        <p class="thankyou-text">Your like means a lot.</p>
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => {
      overlay.remove();
    }, 1700);
  };

  syncLikeCount();

  let galleryLightboxIndex = -1;
  let galleryZoom = 1;
  let galleryPanX = 0;
  let galleryPanY = 0;
  let galleryDragState = null;
  const galleryMinZoom = 1;
  const galleryMaxZoom = 4;
  const galleryZoomStep = 0.25;
  const galleryImageElements = Array.from(app.querySelectorAll(".gallery-image"));

  const getWrappedGalleryIndex = (index) => {
    const total = galleryImageElements.length;
    if (total <= 0) return -1;
    return ((index % total) + total) % total;
  };

  const updateGalleryLightboxTransform = () => {
    const overlay = document.getElementById("gallery-lightbox");
    if (!overlay) return;
    const img = overlay.querySelector(".gallery-lightbox-image");
    if (!img) return;
    img.style.transform = `translate(${galleryPanX}px, ${galleryPanY}px) scale(${galleryZoom})`;
    img.style.cursor = galleryZoom > 1 ? (galleryDragState ? "grabbing" : "grab") : "zoom-in";
    const readout = overlay.querySelector(".gallery-lightbox-zoom-readout");
    if (readout) {
      readout.textContent = `${Math.round(galleryZoom * 100)}%`;
    }
  };

  const resetGalleryZoom = () => {
    galleryZoom = 1;
    galleryPanX = 0;
    galleryPanY = 0;
    galleryDragState = null;
    updateGalleryLightboxTransform();
  };

  const setGalleryZoom = (nextZoom) => {
    const safeZoom = Math.max(galleryMinZoom, Math.min(galleryMaxZoom, nextZoom));
    galleryZoom = safeZoom;
    if (galleryZoom <= galleryMinZoom) {
      galleryPanX = 0;
      galleryPanY = 0;
      galleryDragState = null;
    }
    updateGalleryLightboxTransform();
  };

  const onGalleryLightboxKeydown = (e) => {
    if (e.key === "Escape") {
      closeGalleryLightbox();
      return;
    }
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      setGalleryZoom(galleryZoom + galleryZoomStep);
      return;
    }
    if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      setGalleryZoom(galleryZoom - galleryZoomStep);
      return;
    }
    if (e.key === "0") {
      e.preventDefault();
      resetGalleryZoom();
      return;
    }
    if (galleryImageElements.length <= 1) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      openGalleryLightboxByIndex(galleryLightboxIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      openGalleryLightboxByIndex(galleryLightboxIndex - 1);
    }
  };

  const closeGalleryLightbox = () => {
    const overlay = document.getElementById("gallery-lightbox");
    if (!overlay) return;
    overlay.remove();
    document.body.classList.remove("no-scroll");
    document.removeEventListener("keydown", onGalleryLightboxKeydown);
    galleryDragState = null;
  };

  const openGalleryLightboxByIndex = (requestedIndex) => {
    if (galleryImageElements.length === 0) return;
    const safeIndex = getWrappedGalleryIndex(requestedIndex);
    const targetImage = galleryImageElements[safeIndex];
    if (!targetImage) return;
    const src = targetImage.src;
    const altText = targetImage.alt || data.title;
    galleryLightboxIndex = safeIndex;

    closeGalleryLightbox();
    resetGalleryZoom();

    const totalImages = galleryImageElements.length;
    const canNavigate = totalImages > 1;

    const overlay = document.createElement("div");
    overlay.id = "gallery-lightbox";
    overlay.className = "gallery-lightbox";
    overlay.innerHTML = `
      <div class="gallery-lightbox-backdrop" data-close-lightbox="true"></div>
      <figure class="gallery-lightbox-content" role="dialog" aria-modal="true" aria-label="Gallery image preview">
        <button class="gallery-lightbox-close" type="button" aria-label="Close image preview">&times;</button>
        <div class="gallery-lightbox-zoom-controls" aria-label="Zoom controls">
          <button class="gallery-lightbox-zoom-btn" type="button" data-zoom="out" aria-label="Zoom out">-</button>
          <button class="gallery-lightbox-zoom-readout" type="button" data-zoom="reset" aria-label="Reset zoom">100%</button>
          <button class="gallery-lightbox-zoom-btn" type="button" data-zoom="in" aria-label="Zoom in">+</button>
        </div>
        ${canNavigate ? `<button class="gallery-lightbox-nav prev" type="button" data-nav="prev" aria-label="Previous image">&#8249;</button>` : ""}
        ${canNavigate ? `<button class="gallery-lightbox-nav next" type="button" data-nav="next" aria-label="Next image">&#8250;</button>` : ""}
        <img class="gallery-lightbox-image" src="${src}" alt="${altText || data.title}" />
        ${canNavigate ? `<figcaption class="gallery-lightbox-count">${safeIndex + 1} / ${totalImages}</figcaption>` : ""}
      </figure>
    `;

    overlay.addEventListener("click", (e) => {
      if (!e.target) return;
      if (e.target.dataset.closeLightbox === "true" || e.target.classList.contains("gallery-lightbox-close")) {
        closeGalleryLightbox();
        return;
      }
      if (e.target.dataset.nav === "next") {
        openGalleryLightboxByIndex(galleryLightboxIndex + 1);
        return;
      }
      if (e.target.dataset.nav === "prev") {
        openGalleryLightboxByIndex(galleryLightboxIndex - 1);
        return;
      }
      if (e.target.dataset.zoom === "in") {
        setGalleryZoom(galleryZoom + galleryZoomStep);
        return;
      }
      if (e.target.dataset.zoom === "out") {
        setGalleryZoom(galleryZoom - galleryZoomStep);
        return;
      }
      if (e.target.dataset.zoom === "reset") {
        resetGalleryZoom();
      }
    });

    document.body.appendChild(overlay);
    document.body.classList.add("no-scroll");
    document.addEventListener("keydown", onGalleryLightboxKeydown);

    const content = overlay.querySelector(".gallery-lightbox-content");
    const zoomImage = overlay.querySelector(".gallery-lightbox-image");

    if (content) {
      content.addEventListener("wheel", (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
          setGalleryZoom(galleryZoom + galleryZoomStep);
        } else {
          setGalleryZoom(galleryZoom - galleryZoomStep);
        }
      }, { passive: false });
    }

    if (zoomImage) {
      zoomImage.addEventListener("dblclick", (e) => {
        e.preventDefault();
        if (galleryZoom > 1) {
          resetGalleryZoom();
        } else {
          setGalleryZoom(2);
        }
      });

      zoomImage.addEventListener("pointerdown", (e) => {
        if (galleryZoom <= 1) return;
        e.preventDefault();
        galleryDragState = {
          startX: e.clientX,
          startY: e.clientY,
          originX: galleryPanX,
          originY: galleryPanY
        };
        if (typeof zoomImage.setPointerCapture === "function") {
          zoomImage.setPointerCapture(e.pointerId);
        }
        updateGalleryLightboxTransform();
      });

      zoomImage.addEventListener("pointermove", (e) => {
        if (!galleryDragState) return;
        galleryPanX = galleryDragState.originX + (e.clientX - galleryDragState.startX);
        galleryPanY = galleryDragState.originY + (e.clientY - galleryDragState.startY);
        updateGalleryLightboxTransform();
      });

      const finishDrag = () => {
        if (!galleryDragState) return;
        galleryDragState = null;
        updateGalleryLightboxTransform();
      };

      zoomImage.addEventListener("pointerup", finishDrag);
      zoomImage.addEventListener("pointercancel", finishDrag);
      zoomImage.addEventListener("pointerleave", finishDrag);
    }

    updateGalleryLightboxTransform();
  };

  galleryImageElements.forEach((imgEl, idx) => {
    imgEl.addEventListener("click", () => openGalleryLightboxByIndex(idx));
  });

  app.querySelectorAll("[data-gallery-jump='true']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.getElementById("project-gallery");
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.remove("gallery-arrive");
      window.setTimeout(() => target.classList.add("gallery-arrive"), 320);
      window.setTimeout(() => target.classList.remove("gallery-arrive"), 1450);
    });
  });

  if (likeBtn && likesCount) {
    likeBtn.textContent = likeEmoji;
    likeBtn.addEventListener("click", async () => {
      if (!likesEnabled) return;
      const liked = getSessionValue(likeKey, "0") === "1";
      if (liked) return;

      likeBtn.setAttribute("disabled", "true");
      likeBtn.textContent = "⏳";
      if (likeStatus) likeStatus.textContent = "Submitting your feedback...";
      likeBtn.textContent = submittingEmoji;

      try {
        const newCount = await incrementLike();
        likesCount.textContent = String(newCount);
        setLocalValue(remoteLikeCacheKey, String(newCount));
        setSessionValue(likeKey, "1");
        likeBtn.classList.remove("primary");
        likeBtn.classList.add("secondary");
        likeBtn.classList.add("is-hidden");
        if (likePrompt) likePrompt.classList.add("is-hidden");
        likeBtn.textContent = "👍";
        likeBtn.setAttribute("title", "Feedback submitted");
        likeBtn.setAttribute("aria-label", "Feedback already submitted");
        likeBtn.textContent = likeEmoji;
        if (likeStatus) likeStatus.textContent = "Thank you for liking, it means a lot!";
        showThankYouOverlay();
      } catch (err) {
        likeBtn.removeAttribute("disabled");
        likeBtn.textContent = "👍";
        if (likeStatus) likeStatus.textContent = "Could not submit right now. Please try again.";
        likeBtn.textContent = likeEmoji;
      }
    });
  }
})();
