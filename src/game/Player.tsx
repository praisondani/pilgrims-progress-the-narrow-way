import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CapsuleCollider, RapierRigidBody, RigidBody } from '@react-three/rapier'
import { Group, Vector3 } from 'three'
import { useGame } from './state'

const keys = new Set<string>()
export const mobileInput = { x: 0, z: 0 }
export const playerPosition = new Vector3(0, 1.2, 4)

export function Player() {
  const body = useRef<RapierRigidBody>(null)
  const model = useRef<Group>(null)
  const paused = useGame((s) => s.paused)
  const enterChapter = useGame((s) => s.enterChapter)
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.add(e.code); if (e.code === 'Space') body.current?.applyImpulse({ x: 0, y: 4.2, z: 0 }, true) }
    const up = (e: KeyboardEvent) => keys.delete(e.code)
    addEventListener('keydown', down); addEventListener('keyup', up)
    return () => { removeEventListener('keydown', down); removeEventListener('keyup', up) }
  }, [])
  useFrame((_, dt) => {
    if (!body.current || paused) return
    const x = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + mobileInput.x
    const z = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')) + mobileInput.z
    const dir = new Vector3(x, 0, z).normalize(); const p = body.current.translation(); const mud = p.z < -17 && p.z > -31
    const speed = mud ? 2.2 : (keys.has('ShiftLeft') ? 6 : 4)
    const velocity = body.current.linvel(); body.current.setLinvel({ x: dir.x * speed, y: velocity.y, z: dir.z * speed }, true)
    playerPosition.set(p.x, p.y, p.z)
    if (dir.lengthSq() && model.current) model.current.rotation.y = Math.atan2(dir.x, dir.z)
    if (p.z < -8 && p.z > -17) enterChapter('field'); else if (p.z <= -17 && p.z > -32) enterChapter('slough'); else if (p.z <= -32) enterChapter('gate')
    if (p.y < -5) body.current.setTranslation({ x: 0, y: 2, z: Math.max(-16, p.z + 4) }, true)
    body.current.setLinearDamping(Math.min(10, 4 * dt + 0.3))
  })
  return <RigidBody ref={body} position={[0, 1.2, 4]} colliders={false} enabledRotations={[false, false, false]}>
    <CapsuleCollider args={[0.42, 0.38]} />
    <group ref={model}>
      <mesh castShadow position={[0, .82, 0]}><capsuleGeometry args={[.34, .82, 6, 12]} /><meshStandardMaterial color="#8f4939" roughness={.9} /></mesh>
      <mesh castShadow position={[0, 1.48, 0]}><sphereGeometry args={[.3, 18, 18]} /><meshStandardMaterial color="#b97855" /></mesh>
      <mesh castShadow position={[0, .95, .34]} rotation={[.25, 0, 0]}><boxGeometry args={[.72, .82, .42]} /><meshStandardMaterial color="#463027" roughness={1} /></mesh>
    </group>
  </RigidBody>
}
