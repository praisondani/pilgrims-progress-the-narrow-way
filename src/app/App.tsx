import { useEffect } from 'react'
import { GameCanvas } from '../game/GameCanvas'
import { mobileInput } from '../game/Player'
import { useGame } from '../game/state'

function Title() { const start = useGame((s) => s.start); return <main className="title-screen"><div className="title-vignette" /><section className="title-copy"><p className="eyebrow">AN INTERACTIVE DREAM</p><h1>Pilgrim’s<br /><em>Progress</em></h1><p className="subtitle">The Narrow Way</p><p className="intro">Carry Christian through fear, doubt, and the mire toward a light no darkness can overcome.</p><button className="primary" onClick={start}>Begin the journey <span>→</span></button><p className="hint">WASD to walk · Shift to jog · Click glowing objects</p></section><blockquote>“I saw a man clothed with rags… and a great burden upon his back.”</blockquote></main> }
function Controls() {
  const press = (x: number, z: number) => () => { mobileInput.x = x; mobileInput.z = z }; const release = () => { mobileInput.x = 0; mobileInput.z = 0 }
  return <div className="mobile-controls"><button onPointerDown={press(-1, 0)} onPointerUp={release}>←</button><button onPointerDown={press(0, -1)} onPointerUp={release}>↑</button><button onPointerDown={press(0, 1)} onPointerUp={release}>↓</button><button onPointerDown={press(1, 0)} onPointerUp={release}>→</button></div>
}
function Overlay() {
  const { chapter, objective, light, message, paused, journalOpen, togglePause, toggleJournal, reset, setMessage } = useGame()
  useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(), 5200); return () => clearTimeout(t) }, [message, setMessage])
  return <><header className="hud"><div><p>THE NARROW WAY</p><strong>{chapter.toUpperCase()}</strong></div><div className="hud-actions"><button onClick={toggleJournal}>Journal</button><button onClick={togglePause}>{paused ? 'Resume' : 'Pause'}</button></div></header><aside className="objective"><span>Current objective</span><p>{objective}</p><div className="light-count">✦ {light}/3 fragments</div></aside>{message && <div className="dialogue" onClick={() => setMessage()}>{message}<small>tap to dismiss</small></div>}<Controls />{(paused || journalOpen) && <div className="modal"><section><p className="eyebrow">{journalOpen ? 'PILGRIM’S JOURNAL' : 'JOURNEY PAUSED'}</p><h2>{journalOpen ? 'The road remembers.' : 'Rest by the way.'}</h2>{journalOpen ? <><h3>City of Destruction</h3><p>A life continuing without regard for judgment. Christian’s burden makes visible the weight he has come to understand.</p><h3>Shining light</h3><p>Guidance based on revealed truth, seen dimly yet sufficient for the next faithful step.</p></> : <p>Progress saves automatically in this browser.</p>}<div className="modal-actions"><button className="primary" onClick={journalOpen ? toggleJournal : togglePause}>Continue</button><button onClick={reset}>Restart</button></div></section></div>}</>
}
export function App() { const started = useGame((s) => s.started); return started ? <main className="game"><GameCanvas /><Overlay /></main> : <Title /> }
