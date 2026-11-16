/** Choose readable text against a solid hex control background. */
export function contrastInk(background: string): string {
  const hex = background.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#FFFFFF';
  const [r, g, b] = [0, 2, 4].map(i => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Navy is preferred, but pure black covers the narrow mid-luminance range
  // where neither navy nor white reaches the 4.5:1 text contrast threshold.
  if ((luminance + 0.05) / (0.00359 + 0.05) >= 4.5) return '#070C14';
  return 1.05 / (luminance + 0.05) >= 4.5 ? '#FFFFFF' : '#000000';
}
