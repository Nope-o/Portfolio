
const NAV_TABS = [
  { id: 'about', label: 'About' },
  { id: 'journey', label: 'Life Journey', mobileLabel: 'Life' },
  { id: 'projects', label: 'Projects', mobileLabel: 'Projects' },
  { id: 'resume', label: 'Resume', mobileLabel: 'Resume' },
  { id: 'contact', label: 'Contact', mobileLabel: 'Contact' },
  { id: 'privacy', label: 'Privacy Policy', mobileLabel: 'Privacy' }
];

const GRID_SIZE = 7;
const SWIPE_THRESHOLD = 60;
const SCROLL_DOWN_THRESHOLD = 70;
const SCROLL_UP_THRESHOLD = 70;

// Cost saver mode:
// true  -> disable remote likes/analytics/IP logging (minimum backend cost)
// false -> use the endpoints configured below
window.COST_SAVER_MODE = false;

window.LIKES_API_URL = window.COST_SAVER_MODE
  ? ""
  : "https://script.google.com/macros/s/AKfycbw781JrZ16xPrhfC-Q70Bf_dccg_aOpolxtgY0wcFt4WJy7UVNeiyp7bFPAEU4sQ15l/exec";

// Optional analytics endpoint (Google Apps Script web app URL).
window.ANALYTICS_API_URL = window.COST_SAVER_MODE
  ? ""
  : "https://script.google.com/macros/s/AKfycbzYC8ALFxcSincB76_u1bWqpUlKZZVL-epqjY0S1IblSIiORUFyP3xdkNww1UxgdfpNiA/exec";

// Optional IP log endpoint (for App.js lightweight log events).
window.IP_LOG_ENDPOINT = window.COST_SAVER_MODE
  ? ""
  : "https://ip-logger.madhavkataria000.workers.dev/";
