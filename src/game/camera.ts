export const cameraControl = { yaw: 0, resetRequested: false };

export const playerMotion = { yaw: Math.PI, moving: false };

export const playerImpact = {
  revision: 0,
  x: 0,
  z: 0,
};

export function requestPlayerImpact(x: number, z: number) {
  playerImpact.x = x;
  playerImpact.z = z;
  playerImpact.revision += 1;
}
