// Deterministic pseudo-QR module matrix — decorative only.
// Deterministic (no Math.random / Date) so SSR and client render identically
// and never trigger a hydration mismatch.
export function qrMatrix(size = 23): boolean[][] {
  const m: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || x === 6 || y === 0 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        m[oy + y][ox + x] = edge || core;
      }
    }
  };

  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inFinder =
        (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9);
      if (inFinder) continue;
      m[y][x] =
        (x * 7 + y * 13 + x * y * 3) % 5 === 0 ||
        ((x + y) % 3 === 0 && (x * y) % 2 === 0);
    }
  }

  return m;
}
