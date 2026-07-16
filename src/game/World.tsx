import { Float, Sparkles, Text } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Group } from 'three'
import { useGame } from './state'
import { StepKind, storyScenes } from './story'
import { playerPosition } from './Player'

function TargetShape({ kind, light }: { kind: StepKind; light: string }) {
  if (kind === 'person') return <><mesh castShadow position={[0, .65, 0]}><capsuleGeometry args={[.28, .6]} /><meshStandardMaterial color="#64779b" /></mesh><mesh castShadow position={[0, 1.32, 0]}><sphereGeometry args={[.24, 14, 14]} /><meshStandardMaterial color="#b98566" /></mesh></>
  if (kind === 'gate') return <mesh castShadow position={[0, 1, 0]}><boxGeometry args={[1.3, 2.1, .3]} /><meshStandardMaterial color="#9a6438" emissive="#633c1c" emissiveIntensity={.5} /></mesh>
  if (kind === 'cross') return <group position={[0, 1.3, 0]}><mesh><boxGeometry args={[.28, 2.8, .28]} /><meshStandardMaterial color="#7c5a3b" /></mesh><mesh position={[0,.45,0]}><boxGeometry args={[1.5,.28,.28]} /><meshStandardMaterial color="#7c5a3b" /></mesh></group>
  if (kind === 'cage') return <group position={[0, .8, 0]}>{[-.55, -.25, .05, .35, .65].map(x => <mesh key={x} position={[x,0,0]}><boxGeometry args={[.05,1.7,.7]} /><meshStandardMaterial color="#38383e" metalness={.8} /></mesh>)}</group>
  if (kind === 'fire') return <><mesh position={[0,.25,0]}><cylinderGeometry args={[.35,.5,.3,8]} /><meshStandardMaterial color="#4b3328" /></mesh><pointLight position={[0,.8,0]} color="#ff9a45" intensity={8} distance={4} /></>
  if (kind === 'book' || kind === 'roll') return <mesh castShadow position={[0,.55,0]} rotation={[-.35,0,0]}><boxGeometry args={[.85,.12,.65]} /><meshStandardMaterial color={kind === 'roll' ? '#e7d9aa' : '#6c3a2d'} emissive={light} emissiveIntensity={.2} /></mesh>
  if (kind === 'portrait') return <mesh castShadow position={[0,1,0]}><boxGeometry args={[1.2,1.8,.15]} /><meshStandardMaterial color="#8c684d" /></mesh>
  if (kind === 'water') return <mesh position={[0,.35,0]}><cylinderGeometry args={[.4,.3,.65,12]} /><meshStandardMaterial color="#648ca0" metalness={.2} roughness={.25} /></mesh>
  if (kind === 'armor') return <mesh position={[0,.8,0]}><octahedronGeometry args={[.75]} /><meshStandardMaterial color="#8d8b88" metalness={.75} roughness={.3} /></mesh>
  if (kind === 'light') return <mesh position={[0,.8,0]}><octahedronGeometry args={[.35]} /><meshStandardMaterial color="#fff0aa" emissive={light} emissiveIntensity={3} /></mesh>
  if (kind === 'mud') return <mesh position={[0,.05,0]}><cylinderGeometry args={[.9,1.1,.15,18]} /><meshStandardMaterial color="#403b2d" roughness={1} /></mesh>
  return <mesh castShadow position={[0,.25,0]}><boxGeometry args={[1.3,.35,1]} /><meshStandardMaterial color="#7d755d" /></mesh>
}

function ActiveTarget() {
  const group = useRef<Group>(null); const { sceneIndex, stepIndex, nearby, setNearby, interact, setMessage } = useGame()
  const scene = storyScenes[sceneIndex]; const step = scene.steps[stepIndex]
  useFrame(() => {
    if (!group.current) return
    const distance = playerPosition.distanceTo(group.current.position); const isNear = distance < 2.25
    if (isNear !== nearby) setNearby(isNear)
  })
  return <group ref={group} position={[step.position[0], 0, step.position[1]]} onClick={() => nearby ? interact() : setMessage('Move closer to interact.')}>
    <Float speed={1.5} floatIntensity={.18}><TargetShape kind={step.kind} light={scene.palette.light} /></Float>
    <Sparkles count={18} scale={[1.5,2,1.5]} color={scene.palette.light} size={2} speed={.3} />
    <Text position={[0,2.05,0]} fontSize={.28} maxWidth={3} textAlign="center" color="#fff1d1" outlineWidth={.012} outlineColor="#17121b">{step.action}</Text>
  </group>
}

function Scenery({ id, ground }: { id: string; ground: string }) {
  const count = id === 'interpreter' ? 8 : 12
  return <>
    {Array.from({ length: count }, (_, i) => {
      const x = (i % 2 ? -1 : 1) * (5.8 + (i % 3) * .55); const z = -6 + (i * 2.1) % 13; const tall = 1.2 + (i % 4) * .7
      return <mesh key={i} castShadow position={[x, tall / 2, z]} rotation={[0, i * .7, 0]}><boxGeometry args={[1.3 + (i%2)*.7,tall,1.1]} /><meshStandardMaterial color={ground} roughness={1} /></mesh>
    })}
    {id === 'slough' && <mesh position={[0,.03,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[13,13]} /><meshStandardMaterial color="#292c21" roughness={.3} /></mesh>}
    {id === 'cross' && <Sparkles count={100} scale={[15,6,15]} position={[0,2,0]} color="#fff4bf" opacity={.5} />}
  </>
}

export function World() {
  const sceneIndex = useGame((s) => s.sceneIndex); const scene = storyScenes[sceneIndex]
  return <>
    <color attach="background" args={[scene.palette.sky]} /><fog attach="fog" args={[scene.palette.fog, 11, 31]} />
    <hemisphereLight intensity={1.25} color={scene.palette.light} groundColor={scene.palette.ground} />
    <directionalLight castShadow position={[7,12,6]} intensity={2.4} color={scene.palette.light} shadow-mapSize={[1024,1024]} />
    <RigidBody type="fixed" colliders={false}><CuboidCollider args={[8,.25,8]} position={[0,-.25,0]} /><mesh receiveShadow position={[0,-.3,0]}><boxGeometry args={[16,.5,16]} /><meshStandardMaterial color={scene.palette.ground} roughness={1} /></mesh></RigidBody>
    <Scenery id={scene.id} ground={scene.palette.ground} /><ActiveTarget />
  </>
}
