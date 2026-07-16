import { Float, Sparkles, Text } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Group } from 'three'
import { useGame } from './state'
import { StepKind, storyScenes } from './story'
import { playerPosition } from './Player'
import { Character, CharacterVariant, CrossMonument, StoneArch } from './Visuals'
import { SceneEnvironment } from './Environments'

function personFor(id:string):CharacterVariant {
  if(id.includes('evangelist'))return'evangelist';if(id.includes('family')||id==='child')return'family';if(id.includes('obstinate'))return'obstinate';if(id.includes('pliable'))return'pliable';if(id==='help')return'help';if(id.includes('worldly'))return'worldly';if(id==='goodwill')return'goodwill';if(id==='cage')return'caged';if(id==='new-clothing')return'shining';return'interpreter'
}
function TargetShape({kind,light,id}:{kind:StepKind;light:string;id:string}) {
  if(kind==='person')return <Character variant={personFor(id)}/>
  if(kind==='gate')return <StoneArch position={[0,0,0]} gate/>
  if(kind==='cross')return <CrossMonument/>
  if(kind==='cage')return <group position={[0,.8,0]}>{[-.65,-.35,-.05,.25,.55].map(x=><mesh key={x} position={[x,0,0]}><boxGeometry args={[.055,1.8,.8]}/><meshStandardMaterial color="#35343b" metalness={.8}/></mesh>)}<Character variant="caged" scale={.7}/></group>
  if(kind==='fire')return <><mesh position={[0,.2,0]}><cylinderGeometry args={[.35,.5,.25,8]}/><meshStandardMaterial color="#493328"/></mesh><mesh position={[0,.65,0]}><coneGeometry args={[.3,.8,7]}/><meshStandardMaterial color="#e17935" emissive="#ff7e32" emissiveIntensity={2}/></mesh><pointLight position={[0,.8,0]} color="#ff9a45" intensity={8} distance={4}/></>
  if(kind==='book'||kind==='roll')return <group position={[0,.6,0]} rotation={[-.35,0,0]}><mesh castShadow><boxGeometry args={[.9,.13,.7]}/><meshStandardMaterial color={kind==='roll'?'#e7d9aa':'#6c3a2d'} emissive={light} emissiveIntensity={.18}/></mesh><mesh position={[0,.08,0]}><boxGeometry args={[.75,.02,.57]}/><meshStandardMaterial color="#d8c99d"/></mesh></group>
  if(kind==='portrait')return <group position={[0,1,0]}><mesh castShadow><boxGeometry args={[1.3,1.9,.15]}/><meshStandardMaterial color="#8c684d"/></mesh><mesh position={[0,0,.09]}><circleGeometry args={[.5,10]}/><meshStandardMaterial color="#3f5261"/></mesh></group>
  if(kind==='water')return <mesh position={[0,.35,0]}><cylinderGeometry args={[.45,.32,.7,12]}/><meshStandardMaterial color="#648ca0" metalness={.2} roughness={.2}/></mesh>
  if(kind==='armor')return <group position={[0,.8,0]}><mesh><octahedronGeometry args={[.75]}/><meshStandardMaterial color="#9a9893" metalness={.8} roughness={.25}/></mesh><mesh position={[.75,0,0]}><cylinderGeometry args={[.42,.42,.12,12]}/><meshStandardMaterial color="#766d63" metalness={.7}/></mesh></group>
  if(kind==='light')return <mesh position={[0,.8,0]}><octahedronGeometry args={[.38]}/><meshStandardMaterial color="#fff0aa" emissive={light} emissiveIntensity={4}/></mesh>
  if(kind==='mud')return <mesh position={[0,.05,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[1,20]}/><meshStandardMaterial color="#292d22" roughness={.25}/></mesh>
  return <mesh castShadow position={[0,.25,0]}><cylinderGeometry args={[.7,.85,.35,7]}/><meshStandardMaterial color="#7d755d" roughness={1}/></mesh>
}
function ActiveTarget(){
  const group=useRef<Group>(null);const {sceneIndex,stepIndex,nearby,setNearby,interact,setMessage}=useGame();const scene=storyScenes[sceneIndex];const step=scene.steps[stepIndex]
  useFrame(()=>{if(!group.current)return;const isNear=playerPosition.distanceTo(group.current.position)<2.3;if(isNear!==nearby)setNearby(isNear)})
  return <group ref={group} position={[step.position[0],0,step.position[1]]} onClick={()=>nearby?interact():setMessage('Move closer to interact.')}>
    <Float speed={1.25} floatIntensity={.12}><TargetShape kind={step.kind} light={scene.palette.light} id={step.id}/></Float>
    <Sparkles count={22} scale={[1.8,2.5,1.8]} color={scene.palette.light} size={2.2} speed={.25}/>
    <Text position={[0,2.35,0]} fontSize={.27} maxWidth={3.2} textAlign="center" color="#fff1d1" outlineWidth={.014} outlineColor="#17121b">{step.action}</Text>
  </group>
}
export function World(){const {sceneIndex,stepIndex}=useGame();const scene=storyScenes[sceneIndex];return <>
  <color attach="background" args={[scene.palette.sky]}/><fog attach="fog" args={[scene.palette.fog,12,34]}/>
  <hemisphereLight intensity={1.4} color={scene.palette.light} groundColor={scene.palette.ground}/><directionalLight castShadow position={[7,12,6]} intensity={2.7} color={scene.palette.light} shadow-mapSize={[2048,2048]}/>
  <RigidBody type="fixed" colliders={false}><CuboidCollider args={[8,.25,8]} position={[0,-.25,0]}/><mesh receiveShadow position={[0,-.3,0]}><boxGeometry args={[16,.5,16]}/><meshStandardMaterial color={scene.palette.ground} roughness={.96}/></mesh></RigidBody>
  <SceneEnvironment id={scene.id} stepIndex={stepIndex}/><ActiveTarget/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.012,0]}><ringGeometry args={[7.25,7.6,40]}/><meshStandardMaterial color="#17131a" transparent opacity={.35}/></mesh>
  </>}
