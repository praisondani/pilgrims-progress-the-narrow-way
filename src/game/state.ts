import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storyScenes } from "./story";
import { puzzleFor } from "./puzzles";

type GameState = {
  started: boolean;
  paused: boolean;
  journalOpen: boolean;
  sceneIndex: number;
  stepIndex: number;
  burden: number;
  hasRoll: boolean;
  hasKeyOfPromise: boolean;
  equipment: string[];
  nearby: boolean;
  message?: string;
  dialogue?: string[];
  dialogueIndex: number;
  choosing: boolean;
  sceneComplete: boolean;
  gameComplete: boolean;
  journal: string[];
  soundEnabled: boolean;
  visibility: "standard" | "bright" | "highContrast";
  textSize: "normal" | "large" | "largest";
  reducedMotion: boolean;
  cinematicCamera: boolean;
  puzzleActive: boolean;
  puzzleSolvedCurrent: boolean;
  checkpointRevision: number;
  guidedTravel: boolean;
  start: () => void;
  reset: () => void;
  togglePause: () => void;
  toggleJournal: () => void;
  setNearby: (nearby: boolean) => void;
  interact: () => void;
  choose: (choiceIndex: number) => void;
  advanceDialogue: () => void;
  continueScene: () => void;
  setMessage: (message?: string) => void;
  toggleSound: () => void;
  cycleVisibility: () => void;
  cycleTextSize: () => void;
  toggleReducedMotion: () => void;
  toggleCinematicCamera: () => void;
  completePuzzle: () => void;
  recoverCheckpoint: () => void;
  beginGuidedTravel: () => void;
  stopGuidedTravel: () => void;
};

