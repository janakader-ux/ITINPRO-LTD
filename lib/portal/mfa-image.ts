// Supabase may provide an SVG data URL or raw SVG. Preserve an existing URL:
// encoding it again turns the QR image into text and prevents it from loading.
export function authenticatorQrSource(value: string) {
  if (/^data:image\/svg\+xml(?:;|,)/i.test(value)) return value;
  if (/^\s*<svg[\s>]/i.test(value)) return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`;
  return '';
}
