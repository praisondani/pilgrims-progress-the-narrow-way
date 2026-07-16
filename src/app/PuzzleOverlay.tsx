import { useState } from 'react'
import { Puzzle } from '../game/puzzles'
import { useGame } from '../game/state'
import { gameAudio } from '../game/audio'

export function PuzzleOverlay({puzzle}:{puzzle:Puzzle}){
  const complete=useGame((s)=>s.completePuzzle);const setMessage=useGame((s)=>s.setMessage);const [picked,setPicked]=useState<number[]>([]);const [focus,setFocus]=useState(50)
  const choose=(index:number)=>{if(puzzle.type!=='sequence')return;const next=[...picked,index];const valid=next.every((value,i)=>value===puzzle.solution[i]);if(!valid){setPicked([]);setMessage('That order deepens the danger. Observe, then try again.');gameAudio.error();return}setPicked(next);gameAudio.interact();if(next.length===puzzle.solution.length)setTimeout(complete,260)}
  const confirm=()=>{if(puzzle.type!=='focus')return;if(Math.abs(focus-puzzle.target)<=puzzle.tolerance){gameAudio.chapter();complete()}else{gameAudio.error();setMessage('The image remains unclear. Adjust your focus.') }}
  return <div className="puzzle-shell"><section><p className="eyebrow">SYMBOLIC TRIAL</p><h2>{puzzle.title}</h2><p>{puzzle.instruction}</p>{puzzle.type==='sequence'?<><div className="sequence-progress">{puzzle.solution.map((_,i)=><i key={i} className={i<picked.length?'done':''}/>)}</div><div className="puzzle-options">{puzzle.options.map((option,i)=><button key={option} onClick={()=>choose(i)}>{option}</button>)}</div></>:<><div className="focus-labels"><span>{puzzle.low}</span><span>{puzzle.high}</span></div><input aria-label="Focus" type="range" min="0" max="100" value={focus} onChange={(e)=>setFocus(Number(e.target.value))}/><button className="primary" onClick={confirm}>Hold this focus</button></>}</section></div>
}
