(() => {
  const OVERLAY_ID = "app-notice-overlay";
  let activeTimer = null;

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