import { Canvas, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { PerspectiveCamera } from '@react-three/drei'
import { useRef } from 'react'
import { PerspectiveCamera as PerspectiveCameraType, Vector3 } from 'three'
import { Player, playerPosition } from './Player'
import { World } from './World'

function CameraRig() {
  const rig = useRef<PerspectiveCameraType>(null); const desired = new Vector3()
  useFrame((_, dt) => {
    if (!rig.current) return
    desired.set(playerPosition.x, playerPosition.y + 4.8, playerPosition.z + 8)
    rig.current.position.lerp(desired, 1 - Math.exp(-4 * dt)); rig.current.lookAt(playerPosition.x, playerPosition.y + .8, playerPosition.z - 2)
  })
  return <PerspectiveCamera ref={rig} makeDefault fov={48} position={[0, 5, 12]} />
}
export function GameCanvas() { return <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}><Physics gravity={[0, -12, 0]}><World /><Player /></Physics><CameraRig /></Canvas> }
