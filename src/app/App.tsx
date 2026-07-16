import { useEffect } from 'react'
import { GameCanvas } from '../game/GameCanvas'
import { mobileInput } from '../game/Player'
import { useGame } from '../game/state'
import { storyScenes, totalStoryBeats } from '../game/story'

function Title() {
  const start = useGame((s) => s.start)
  return <main className="title-screen"><div className="title-vignette" /><section className="title-copy"><p className="eyebrow">AN INTERACTIVE DREAM</p><h1>Pilgrim’s<br /><em>Progress</em></h1><p className="subtitle">The Narrow Way</p><p className="intro">A detailed story journey from the City of Destruction to the Cross. Explore, listen, discern, and carry Christian through each symbolic trial.</p><button className="primary" onClick={start}>Enter the dream <span>→</span></button><p className="hint">WASD to walk · E to interact · Shift to jog · Space to jump</p></section><blockquote>“I saw a man clothed with rags… and a great burden upon his back.”</blockquote></main>
}
function Controls() {
  const press = (x: number, z: number) => () => { mobileInput.x = x; mobileInput.z = z }; const release = () => { mobileInput.x = 0; mobileInput.z = 0 }
  return <div className="mobile-controls"><button onPointerDown={press(-1,0)} onPointerUp={release}>←</button><button onPointerDown={press(0,-1)} onPointerUp={release}>↑</button><button onPointerDown={press(0,1)} onPointerUp={release}>↓</button><button onPointerDown={press(1,0)} onPointerUp={release}>→</button></div>
}
function Overlay() {
  const game = useGame(); const scene = storyScenes[game.sceneIndex]; const step = scene.steps[game.stepIndex]
  const completed = storyScenes.slice(0, game.sceneIndex).reduce((n,s) => n+s.steps.length,0) + game.stepIndex
  useEffect(() => { if (!game.message) return; const t=setTimeout(()=>game.setMessage(),2600); return()=>clearTimeout(t) },[game.message])
  return <>
    <header className="hud"><div><p>{scene.number}</p><strong>{scene.title}</strong></div><div className="story-progress"><span>{completed + 1} / {totalStoryBeats}</span><i style={{width:`${((completed+1)/totalStoryBeats)*100}%`}} /></div><div className="hud-actions"><button onClick={game.toggleJournal}>Journal <b>{game.journal.length}</b></button><button onClick={game.togglePause}>{game.paused&&!game.journalOpen?'Resume':'Pause'}</button></div></header>
    <aside className="objective"><span>Current objective</span><p>{step.objective}</p><div className="light-count">{game.burden ? '◆ Burden carried' : scene.id === 'dream' ? '◇ The dream begins' : '✦ Burden released'}</div></aside>
    {game.nearby && !game.dialogue && !game.choosing && !game.sceneComplete && <button className="interact-prompt" onClick={game.interact}><kbd>E</kbd> {step.action}</button>}
    {game.message && <div className="toast">{game.message}</div>}
    {game.choosing && <div className="dialogue choice"><p>How will Christian respond?</p>{step.choices?.map((choice,i)=><button key={choice.label} onClick={()=>game.choose(i)}>{choice.label}<span>→</span></button>)}</div>}
    {game.dialogue && <button className="dialogue spoken" onClick={game.advanceDialogue}><p>{game.dialogue[game.dialogueIndex]}</p><small>{game.dialogueIndex+1} / {game.dialogue.length} · continue →</small></button>}
    <Controls />
    {game.sceneComplete && <div className="modal chapter-card"><section><p className="eyebrow">{scene.number} COMPLETE</p><h2>{scene.title}</h2><p>{scene.meaning}</p><div className="chapter-progress">Journey {Math.round(((game.sceneIndex+1)/storyScenes.length)*100)}% complete</div><button className="primary" onClick={game.continueScene}>{game.sceneIndex===storyScenes.length-1?'Complete MVP':'Continue the journey'} →</button></section></div>}
    {game.gameComplete && <div className="modal ending"><section><p className="eyebrow">THE BURDEN HAS FALLEN</p><h2>The road continues.</h2><p>Christian has reached the Cross, received clean clothing and the sealed roll, and now sees the greater journey toward the Celestial City.</p><div className="ending-road">Hill Difficulty · Palace Beautiful · Valley of Humiliation · Vanity Fair · Doubting Castle · Celestial City</div><button className="primary" onClick={game.reset}>Dream again</button></section></div>}
    {game.journalOpen && <div className="modal journal"><section><p className="eyebrow">PILGRIM’S JOURNAL</p><h2>Things seen on the way</h2>{game.journal.length ? game.journal.map((entry,i)=>{const [title,body]=entry.split(' — ');return <article key={entry}><span>{String(i+1).padStart(2,'0')}</span><div><h3>{title}</h3><p>{body}</p></div></article>}) : <p>Explore and interact to record people, places, and symbols.</p>}<button className="primary" onClick={game.toggleJournal}>Return to journey</button></section></div>}
    {game.paused && !game.journalOpen && !game.gameComplete && <div className="modal"><section><p className="eyebrow">JOURNEY PAUSED</p><h2>Rest by the way.</h2><p>Progress saves automatically after each story beat.</p><div className="modal-actions"><button className="primary" onClick={game.togglePause}>Continue</button><button onClick={game.reset}>Restart story</button></div></section></div>}
  </>
}
export function App() { const started=useGame((s)=>s.started); return started ? <main className="game"><GameCanvas/><Overlay/></main> : <Title/> }
