// Shared device heuristics, evaluated once at load.
// Coarse pointer = touch-first device (phone/tablet), regardless of width.
export const IS_TOUCH =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(pointer: coarse)').matches ||
    navigator.maxTouchPoints > 0)

// "Mobile" = touch device with a phone/small-tablet viewport — the ones that
// need the lighter render path.
export const IS_MOBILE =
  IS_TOUCH &&
  typeof window !== 'undefined' &&
  Math.min(window.innerWidth, window.innerHeight) < 820
