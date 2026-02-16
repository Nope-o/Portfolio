(function renderProjectDetails() {
  const app = document.getElementById("project-root");
  if (!app) return;

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
  const likeKey = `projectLiked:${slug}`;
  const remoteLikeCacheKey = `projectRemoteLike:${slug}`;

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
      <div class="brand">
        <a class="brand-link" href="../../index.html" aria-label="Go to home page">
          <img src="${data.logoImage || "../../assets/images/logoo.webp"}" alt="Logo" />
        </a>
        <h1>Project Details</h1>
      </div>
    </header>

    <section class="card like-compact like-strip">
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

    <section class="hero">
      <div class="hero-media">
        <img class="hero-img ${heroFitClass}" src="${data.heroImage}" alt="${data.title}" />
      </div>
      <div class="hero-body">
        <h2 class="hero-title">${data.title}</h2>
        <p class="hero-subtitle">${data.subtitle || ""}</p>
        <div class="meta">
          <span class="pill ${visibilityClass}">${data.visibility || "Internal"}</span>
          <span class="pill info">Created: ${data.createdOn || "N/A"}</span>
          <span class="pill info">Status: ${data.status || "Active"}</span>
        </div>
      </div>
    </section>

    <section class="grid">
      ${hasOverview ? `
      <article class="card">
        <h2>Overview</h2>
        <p>${data.overview}</p>
      </article>` : ""}
      ${hasRequirements ? `
      <article class="card">
        <h2>Requirement</h2>
        <ul class="list">
          ${requirements.map((item) => `<li>${item}</li>`).join("")}
        </ul>
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
      ${hasLinks ? `
      <article class="card">
        <h2>Links</h2>
        <div class="actions">
          ${links
            .map(
              (link, idx) => `
                <a
                  class="action ${idx === 0 ? "primary" : "secondary"}"
                  href="${link.href}"
                  ${link.external ? 'target="_blank" rel="noopener noreferrer"' : ""}
                >
                  ${link.label}
                </a>
              `
            )
            .join("")}
        </div>
      </article>` : ""}
    </section>

    ${hasGallery ? `
    <section class="card" style="margin-top: 12px;">
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

  const closeGalleryLightbox = () => {
    const overlay = document.getElementById("gallery-lightbox");
    if (!overlay) return;
    overlay.remove();
    document.body.classList.remove("no-scroll");
  };

  const openGalleryLightbox = (src, altText) => {
    closeGalleryLightbox();

    const overlay = document.createElement("div");
    overlay.id = "gallery-lightbox";
    overlay.className = "gallery-lightbox";
    overlay.innerHTML = `
      <div class="gallery-lightbox-backdrop" data-close-lightbox="true"></div>
      <figure class="gallery-lightbox-content" role="dialog" aria-modal="true" aria-label="Gallery image preview">
        <button class="gallery-lightbox-close" type="button" aria-label="Close image preview">&times;</button>
        <img src="${src}" alt="${altText || data.title}" />
      </figure>
    `;

    overlay.addEventListener("click", (e) => {
      if (e.target && (e.target.dataset.closeLightbox === "true" || e.target.classList.contains("gallery-lightbox-close"))) {
        closeGalleryLightbox();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeGalleryLightbox();
    }, { once: true });

    document.body.appendChild(overlay);
    document.body.classList.add("no-scroll");
  };

  app.querySelectorAll(".gallery-image").forEach((imgEl) => {
    imgEl.addEventListener("click", () => openGalleryLightbox(imgEl.src, imgEl.alt));
  });

  if (likeBtn && likesCount) {
    likeBtn.addEventListener("click", async () => {
      if (!likesEnabled) return;
      const liked = getSessionValue(likeKey, "0") === "1";
      if (liked) return;

      likeBtn.setAttribute("disabled", "true");
      likeBtn.textContent = "⏳";
      if (likeStatus) likeStatus.textContent = "Submitting your feedback...";

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
        if (likeStatus) likeStatus.textContent = "Thank you for liking, it means a lot!";
        showThankYouOverlay();
      } catch (err) {
        likeBtn.removeAttribute("disabled");
        likeBtn.textContent = "👍";
        if (likeStatus) likeStatus.textContent = "Could not submit right now. Please try again.";
      }
    });
  }
})();
