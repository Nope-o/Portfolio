export function drawStrokeOnCanvas(canvas, from, to, mode, size, options = {}) {
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size;

  if (mode === 'pen') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = options.penAlpha || 1;
    ctx.strokeStyle = options.penColor || '#60a5fa';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = options.highlighterAlpha || 0.35;
    ctx.strokeStyle = options.highlighterColor || '#facc15';
  }

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

export function blurBrushOnCanvas(canvas, cx, cy, radius, strength) {
  const patch = document.createElement('canvas');
  const size = Math.max(2, radius * 2);
  patch.width = size;
  patch.height = size;
  const pctx = patch.getContext('2d');
  pctx.filter = `blur(${Math.max(1, strength)}px)`;
  pctx.drawImage(canvas, cx - radius, cy - radius, size, size, 0, 0, size, size);

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(patch, cx - radius, cy - radius);
  ctx.restore();
}

export function cropCanvas(sourceCanvas, rect) {
  const width = Math.max(1, Math.round(rect.w));
  const height = Math.max(1, Math.round(rect.h));
  const cropped = document.createElement('canvas');
  cropped.width = width;
  cropped.height = height;
  cropped.getContext('2d').drawImage(
    sourceCanvas,
    Math.round(rect.x),
    Math.round(rect.y),
    width,
    height,
    0,
    0,
    width,
    height
  );
  return cropped;
}
