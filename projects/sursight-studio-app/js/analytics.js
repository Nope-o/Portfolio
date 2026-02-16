const SESSION_KEY = 'sursightAnalyticsSessionId';
const PAUSE_UNTIL_KEY = 'sursightAnalyticsPauseUntil';
const SESSION_START_KEY = 'sursightSessionStartMs';
const SESSION_END_SENT_KEY = 'sursightSessionEndSent';
const IP_CACHE_KEY = 'sursightClientIpCache';
const IP_CACHE_TS_KEY = 'sursightClientIpCacheTs';
const IP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEDUPE_MS = 2000;
const dedupeMap = new Map();
const isLocalHost = () => /^(localhost|127\.0\.0\.1)$/i.test(location.hostname || '');
const debugLog = (...args) => {
  if (isLocalHost()) console.log('[sursight-analytics]', ...args);
};
let clientIp = '';
const isPaused = () => {
  try {
    const until = parseInt(localStorage.getItem(PAUSE_UNTIL_KEY) || '', 10);
    return Number.isFinite(until) && Date.now() < until;
  } catch (_) {
    return false;
  }
};

function getEndpoint() {
  if (window.COST_SAVER_MODE === true) {
    return '';
  }
  if (typeof window.SURSIGHT_ANALYTICS_API_URL === 'string' && window.SURSIGHT_ANALYTICS_API_URL.trim()) {
    return window.SURSIGHT_ANALYTICS_API_URL.trim();
  }
  if (typeof window.ANALYTICS_API_URL === 'string' && window.ANALYTICS_API_URL.trim()) {
    return window.ANALYTICS_API_URL.trim();
  }
  return '';
}

function getSessionId() {
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
}

function getSessionStartMs() {
  const fallback = Date.now();
  try {
    const existing = parseInt(sessionStorage.getItem(SESSION_START_KEY) || '', 10);
    if (Number.isFinite(existing) && existing > 0) return existing;
    sessionStorage.setItem(SESSION_START_KEY, String(fallback));
    return fallback;
  } catch (_) {
    return fallback;
  }
}

function getDeviceType() {
  const ua = (navigator.userAgent || '').toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet';
  if (/mobi|android|iphone|ipod/.test(ua)) return 'mobile';
  return 'desktop';
}

function getBrowser() {
  const ua = navigator.userAgent || '';
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\//i.test(ua)) return 'Opera';
  if (/chrome\//i.test(ua)) return 'Chrome';
  if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) return 'Safari';
  if (/firefox\//i.test(ua)) return 'Firefox';
  return 'Other';
}

function pruneDedupe(now) {
  dedupeMap.forEach((value, key) => {
    if (now - value > DEDUPE_MS) dedupeMap.delete(key);
  });
}

function send(body) {
  if (isPaused()) {
    debugLog('Paused; skipping event');
    return;
  }
  const endpoint = getEndpoint();
  if (!endpoint) {
    debugLog('Skipped (no analytics endpoint configured)');
    return;
  }
  let parsed = null;
  try { parsed = JSON.parse(body); } catch (_) {}

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
      if (navigator.sendBeacon(endpoint, blob)) {
        debugLog('sendBeacon ok', parsed?.event || '');
        return;
      }
    }
  } catch (_) {}

  fetch(endpoint, {
    method: 'POST',
    mode: 'no-cors',
    cache: 'no-store',
    keepalive: true,
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body
  })
    .then(() => debugLog('POST sent', parsed?.event || ''))
    .catch(() => debugLog('POST failed', parsed?.event || ''));

  if (isLocalHost() && parsed) {
    try {
      const q = new URLSearchParams({
        event: parsed.event || '',
        ts: parsed.ts || '',
        session_id: parsed.session_id || '',
        page: parsed.page || ''
      });
      fetch(`${endpoint}?${q.toString()}`, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        keepalive: true
      }).then(() => debugLog('GET fallback sent', parsed.event || '')).catch(() => {});
    } catch (_) {}
  }
}

async function resolveClientIp() {
  try {
    const cachedTs = parseInt(localStorage.getItem(IP_CACHE_TS_KEY) || '', 10);
    const cachedIp = localStorage.getItem(IP_CACHE_KEY) || '';
    if (cachedIp && Number.isFinite(cachedTs) && (Date.now() - cachedTs) < IP_CACHE_TTL_MS) {
      clientIp = cachedIp;
      return;
    }
  } catch (_) {}

  const fetchIp = async (url) => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller
      ? setTimeout(() => {
          try { controller.abort(); } catch (_) {}
        }, 2500)
      : null;
    try {
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal: controller ? controller.signal : undefined
      });
      const data = await res.json();
      const ip = typeof data?.ip === 'string' ? data.ip.trim() : '';
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

  await fetchIp('https://api.ipify.org?format=json');
  if (!clientIp) {
    await fetchIp('https://api64.ipify.org?format=json');
  }
}

export function trackEvent(event, meta = {}, options = {}) {
  if (!event) return;
  const now = Date.now();
  const dedupeKey = options.dedupeKey || `${event}:${JSON.stringify(meta)}`;
  pruneDedupe(now);
  if (!options.allowDuplicate && dedupeMap.has(dedupeKey)) return;
  dedupeMap.set(dedupeKey, now);

  send(JSON.stringify({
    event,
    ts: new Date().toISOString(),
    session_id: getSessionId(),
    session_duration_sec: Math.max(0, Math.round((Date.now() - getSessionStartMs()) / 1000)),
    device_type: getDeviceType(),
    browser: getBrowser(),
    language: navigator.language || '',
    ip_address: clientIp || '',
    app: 'sursight-studio',
    page: location.pathname || '/',
    href: location.href,
    referrer: document.referrer || '',
    meta: meta && typeof meta === 'object' ? meta : {}
  }));
}

export function analyticsEnabled() {
  return Boolean(getEndpoint()) && !isPaused();
}

export function trackFeature(featureName, meta = {}) {
  if (!featureName || typeof featureName !== 'string') return;
  trackEvent('feature_used', {
    feature_name: featureName,
    ...meta
  });
}

export function pauseAnalyticsForMinutes(minutes = 30) {
  try {
    const ms = Math.max(1, Number(minutes) || 30) * 60 * 1000;
    localStorage.setItem(PAUSE_UNTIL_KEY, String(Date.now() + ms));
  } catch (_) {}
}

export function resumeAnalytics() {
  try {
    localStorage.removeItem(PAUSE_UNTIL_KEY);
  } catch (_) {}
}

if (getEndpoint()) {
  resolveClientIp().catch(() => {});
}

const sendSessionEnd = () => {
  try {
    if (sessionStorage.getItem(SESSION_END_SENT_KEY) === '1') return;
    sessionStorage.setItem(SESSION_END_SENT_KEY, '1');
  } catch (_) {}
  trackEvent('session_ended', {}, { dedupeKey: 'session_end_once', allowDuplicate: false });
};
window.addEventListener('pagehide', sendSessionEnd, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') sendSessionEnd();
});
