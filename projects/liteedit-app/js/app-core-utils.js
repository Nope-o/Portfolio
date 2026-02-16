export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function startsWithBytes(bytes, expected, offset = 0) {
  if (bytes.length < offset + expected.length) return false;
  for (let i = 0; i < expected.length; i += 1) {
    if (bytes[offset + i] !== expected[i]) return false;
  }
  return true;
}

export function detectSvgHeader(bytes) {
  try {
    const decoder = new TextDecoder('utf-8');
    const snippet = decoder.decode(bytes.slice(0, 256)).trimStart().toLowerCase();
    return snippet.startsWith('<svg') || (snippet.startsWith('<?xml') && snippet.includes('<svg'));
  } catch (error) {
    return false;
  }
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** unitIndex);
  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

export function distanceBetweenTouches(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.hypot(dx, dy);
}
