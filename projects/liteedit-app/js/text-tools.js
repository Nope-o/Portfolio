let cachedTextDetector = null;
let cachedOcrEngine = null;
let cachedOcrEnginePromise = null;

function clampTextRect(rect, canvas) {
  const x = Math.max(0, Math.floor(rect.x));
  const y = Math.max(0, Math.floor(rect.y));
  const maxW = Math.max(0, canvas.width - x);
  const maxH = Math.max(0, canvas.height - y);
  const w = Math.max(0, Math.min(Math.ceil(rect.w), maxW));
  const h = Math.max(0, Math.min(Math.ceil(rect.h), maxH));
  return { x, y, w, h };
}

function normalizeTextDetectionResult(result, canvas) {
  const box = result && result.boundingBox;
  if (!box) return null;
  const normalized = clampTextRect({
    x: box.x || 0,
    y: box.y || 0,
    w: box.width || 0,
    h: box.height || 0
  }, canvas);
  if (normalized.w < 8 || normalized.h < 8) return null;
  return {
    x: normalized.x,
    y: normalized.y,
    w: normalized.w,
    h: normalized.h,
    text: String((result && result.rawValue) || '').trim()
  };
}

function averageColor(samples, fallback) {
  if (!samples || samples.length === 0) {
    return { ...fallback };
  }
  let r = 0;
  let g = 0;
  let b = 0;
  samples.forEach((sample) => {
    r += sample.r;
    g += sample.g;
    b += sample.b;
  });
  const total = samples.length;
  return {
    r: Math.round(r / total),
    g: Math.round(g / total),
    b: Math.round(b / total)
  };
}

function colorToCss(color) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function luminance(r, g, b) {
  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

function estimateTextReplaceColors(canvas, rect) {
  const sample = canvas.getContext('2d').getImageData(rect.x, rect.y, rect.w, rect.h).data;
  const borderPixels = [];
  const textPixels = [];
  const fallbackBg = { r: 245, g: 245, b: 245 };

  const width = rect.w;
  const height = rect.h;
  const getPixel = (x, y) => {
    const idx = ((y * width) + x) * 4;
    return {
      r: sample[idx],
      g: sample[idx + 1],
      b: sample[idx + 2],
      a: sample[idx + 3]
    };
  };

  for (let x = 0; x < width; x += 1) {
    borderPixels.push(getPixel(x, 0));
    if (height > 1) borderPixels.push(getPixel(x, height - 1));
  }
  for (let y = 1; y < height - 1; y += 1) {
    borderPixels.push(getPixel(0, y));
    if (width > 1) borderPixels.push(getPixel(width - 1, y));
  }

  const bg = averageColor(borderPixels, fallbackBg);
  const bgLum = luminance(bg.r, bg.g, bg.b);
  const threshold = 24;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const px = getPixel(x, y);
      if (px.a < 16) continue;
      const pxLum = luminance(px.r, px.g, px.b);
      if (Math.abs(pxLum - bgLum) > threshold) {
        textPixels.push(px);
      }
    }
  }

  const fallbackText = bgLum > 140
    ? { r: 24, g: 24, b: 27 }
    : { r: 240, g: 240, b: 245 };
  const fg = averageColor(textPixels, fallbackText);

  return {
    background: colorToCss(bg),
    foreground: colorToCss(fg)
  };
}

export function estimateTextStyle(canvas, selectionRect, sourceText = '') {
  if (!canvas || !selectionRect) return null;
  const rect = clampTextRect(selectionRect, canvas);
  if (rect.w < 6 || rect.h < 6) return null;
  const ctx = canvas.getContext('2d');
  const colors = estimateTextReplaceColors(canvas, rect);
  const textPadding = Math.max(2, Math.round(rect.h * 0.12));
  const maxTextWidth = Math.max(4, rect.w - (textPadding * 2));
  const maxTextHeight = Math.max(4, rect.h - (textPadding * 2));
  const fallbackText = String(sourceText || '').trim() || 'Text';
  const fontWeight = rect.h > 30 ? 600 : 500;
  const fontSize = computeFittedFontSize({
    ctx,
    text: fallbackText,
    fontWeight,
    fontFamily: resolveTextFontFamily('auto'),
    minFont: 8,
    maxFont: Math.max(8, Math.round(rect.h * 1.32)),
    maxWidth: maxTextWidth,
    maxHeight: maxTextHeight
  });
  return {
    background: colors.background,
    foreground: colors.foreground,
    fontSize,
    fontWeight
  };
}

function resolveTextFontFamily(fontFamily) {
  if (fontFamily && fontFamily !== 'auto') {
    return fontFamily;
  }
  return '"Segoe UI", Arial, Helvetica, sans-serif';
}

