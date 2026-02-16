// Lightweight analytics helper for low-traffic static hosting.
// Sends anonymous event data only when ANALYTICS_API_URL is configured.
(function initAnalytics(global) {
  const SESSION_KEY = "mk_analytics_session_id";
  const PAUSE_UNTIL_KEY = "mk_analytics_pause_until";
  const PAGE_VIEW_KEY = "mk_analytics_pageview_sent";
  const SESSION_START_KEY = "mk_analytics_session_start";
  const SESSION_END_SENT_KEY = "mk_analytics_session_end_sent";
  const IP_CACHE_KEY = "mk_analytics_client_ip_cache";
  const IP_CACHE_TS_KEY = "mk_analytics_client_ip_cache_ts";
  const IP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const DEDUPE_WINDOW_MS = 2000;
  const dedupeMap = new Map();
  let clientIp = "";

  const getEndpoint = () => {
    if (global.COST_SAVER_MODE === true) {
      return "";
    }
    if (typeof global.ANALYTICS_API_URL === "string" && global.ANALYTICS_API_URL.trim()) {
      return global.ANALYTICS_API_URL.trim();
    }
    return "";
  };
  const isPaused = () => {
    try {
      const until = parseInt(localStorage.getItem(PAUSE_UNTIL_KEY) || "", 10);
      return Number.isFinite(until) && Date.now() < until;
    } catch (_) {
      return false;
    }
  };
  const isLocalHost = () => /^(localhost|127\.0\.0\.1)$/i.test(location.hostname || "");
  const debugLog = (...args) => {
    if (isLocalHost()) console.log("[analytics]", ...args);
  };

  const nowIso = () => new Date().toISOString();
  const getDeviceType = () => {
    const ua = (navigator.userAgent || "").toLowerCase();
    if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet";
    if (/mobi|android|iphone|ipod/.test(ua)) return "mobile";
    return "desktop";
  };
  const getBrowser = () => {
    const ua = navigator.userAgent || "";
    if (/edg\//i.test(ua)) return "Edge";
    if (/opr\//i.test(ua)) return "Opera";
    if (/chrome\//i.test(ua)) return "Chrome";
    if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) return "Safari";
    if (/firefox\//i.test(ua)) return "Firefox";
    return "Other";
  };

  const getSessionId = () => {
    try {
      let id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (_) {
      return `s-${Math.random().toString(36).slice(2, 10)}`;
    }
  };

  const pruneDedupe = (ts) => {
    dedupeMap.forEach((value, key) => {
      if (ts - value > DEDUPE_WINDOW_MS) dedupeMap.delete(key);
    });
  };

  const sendEvent = (payload) => {
    if (isPaused()) {
      debugLog("Paused; skipping event", payload?.event || "");
      return;
    }
    const endpoint = getEndpoint();
    if (!endpoint) {
      debugLog("Skipped (no ANALYTICS_API_URL configured)");
      return;
    }
    const body = JSON.stringify(payload);

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
        if (navigator.sendBeacon(endpoint, blob)) {
          debugLog("sendBeacon ok", payload.event);
          return;
        }
      }
    } catch (_) {}

    fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      cache: "no-store",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body
    })
      .then(() => debugLog("POST sent", payload.event))
      .catch(() => {
        debugLog("POST failed", payload.event);
      });

    // Extra localhost fallback for easier testing against simple doGet handlers.
    if (isLocalHost()) {
      try {
        const q = new URLSearchParams({
          event: payload.event || "",
          ts: payload.ts || "",
          session_id: payload.session_id || "",
          page: payload.page || ""
        });
        fetch(`${endpoint}?${q.toString()}`, {
          method: "GET",
          mode: "no-cors",
          cache: "no-store",
          keepalive: true
        }).then(() => debugLog("GET fallback sent", payload.event)).catch(() => {});
      } catch (_) {}
    }
  };

  const getSessionStartMs = () => {
    const fallback = Date.now();
    try {
      const existing = parseInt(sessionStorage.getItem(SESSION_START_KEY) || "", 10);
      if (Number.isFinite(existing) && existing > 0) return existing;
      sessionStorage.setItem(SESSION_START_KEY, String(fallback));
      return fallback;
    } catch (_) {
      return fallback;
    }
  };

  const resolveClientIp = async () => {
    try {
      const cachedTs = parseInt(localStorage.getItem(IP_CACHE_TS_KEY) || "", 10);
      const cachedIp = localStorage.getItem(IP_CACHE_KEY) || "";
      if (cachedIp && Number.isFinite(cachedTs) && (Date.now() - cachedTs) < IP_CACHE_TTL_MS) {
        clientIp = cachedIp;
        return;
      }
    } catch (_) {}

    const fetchIp = async (url) => {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutId = controller
        ? setTimeout(() => {
            try { controller.abort(); } catch (_) {}
          }, 2500)
        : null;
      try {
        const res = await fetch(url, {
          method: "GET",
          cache: "no-store",
          signal: controller ? controller.signal : undefined
        });
        const data = await res.json();
        const ip = typeof data?.ip === "string" ? data.ip.trim() : "";
        if (ip) {
          clientIp = ip;
          try {
            localStorage.setItem(IP_CACHE_KEY, ip);
            localStorage.setItem(IP_CACHE_TS_KEY, String(Date.now()));
          } catch (_) {}
        }
      } catch (_) {
        // silent
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    await fetchIp("https://api.ipify.org?format=json");
    if (!clientIp) {
      await fetchIp("https://api64.ipify.org?format=json");
    }
  };

  const track = (event, meta = {}, options = {}) => {
    if (!event || typeof event !== "string") return;
    const ts = Date.now();
    const dedupeKey = options.dedupeKey || `${event}:${JSON.stringify(meta)}`;
    pruneDedupe(ts);
    if (!options.allowDuplicate && dedupeMap.has(dedupeKey)) return;
    dedupeMap.set(dedupeKey, ts);

    sendEvent({
      event,
      ts: nowIso(),
      session_id: getSessionId(),
      session_duration_sec: Math.max(0, Math.round((Date.now() - getSessionStartMs()) / 1000)),
      device_type: getDeviceType(),
      browser: getBrowser(),
      language: navigator.language || "",
      ip_address: clientIp || "",
      page: location.pathname || "/",
      href: location.href,
      referrer: document.referrer || "",
      meta: meta && typeof meta === "object" ? meta : {}
    });
  };

  const trackFeature = (featureName, meta = {}) => {
    if (!featureName || typeof featureName !== "string") return;
    track("feature_used", {
      feature_name: featureName,
      ...meta
    });
  };

  global.analytics = {
    track,
    trackFeature,
    getSessionId,
    isEnabled: () => Boolean(getEndpoint()) && !isPaused(),
    pauseForMinutes: (minutes = 30) => {
      try {
        const ms = Math.max(1, Number(minutes) || 30) * 60 * 1000;
        localStorage.setItem(PAUSE_UNTIL_KEY, String(Date.now() + ms));
      } catch (_) {}
    },
    resume: () => {
      try {
        localStorage.removeItem(PAUSE_UNTIL_KEY);
      } catch (_) {}
    },
    isPaused
  };

  if (getEndpoint()) {
    resolveClientIp().catch(() => {});
  }

  try {
    if (!sessionStorage.getItem(PAGE_VIEW_KEY)) {
      sessionStorage.setItem(PAGE_VIEW_KEY, "1");
      track("page_view", {
        title: document.title || "",
        host: location.host || ""
      }, { dedupeKey: "page_view_once", allowDuplicate: false });
    }
  } catch (_) {
    track("page_view", { title: document.title || "", host: location.host || "" }, { dedupeKey: "page_view_once", allowDuplicate: false });
  }

  const sendSessionEnd = () => {
    try {
      if (sessionStorage.getItem(SESSION_END_SENT_KEY) === "1") return;
      sessionStorage.setItem(SESSION_END_SENT_KEY, "1");
    } catch (_) {}
    track("session_ended", {}, { dedupeKey: "session_end_once", allowDuplicate: false });
  };
  window.addEventListener("pagehide", sendSessionEnd, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendSessionEnd();
  });
})(window);