function finishStep(state: GameState) {
  const scene = storyScenes[state.sceneIndex];
  const step = scene.steps[state.stepIndex];
  const journal =
    step.journal && !state.journal.includes(step.journal)
      ? [...state.journal, step.journal]
      : state.journal;
  const burden = step.burden ?? state.burden;
  const hasRoll = step.roll ?? state.hasRoll;
  const hasKeyOfPromise = step.keyOfPromise ?? state.hasKeyOfPromise;
  const equipment = step.equipment ?? state.equipment;
  if (state.stepIndex === scene.steps.length - 1)
    return {
      dialogue: undefined,
      dialogueIndex: 0,
      choosing: false,
      sceneComplete: true,
      nearby: false,
      journal,
      burden,
      hasRoll,
      hasKeyOfPromise,
      equipment,
      puzzleSolvedCurrent: false,
      puzzleActive: false,
      guidedTravel: false,
    };
  return {
    dialogue: undefined,
    dialogueIndex: 0,
    choosing: false,
    stepIndex: state.stepIndex + 1,
    nearby: false,
    journal,
    burden,
    hasRoll,
    hasKeyOfPromise,
    equipment,
    puzzleSolvedCurrent: false,
    puzzleActive: false,
    guidedTravel: false,
  };
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      started: false,
      paused: false,
      journalOpen: false,
      sceneIndex: 0,
      stepIndex: 0,
      burden: 0,
      hasRoll: false,
      hasKeyOfPromise: false,
      equipment: [],
      nearby: false,
      dialogueIndex: 0,
      choosing: false,
      sceneComplete: false,
      gameComplete: false,
      journal: [],
      soundEnabled: false,
      visibility: "bright",
      textSize: "normal",
      reducedMotion: false,
      cinematicCamera: true,
      puzzleActive: false,
      puzzleSolvedCurrent: false,
      checkpointRevision: 0,
      guidedTravel: false,
      start: () => set({ started: true, paused: false }),
      reset: () =>
        set({
          started: true,
          paused: false,
          journalOpen: false,
          sceneIndex: 0,
          stepIndex: 0,
          burden: 0,
          hasRoll: false,
          hasKeyOfPromise: false,
          equipment: [],
          nearby: false,
          dialogue: undefined,
          dialogueIndex: 0,
          choosing: false,
          sceneComplete: false,
          gameComplete: false,
          journal: [],
          puzzleActive: false,
          puzzleSolvedCurrent: false,
          checkpointRevision: 0,
          guidedTravel: false,
        }),
      togglePause: () => set((s) => ({ paused: !s.paused })),
      toggleJournal: () =>
        set((s) => ({ journalOpen: !s.journalOpen, paused: !s.journalOpen })),
      setNearby: (nearby) => set({ nearby }),
      setMessage: (message) => set({ message }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      cycleVisibility: () =>
        set((s) => ({
          visibility:
            s.visibility === "standard"
              ? "bright"
              : s.visibility === "bright"
                ? "highContrast"
                : "standard",
        })),
      cycleTextSize: () =>
        set((s) => ({
          textSize:
            s.textSize === "normal"
              ? "large"
              : s.textSize === "large"
                ? "largest"
                : "normal",
        })),
      toggleReducedMotion: () =>
        set((s) => ({ reducedMotion: !s.reducedMotion })),
      toggleCinematicCamera: () =>
        set((s) => ({ cinematicCamera: !s.cinematicCamera })),
      beginGuidedTravel: () => set({ guidedTravel: true }),
      stopGuidedTravel: () => set({ guidedTravel: false }),
      recoverCheckpoint: () =>
        set((s) => ({
          paused: false,
          journalOpen: false,
          nearby: false,
          message: "Checkpoint restored.",
          dialogue: undefined,
          dialogueIndex: 0,
          choosing: false,
          puzzleActive: false,
          puzzleSolvedCurrent: false,
          checkpointRevision: s.checkpointRevision + 1,
          guidedTravel: false,
        })),
      completePuzzle: () => {
        const s = get();
        const step = storyScenes[s.sceneIndex].steps[s.stepIndex];
        set({
          puzzleActive: false,
          puzzleSolvedCurrent: true,
          dialogue: step.dialogue,
          dialogueIndex: 0,
        });
      },
      interact: () => {
        const s = get();
        if (!s.nearby || s.dialogue || s.sceneComplete) return;
        const step = storyScenes[s.sceneIndex].steps[s.stepIndex];
        if (
          puzzleFor(storyScenes[s.sceneIndex].id, step.id) &&
          !s.puzzleSolvedCurrent
        ) {
          set({ puzzleActive: true });
          return;
        }
        if (step.choices?.length) set({ choosing: true });
        else if (step.dialogue.length)
          set({ dialogue: step.dialogue, dialogueIndex: 0 });
        else set(finishStep(s));
      },
      choose: (choiceIndex) => {
        const s = get();
        const choice =
          storyScenes[s.sceneIndex].steps[s.stepIndex].choices?.[choiceIndex];
        if (choice)
          set({ choosing: false, dialogue: choice.response, dialogueIndex: 0 });
      },
      advanceDialogue: () => {
        const s = get();
        if (!s.dialogue) return;
        if (s.dialogueIndex < s.dialogue.length - 1)
          set({ dialogueIndex: s.dialogueIndex + 1 });
        else set(finishStep(s));
      },
      continueScene: () => {
        const s = get();
        if (s.sceneIndex === storyScenes.length - 1)
          set({ sceneComplete: false, gameComplete: true, paused: true });
        else
          set({
            sceneIndex: s.sceneIndex + 1,
            stepIndex: 0,
            sceneComplete: false,
            nearby: false,
            dialogue: undefined,
            dialogueIndex: 0,
            puzzleActive: false,
            puzzleSolvedCurrent: false,
          });
      },
    }),
    {
      name: "narrow-way-save-v2",
      version: 7,
      partialize: (state) => ({
        started: state.started,
        sceneIndex: state.sceneIndex,
        stepIndex: state.stepIndex,
        burden: state.burden,
        hasRoll: state.hasRoll,
        hasKeyOfPromise: state.hasKeyOfPromise,
        equipment: state.equipment,
        journal: state.journal,
        gameComplete: state.gameComplete,
        soundEnabled: state.soundEnabled,
        visibility: state.visibility,
        textSize: state.textSize,
        reducedMotion: state.reducedMotion,
        cinematicCamera: state.cinematicCamera,
      }),
      migrate: (persisted, version) => {
        const saved = persisted as Partial<GameState>;
        const priorSceneIndex = Number(saved.sceneIndex) || 0;
        const priorStepIndex = Number(saved.stepIndex) || 0;
        const palaceWasComplete =
          version === 4 && priorSceneIndex === 13 && saved.gameComplete;
        const hopefulWasComplete =
          version === 5 && priorSceneIndex === 20 && saved.gameComplete;
        const sceneIndex = hopefulWasComplete
          ? 21
          : palaceWasComplete
            ? 14
            : priorSceneIndex;
        const stepIndex = palaceWasComplete || hopefulWasComplete ? 0 : priorStepIndex;
        return {
          started: saved.started ?? false,
          sceneIndex,
          stepIndex,
          burden: Number(saved.burden) || 0,
          hasRoll:
            version < 4
              ? sceneIndex > 7 || (sceneIndex === 7 && stepIndex >= 5)
              : (saved.hasRoll ?? false),
          hasKeyOfPromise:
            version < 6 ? false : (saved.hasKeyOfPromise ?? false),
          equipment:
            version < 4 || !Array.isArray(saved.equipment)
              ? []
              : saved.equipment,
          journal: Array.isArray(saved.journal) ? saved.journal : [],
          gameComplete: version < 6 ? false : (saved.gameComplete ?? false),
          soundEnabled:
            version < 7 ? false : (saved.soundEnabled ?? false),
          visibility: saved.visibility ?? "bright",
          textSize: saved.textSize ?? "normal",
          reducedMotion: saved.reducedMotion ?? false,
          cinematicCamera: saved.cinematicCamera ?? true,
        };
      },
      merge: (persisted, current) => {
        const saved = persisted as Partial<GameState>;
        const sceneIndex = Math.max(
          0,
          Math.min(storyScenes.length - 1, Number(saved.sceneIndex) || 0),
        );
        const stepIndex = Math.max(
          0,
          Math.min(
            storyScenes[sceneIndex].steps.length - 1,
            Number(saved.stepIndex) || 0,
          ),
        );
        return { ...current, ...saved, sceneIndex, stepIndex };
      },
    },
  ),
);