function measureTextHeight(ctx, text, fallbackSize) {
  const sampleText = text && text.trim() ? text : 'Mg';
  const metrics = ctx.measureText(sampleText);
  const ascent = Number.isFinite(metrics.actualBoundingBoxAscent) ? metrics.actualBoundingBoxAscent : fallbackSize * 0.8;
  const descent = Number.isFinite(metrics.actualBoundingBoxDescent) ? metrics.actualBoundingBoxDescent : fallbackSize * 0.24;
  return Math.max(1, ascent + descent);
}

function doesTextFitBounds(ctx, text, maxWidth, maxHeight, fallbackSize) {
  const width = ctx.measureText(text).width;
  const height = measureTextHeight(ctx, text, fallbackSize);
  return width <= maxWidth && height <= maxHeight;
}

function computeFittedFontSize({
  ctx,
  text,
  fontWeight,
  fontFamily,
  minFont,
  maxFont,
  maxWidth,
  maxHeight
}) {
  const content = String(text || '').trim() || 'Text';
  let low = minFont;
  let high = Math.max(minFont, Math.floor(maxFont));
  let best = minFont;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    ctx.font = `${fontWeight} ${mid}px ${fontFamily}`;
    if (doesTextFitBounds(ctx, content, maxWidth, maxHeight, mid)) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}

export function isTextDetectorSupported() {
  return typeof window.TextDetector === 'function';
}

function hasPreloadedOcrEngine() {
  return !!(window.Tesseract && typeof window.Tesseract.recognize === 'function');
}

async function ensureOcrEngineLoaded() {
  if (cachedOcrEngine && typeof cachedOcrEngine.recognize === 'function') {
    return cachedOcrEngine;
  }
  if (hasPreloadedOcrEngine()) {
    cachedOcrEngine = window.Tesseract;
    return cachedOcrEngine;
  }
  if (cachedOcrEnginePromise) {
    return cachedOcrEnginePromise;
  }

  const candidates = [
    'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js',
    'https://unpkg.com/tesseract.js@5/dist/tesseract.esm.min.js'
  ];

  cachedOcrEnginePromise = (async () => {
    for (const url of candidates) {
      try {
        const mod = await import(url);
        const engine = mod?.default || mod?.Tesseract || mod;
        if (engine && typeof engine.recognize === 'function') {
          cachedOcrEngine = engine;
          return engine;
        }
      } catch (error) {}
    }
    throw new Error('OCR engine could not be loaded.');
  })();

  try {
    return await cachedOcrEnginePromise;
  } finally {
    if (!cachedOcrEngine) {
      cachedOcrEnginePromise = null;
    }
  }
}

function normalizeOcrBBox(entry) {
  const bbox = entry?.bbox || entry?.boundingBox || entry || {};
  const x0 = Number.isFinite(bbox.x0) ? bbox.x0 : (Number.isFinite(bbox.x) ? bbox.x : (Number.isFinite(bbox.left) ? bbox.left : 0));
  const y0 = Number.isFinite(bbox.y0) ? bbox.y0 : (Number.isFinite(bbox.y) ? bbox.y : (Number.isFinite(bbox.top) ? bbox.top : 0));
  const x1 = Number.isFinite(bbox.x1) ? bbox.x1 : (Number.isFinite(bbox.right) ? bbox.right : (Number.isFinite(bbox.width) ? x0 + bbox.width : x0));
  const y1 = Number.isFinite(bbox.y1) ? bbox.y1 : (Number.isFinite(bbox.bottom) ? bbox.bottom : (Number.isFinite(bbox.height) ? y0 + bbox.height : y0));
  return {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    w: Math.abs(x1 - x0),
    h: Math.abs(y1 - y0)
  };
}

function normalizeOcrResult(result, canvas) {
  const lines = Array.isArray(result?.data?.lines) ? result.data.lines : [];
  const words = Array.isArray(result?.data?.words) ? result.data.words : [];
  const source = lines.length > 0 ? lines : words;
  return source
    .map((item) => {
      const rect = normalizeOcrBBox(item);
      const normalized = clampTextRect(rect, canvas);
      if (normalized.w < 8 || normalized.h < 8) return null;
      const text = String(item?.text || '').replace(/\s+/g, ' ').trim();
      if (!text) return null;
      return {
        x: normalized.x,
        y: normalized.y,
        w: normalized.w,
        h: normalized.h,
        text
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.y - b.y) || (a.x - b.x));
}

export async function detectTextBlocks(canvas) {
  if (isTextDetectorSupported()) {
    if (!cachedTextDetector) {
      cachedTextDetector = new window.TextDetector();
    }
    const rawResults = await cachedTextDetector.detect(canvas);
    return rawResults
      .map((result) => normalizeTextDetectionResult(result, canvas))
      .filter(Boolean)
      .sort((a, b) => (a.y - b.y) || (a.x - b.x));
  }

  const ocrEngine = await ensureOcrEngineLoaded();
  const ocrResult = await ocrEngine.recognize(canvas, 'eng');
  return normalizeOcrResult(ocrResult, canvas);
}

export function drawTextDetections(ctx, detections, selectedIndex) {
  if (!detections || detections.length === 0) return;
  detections.forEach((box, idx) => {
    const selected = idx === selectedIndex;
    ctx.save();
    ctx.lineWidth = selected ? 2 : 1.3;
    ctx.setLineDash(selected ? [] : [5, 4]);
    ctx.strokeStyle = selected ? '#facc15' : '#22d3ee';
    if (selected) {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.14)';
      ctx.fillRect(box.x, box.y, box.w, box.h);
    }
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.restore();
  });
}

