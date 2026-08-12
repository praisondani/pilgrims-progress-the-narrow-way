/** Return the authored particle drift while respecting the comfort setting. */
export function atmosphericLifeRotation(
  elapsedSeconds: number,
  reducedMotion: boolean,
) {
  return reducedMotion ? 0 : elapsedSeconds * 0.012;
}

/** Return the subtle lateral drift used by Chapter II's atmospheric motes. */
export function atmosphericLifeOffset(
  elapsedSeconds: number,
  reducedMotion: boolean,
) {
  return reducedMotion ? 0 : Math.sin(elapsedSeconds * 0.08) * 0.4;
}
