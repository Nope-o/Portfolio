(() => {
  const OVERLAY_ID = "app-notice-overlay";
  const STYLE_ID = "app-notice-overlay-style";
  let activeTimer = null;

  const ensureStyles = () => {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;

    const styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    styleEl.textContent = `
      .app-notice-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        pointer-events: none;
        animation: appNoticeFadeIn 220ms ease-out;
      }
      .app-notice-overlay.notice-success {
        background: rgba(34, 197, 94, 0.12);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
      }
      .app-notice-overlay.notice-error {
        background: rgba(239, 68, 68, 0.16);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
      }
      .app-notice-overlay.notice-info {
        background: rgba(59, 130, 246, 0.14);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
      }
      .app-notice-box {
        pointer-events: none;
        max-width: min(92vw, 620px);
        width: fit-content;
        text-align: center;
        border-radius: 18px;
        padding: 18px 22px 16px;
        border: 1px solid rgba(148, 163, 184, 0.38);
        box-shadow: 0 18px 44px rgba(15, 23, 42, 0.24);
        animation: appNoticePopIn 320ms cubic-bezier(.2,.72,.2,1);
      }
      body[data-theme="light"] .app-notice-box {
        background: linear-gradient(145deg, #ffffff, #edf4ff);
        color: #0f172a;
      }
      body[data-theme="dark"] .app-notice-box,
      body:not([data-theme]) .app-notice-box {
        background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.92));
        color: #e2e8f0;
        border-color: rgba(148, 163, 184, 0.24);
      }
      .app-notice-emoji {
        display: inline-block;
        font-size: clamp(1.7rem, 4vw, 2.15rem);
        line-height: 1;
        margin-bottom: 6px;
      }
      .app-notice-title {
        margin: 0;
        font-size: clamp(1.16rem, 2.8vw, 1.42rem);
        font-weight: 800;
        line-height: 1.2;
      }
      .app-notice-text {
        margin: 6px 0 0;
        font-size: clamp(0.95rem, 2.35vw, 1.08rem);
        line-height: 1.42;
      }
      body[data-theme="light"] .app-notice-text {
        color: #334155;
      }
      body[data-theme="dark"] .app-notice-text,
      body:not([data-theme]) .app-notice-text {
        color: #cbd5e1;
      }
      @keyframes appNoticeFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes appNoticePopIn {
        from { opacity: 0; transform: translateY(10px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
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

  const createTextNode = (tagName, className, text) => {
    const el = document.createElement(tagName);
    el.className = className;
    el.textContent = text;
    return el;
  };

  const showAppNotice = (options = {}) => {
    if (typeof document === "undefined") return;
    ensureStyles();
    removeOverlay();

    const variant = options.variant === "error" || options.variant === "info" ? options.variant : "success";
    const title = typeof options.title === "string" && options.title.trim() ? options.title.trim() : "Thank You!";
    const message = typeof options.message === "string" && options.message.trim()
      ? options.message.trim()
      : "Your feedback means a lot.";
    const emoji = typeof options.emoji === "string" && options.emoji.trim() ? options.emoji : "\uD83C\uDF89";
    const duration = Number.isFinite(options.durationMs) ? Math.max(0, options.durationMs) : 1700;

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.className = `app-notice-overlay notice-${variant}`;

    const box = document.createElement("div");
    box.className = "app-notice-box";
    box.appendChild(createTextNode("span", "app-notice-emoji", emoji));
    box.appendChild(createTextNode("h3", "app-notice-title", title));
    box.appendChild(createTextNode("p", "app-notice-text", message));
    overlay.appendChild(box);

    document.body.appendChild(overlay);
    activeTimer = window.setTimeout(() => {
      removeOverlay();
    }, duration);
  };

  const showLikeThankYouOverlay = (options = {}) => {
    showAppNotice({
      variant: "success",
      title: typeof options.title === "string" ? options.title : "Thank You!",
      message: typeof options.message === "string" ? options.message : "Your like means a lot.",
      emoji: typeof options.emoji === "string" ? options.emoji : "\uD83C\uDF89",
      durationMs: options.durationMs
    });
  };

  window.showAppNotice = showAppNotice;
  window.showLikeThankYouOverlay = showLikeThankYouOverlay;
  window.ProjectLikeFeedback = Object.freeze({
    show: showLikeThankYouOverlay,
    showNotice: showAppNotice,
    hide: removeOverlay
  });
})();