export function applySmartTextReplace({
  canvas,
  selectionRect,
  sourceText,
  sourceStyle,
  replacement,
  fontFamily,
  autoFit,
  lockSourceSize = false,
  expandWidthToFit = false
}) {
  if (!canvas || !selectionRect || !replacement) {
    return { applied: false, reason: 'Missing input.' };
  }

  let rect = clampTextRect(selectionRect, canvas);
  if (rect.w < 6 || rect.h < 6) {
    return { applied: false, reason: 'Detected text box is too small.' };
  }

  const ctx = canvas.getContext('2d');
  const inferredStyle = estimateTextStyle(canvas, rect, sourceText || replacement) || {};
  const colors = {
    background: (sourceStyle && sourceStyle.background) || inferredStyle.background || '#f5f5f5',
    foreground: (sourceStyle && sourceStyle.foreground) || inferredStyle.foreground || '#111827'
  };
  const resolvedFont = resolveTextFontFamily(fontFamily);
  const fontWeight = (sourceStyle && Number.isFinite(sourceStyle.fontWeight) ? sourceStyle.fontWeight : null)
    || (inferredStyle && Number.isFinite(inferredStyle.fontWeight) ? inferredStyle.fontWeight : null)
    || (rect.h > 30 ? 600 : 500);
  const minFont = 8;
  let fontSize = Math.max(minFont, Math.round(rect.h * 0.74));
  const textPadding = Math.max(2, Math.round(rect.h * 0.12));
  let maxTextWidth = Math.max(4, rect.w - (textPadding * 2));
  const maxTextHeight = Math.max(4, rect.h - (textPadding * 2));
  const referenceText = String(sourceText || replacement || '').trim() || replacement;

  ctx.save();
  ctx.fillStyle = colors.background;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const inferredFont = computeFittedFontSize({
    ctx,
    text: referenceText,
    fontWeight,
    fontFamily: resolvedFont,
    minFont,
    maxFont: Math.max(minFont, Math.round(rect.h * 1.32)),
    maxWidth: maxTextWidth,
    maxHeight: maxTextHeight
  });
  fontSize = inferredFont;
  if (sourceStyle && Number.isFinite(sourceStyle.fontSize) && sourceStyle.fontSize > 0) {
    fontSize = Math.max(fontSize, Math.round(sourceStyle.fontSize));
  }
  if (lockSourceSize) {
    const heightAnchored = Math.max(minFont, Math.round(rect.h * 0.78));
    fontSize = Math.max(fontSize, heightAnchored);
  }

  if (expandWidthToFit) {
    ctx.font = `${fontWeight} ${fontSize}px ${resolvedFont}`;
    const neededWidth = Math.ceil(ctx.measureText(replacement).width + (textPadding * 2));
    if (neededWidth > rect.w) {
      const targetWidth = Math.min(canvas.width, neededWidth);
      let nextX = rect.x;
      if (nextX + targetWidth > canvas.width) {
        nextX = Math.max(0, canvas.width - targetWidth);
      }
      rect = clampTextRect({
        x: nextX,
        y: rect.y,
        w: targetWidth,
        h: rect.h
      }, canvas);
      maxTextWidth = Math.max(4, rect.w - (textPadding * 2));
    }
  }

  if (autoFit && !lockSourceSize) {
    const preserveMinFont = Math.max(minFont, Math.floor(fontSize * 0.9));
    fontSize = computeFittedFontSize({
      ctx,
      text: replacement,
      fontWeight,
      fontFamily: resolvedFont,
      minFont: preserveMinFont,
      maxFont: fontSize,
      maxWidth: maxTextWidth * 1.06,
      maxHeight: maxTextHeight * 1.04
    });
    ctx.font = `${fontWeight} ${fontSize}px ${resolvedFont}`;
    if (!doesTextFitBounds(ctx, replacement, maxTextWidth, maxTextHeight, fontSize)) {
      fontSize = computeFittedFontSize({
        ctx,
        text: replacement,
        fontWeight,
        fontFamily: resolvedFont,
        minFont,
        maxFont: fontSize,
        maxWidth: maxTextWidth,
        maxHeight: maxTextHeight
      });
    }
  }
  ctx.font = `${fontWeight} ${fontSize}px ${resolvedFont}`;

  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.fillStyle = colors.foreground;
  ctx.fillText(replacement, rect.x + textPadding, rect.y + (rect.h / 2));
  ctx.restore();

  return {
    applied: true,
    rect,
    style: {
      background: colors.background,
      foreground: colors.foreground,
      fontSize,
      fontWeight
    }
  };
}
