export type PlayerPlanarPosition = {
  x: number;
  y: number;
  z: number;
};

export type PlayerBounds = {
  minimumX: number;
  maximumX: number;
  minimumZ: number;
  maximumZ: number;
};

/**
 * Keep the published gameplay position in lockstep with the physics body.
 * Rapier can be corrected after velocity integration; callers should publish
 * this bounded value rather than the stale pre-correction translation.
 */
export function clampPlayerPosition(
  position: PlayerPlanarPosition,
  bounds: PlayerBounds,
): PlayerPlanarPosition {
  return {
    x: Math.max(bounds.minimumX, Math.min(bounds.maximumX, position.x)),
    y: position.y,
    z: Math.max(bounds.minimumZ, Math.min(bounds.maximumZ, position.z)),
  };
}
