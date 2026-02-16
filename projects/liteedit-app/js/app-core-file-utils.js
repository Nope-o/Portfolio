import { detectSvgHeader, startsWithBytes } from './app-core-utils.js';

const MIME_FROM_EXTENSION = new Map([
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['jfif', 'image/jpeg'],
  ['png', 'image/png'],
  ['webp', 'image/webp'],
  ['avif', 'image/avif'],
  ['gif', 'image/gif'],
  ['bmp', 'image/bmp'],
  ['tif', 'image/tiff'],
  ['tiff', 'image/tiff'],
  ['svg', 'image/svg+xml']
]);

export async function sniffImageMimeType(file) {
  if (!file || typeof file.slice !== 'function') return '';
  let bytes;
  try {
    const header = await file.slice(0, 64).arrayBuffer();
    bytes = new Uint8Array(header);
  } catch (error) {
    return '';
  }

  if (startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) || startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) return 'image/gif';
  if (startsWithBytes(bytes, [0x42, 0x4d])) return 'image/bmp';
  if (startsWithBytes(bytes, [0x49, 0x49, 0x2a, 0x00]) || startsWithBytes(bytes, [0x4d, 0x4d, 0x00, 0x2a])) return 'image/tiff';
  if (startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWithBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp';
  if (startsWithBytes(bytes, [0x00, 0x00, 0x00], 0) && startsWithBytes(bytes, [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], 4)) return 'image/avif';
  if (detectSvgHeader(bytes)) return 'image/svg+xml';
  return '';
}

export function inferMimeTypeFromExtension(fileName = '') {
  const dot = fileName.lastIndexOf('.');
  if (dot < 0) return '';
  const ext = fileName.slice(dot + 1).toLowerCase();
  return MIME_FROM_EXTENSION.get(ext) || '';
}

export function normalizeImageMimeType(file, sniffedMime = '') {
  if (sniffedMime && sniffedMime.startsWith('image/')) return sniffedMime;
  if (file && file.type && file.type.startsWith('image/')) return file.type;
  return inferMimeTypeFromExtension(file && file.name ? file.name : '');
}

export function isLikelyImageFile(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith('image/')) return true;
  return /\.(jpe?g|jfif|png|webp|avif|bmp|gif|tiff?|svg)$/i.test(file.name || '');
}
