import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storyScenes } from './story'

type GameState = {
  started: boolean; paused: boolean; journalOpen: boolean; sceneIndex: number; stepIndex: number
  burden: number; nearby: boolean; message?: string; dialogue?: string[]; dialogueIndex: number
  choosing: boolean; sceneComplete: boolean; gameComplete: boolean; journal: string[]
  start: () => void; reset: () => void; togglePause: () => void; toggleJournal: () => void
  setNearby: (nearby: boolean) => void; interact: () => void; choose: (choiceIndex: number) => void
  advanceDialogue: () => void; continueScene: () => void; setMessage: (message?: string) => void
}

function finishStep(state: GameState) {
  const scene = storyScenes[state.sceneIndex]; const step = scene.steps[state.stepIndex]
  const journal = step.journal && !state.journal.includes(step.journal) ? [...state.journal, step.journal] : state.journal
  const burden = step.burden ?? state.burden
  if (state.stepIndex === scene.steps.length - 1) return { dialogue: undefined, dialogueIndex: 0, choosing: false, sceneComplete: true, nearby: false, journal, burden }
  return { dialogue: undefined, dialogueIndex: 0, choosing: false, stepIndex: state.stepIndex + 1, nearby: false, journal, burden }
}

export const useGame = create<GameState>()(persist((set, get) => ({
  started: false, paused: false, journalOpen: false, sceneIndex: 0, stepIndex: 0, burden: 0,
  nearby: false, dialogueIndex: 0, choosing: false, sceneComplete: false, gameComplete: false, journal: [],
  start: () => set({ started: true, paused: false }),
  reset: () => set({ started: true, paused: false, journalOpen: false, sceneIndex: 0, stepIndex: 0, burden: 0, nearby: false, dialogue: undefined, dialogueIndex: 0, choosing: false, sceneComplete: false, gameComplete: false, journal: [] }),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  toggleJournal: () => set((s) => ({ journalOpen: !s.journalOpen, paused: !s.journalOpen })),
  setNearby: (nearby) => set({ nearby }),
  setMessage: (message) => set({ message }),
  interact: () => {
    const s = get(); if (!s.nearby || s.dialogue || s.sceneComplete) return
    const step = storyScenes[s.sceneIndex].steps[s.stepIndex]
    if (step.choices?.length) set({ choosing: true })
    else if (step.dialogue.length) set({ dialogue: step.dialogue, dialogueIndex: 0 })
    else set(finishStep(s))
  },
  choose: (choiceIndex) => {
    const s = get(); const choice = storyScenes[s.sceneIndex].steps[s.stepIndex].choices?.[choiceIndex]
    if (choice) set({ choosing: false, dialogue: choice.response, dialogueIndex: 0 })
  },
  advanceDialogue: () => {
    const s = get(); if (!s.dialogue) return
    if (s.dialogueIndex < s.dialogue.length - 1) set({ dialogueIndex: s.dialogueIndex + 1 })
    else set(finishStep(s))
  },
  continueScene: () => {
    const s = get()
    if (s.sceneIndex === storyScenes.length - 1) set({ sceneComplete: false, gameComplete: true, paused: true })
    else set({ sceneIndex: s.sceneIndex + 1, stepIndex: 0, sceneComplete: false, nearby: false, dialogue: undefined, dialogueIndex: 0 })
  },
}), {
  name: 'narrow-way-save-v2',
  partialize: (state) => ({ started: state.started, sceneIndex: state.sceneIndex, stepIndex: state.stepIndex, burden: state.burden, journal: state.journal, gameComplete: state.gameComplete }),
}))
