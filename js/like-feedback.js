(() => {
  const STYLE_ID = "like-thankyou-overlay-style";
  const OVERLAY_ID = "thankyou-overlay";
  let activeTimer = null;

  const ensureStyles = () => {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;

    const styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    styleEl.textContent = `
      .thankyou-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(15, 23, 42, 0.18);
        backdrop-filter: blur(4px);
        animation: overlayFadeIn 220ms ease-out;
      }
      .thankyou-box {
        background: linear-gradient(145deg, #ffffff, #eaf2ff);
        border: 1px solid #bfd5ff;
        border-radius: 18px;
        padding: 20px 24px;
        box-shadow: 0 20px 48px rgba(15, 63, 122, 0.22);
        text-align: center;
        animation: popIn 320ms cubic-bezier(.2,.7,.2,1);
      }
      .thankyou-emoji {
        font-size: 2rem;
        display: inline-block;
        animation: pulse 900ms ease-in-out infinite;
      }
      .thankyou-title {
        margin: 8px 0 4px;
        font-size: 1.2rem;
        font-weight: 800;
        color: #102a53;
      }
      .thankyou-text {
        margin: 0;
        color: #334155;
      }
      @keyframes overlayFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes popIn {
        from { transform: translateY(8px) scale(0.96); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.06); }
      }
    `;
    document.head.appendChild(styleEl);
  };

  const removeOverlay = () => {
    if (typeof document === "undefined") return;
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();
    if (activeTimer !== null) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
  };

  const showLikeThankYouOverlay = (options = {}) => {
    if (typeof document === "undefined") return;
    ensureStyles();
    removeOverlay();

    const title = typeof options.title === "string" ? options.title : "Thank You!";
    const message = typeof options.message === "string" ? options.message : "Your like means a lot.";
    const emoji = typeof options.emoji === "string" ? options.emoji : "🎉";
    const duration = Number.isFinite(options.durationMs) ? Math.max(0, options.durationMs) : 1700;

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.className = "thankyou-overlay";
    overlay.innerHTML = `
      <div class="thankyou-box">
        <span class="thankyou-emoji">${emoji}</span>
        <h3 class="thankyou-title">${title}</h3>
        <p class="thankyou-text">${message}</p>
      </div>
    `;

    document.body.appendChild(overlay);
    activeTimer = window.setTimeout(() => {
      overlay.remove();
      activeTimer = null;
    }, duration);
  };

  window.showLikeThankYouOverlay = showLikeThankYouOverlay;
  window.ProjectLikeFeedback = Object.freeze({
    show: showLikeThankYouOverlay,
    hide: removeOverlay
  });
})();
