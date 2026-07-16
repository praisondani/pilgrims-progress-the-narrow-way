import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Chapter = 'city' | 'field' | 'slough' | 'gate'
type GameState = {
  started: boolean; paused: boolean; journalOpen: boolean; chapter: Chapter
  objective: string; burden: number; light: number; message?: string
  start: () => void; reset: () => void; togglePause: () => void; toggleJournal: () => void
  enterChapter: (chapter: Chapter) => void; collectLight: () => void; setMessage: (message?: string) => void
}

const chapterObjectives: Record<Chapter, string> = {
  city: 'Leave the City of Destruction', field: 'Follow the distant shining light',
  slough: 'Cross the Slough of Despond', gate: 'Knock at the Wicket Gate',
}

export const useGame = create<GameState>()(persist((set) => ({
  started: false, paused: false, journalOpen: false, chapter: 'city',
  objective: chapterObjectives.city, burden: 1, light: 0,
  start: () => set({ started: true, paused: false }),
  reset: () => set({ started: true, paused: false, journalOpen: false, chapter: 'city', objective: chapterObjectives.city, burden: 1, light: 0 }),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  toggleJournal: () => set((s) => ({ journalOpen: !s.journalOpen, paused: !s.journalOpen })),
  enterChapter: (chapter) => set((s) => chapter === s.chapter ? s : ({ chapter, objective: chapterObjectives[chapter], message: chapter === 'field' ? 'Evangelist: “Do you see yonder Wicket Gate?”' : undefined })),
  collectLight: () => set((s) => ({ light: Math.min(3, s.light + 1), message: 'A fragment of truth steadies your path.' })),
  setMessage: (message) => set({ message }),
}), { name: 'narrow-way-save', partialize: ({ chapter, objective, burden, light }) => ({ chapter, objective, burden, light }) }))
