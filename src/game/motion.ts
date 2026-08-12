/** Gate authored scene animation without changing its enabled-motion tuning. */
export function comfortMotionSpeed(value: number, reducedMotion: boolean) {
  return reducedMotion ? 0 : value;
}
