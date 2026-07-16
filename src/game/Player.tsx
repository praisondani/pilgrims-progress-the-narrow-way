import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CapsuleCollider, RapierRigidBody, RigidBody } from '@react-three/rapier'
import { Group, Vector3 } from 'three'
import { useGame } from './state'
import { storyScenes } from './story'
import { Character } from './Visuals'
import { gameAudio } from './audio'

const keys = new Set<string>()
export const mobileInput = { x: 0, z: 0 }
export const playerPosition = new Vector3(0, 1.2, 7)

export function Player() {
  const body = useRef<RapierRigidBody>(null); const model = useRef<Group>(null)
  const [walking,setWalking]=useState(false);const walkingRef=useRef(false)
  const { paused, burden, sceneIndex, puzzleActive, dialogue, choosing } = useGame()
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.add(e.code)
      if (e.code === 'KeyE') useGame.getState().interact()
      if (e.code === 'Space') body.current?.applyImpulse({ x: 0, y: 3.8, z: 0 }, true)
    }
    const up = (e: KeyboardEvent) => keys.delete(e.code)
    addEventListener('keydown', down); addEventListener('keyup', up)
    return () => { removeEventListener('keydown', down); removeEventListener('keyup', up); keys.clear() }
  }, [])
  useFrame(() => {
    if (!body.current || paused||puzzleActive||dialogue||choosing) { if (body.current) body.current.setLinvel({ x: 0, y: body.current.linvel().y, z: 0 }, true); return }
    const x = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + mobileInput.x
    const z = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')) + mobileInput.z
    const dir = new Vector3(x, 0, z).normalize(); const p = body.current.translation(); const velocity = body.current.linvel()
    const moving=dir.lengthSq()>0;if(moving!==walkingRef.current){walkingRef.current=moving;setWalking(moving)}
    const inSlough = storyScenes[sceneIndex].id === 'slough'; const speed = (inSlough ? 2.1 : keys.has('ShiftLeft') ? 5.2 : 3.5) * (burden ? .88 : 1)
    gameAudio.walking(moving,inSlough)
    body.current.setLinvel({ x: dir.x * speed, y: velocity.y, z: dir.z * speed }, true)
    if (dir.lengthSq() && model.current) model.current.rotation.y = Math.atan2(dir.x, dir.z)
    const clampedX = Math.max(-7.2, Math.min(7.2, p.x)); const clampedZ = Math.max(-7.2, Math.min(7.2, p.z))
    if (clampedX !== p.x || clampedZ !== p.z) body.current.setTranslation({ x: clampedX, y: p.y, z: clampedZ }, true)
    if (p.y < -3) body.current.setTranslation({ x: 0, y: 1.2, z: 7 }, true)
    playerPosition.set(p.x, p.y, p.z)
  })
  return <RigidBody ref={body} position={[0, 1.2, 7]} colliders={false} enabledRotations={[false, false, false]}>
    <CapsuleCollider args={[.42, .38]} />
    <group ref={model}><Character variant="christian" walking={walking} burden={burden>0}/></group>
  </RigidBody>
}
