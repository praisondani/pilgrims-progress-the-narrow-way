import { Float, Sparkles, Text } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useState } from 'react'
import { useGame } from './state'

function Ground({ z, length, color }: { z: number; length: number; color: string }) {
  return <RigidBody type="fixed" colliders={false}><CuboidCollider args={[7, .25, length / 2]} position={[0, -.25, z]} /><mesh receiveShadow position={[0, -.3, z]}><boxGeometry args={[14, .5, length]} /><meshStandardMaterial color={color} roughness={1} /></mesh></RigidBody>
}
function LightFragment({ x, z }: { x: number; z: number }) {
  const [taken, setTaken] = useState(false); const collect = useGame((s) => s.collectLight)
  if (taken) return null
  return <Float speed={2}><mesh position={[x, .9, z]} onClick={() => { setTaken(true); collect() }}><octahedronGeometry args={[.25]} /><meshStandardMaterial color="#ffe6a0" emissive="#d99e36" emissiveIntensity={3} /></mesh></Float>
}
export function World() {
  const setMessage = useGame((s) => s.setMessage)
  return <>
    <color attach="background" args={['#171321']} /><fog attach="fog" args={['#171321', 14, 48]} />
    <hemisphereLight intensity={1.1} color="#b9b9d2" groundColor="#351c21" /><directionalLight castShadow position={[6, 12, 5]} intensity={2.8} color="#ffd9a0" />
    <Ground z={1} length={18} color="#3b2427" /><Ground z={-12.5} length={9} color="#293049" /><Ground z={-24.5} length={15} color="#303a2c" /><Ground z={-38} length={12} color="#35445d" />
    {[-5, 0, 5].map((x, i) => <mesh key={x} position={[x, 1.2, 4 - (i % 2) * 5]} castShadow><boxGeometry args={[2.4, 2.8 + i, 2]} /><meshStandardMaterial color={i === 1 ? '#61343b' : '#4a3036'} roughness={.9} /></mesh>)}
    <group position={[-2.2, 0, -11]} onClick={() => setMessage('Evangelist: “Keep that light in your eye, and go up directly thereto.”')}>
      <mesh castShadow position={[0, .9, 0]}><capsuleGeometry args={[.3, .7]} /><meshStandardMaterial color="#536a8f" /></mesh><Text position={[0, 1.85, 0]} fontSize={.25}>Evangelist</Text>
    </group>
    <LightFragment x={2.4} z={-12} /><LightFragment x={-2.8} z={-14.5} /><LightFragment x={1.2} z={-16} />
    {[-4.4, -1.8, .8, 3.7].map((x, i) => <RigidBody key={x} type="fixed"><mesh receiveShadow castShadow position={[x, .05 + (i % 2) * .12, -23 - i * 2.2]} rotation={[0, i * .4, 0]}><boxGeometry args={[1.5, .22, 1.1]} /><meshStandardMaterial color="#6b6851" /></mesh></RigidBody>)}
    <Sparkles count={45} scale={[12, 3, 14]} position={[0, 1, -24]} color="#859c72" size={2} speed={.25} opacity={.25} />
    <group position={[0, 0, -40]} onClick={() => setMessage('A voice within: “Knock, and it shall be opened unto you.”')}>
      <mesh castShadow position={[0, 2, 0]}><boxGeometry args={[4.4, 4, .8]} /><meshStandardMaterial color="#393747" /></mesh>
      <mesh position={[0, 1.55, .45]}><boxGeometry args={[1.5, 3.1, .22]} /><meshStandardMaterial color="#b37a3c" emissive="#6c3d17" emissiveIntensity={.5} /></mesh>
      <pointLight position={[0, 2, 1]} color="#ffc66d" intensity={12} distance={8} /><Sparkles count={35} scale={[4, 5, 2]} color="#ffd38a" />
    </group>
  </>
}
