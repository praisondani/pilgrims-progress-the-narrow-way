import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storyScenes } from "./story";
import { puzzleFor } from "./puzzles";

export type OnboardingProgress = {
  moved: boolean;
  looked: boolean;
  interacted: boolean;
  firstObjectiveCompleted: boolean;
};

export type OnboardingMilestone = keyof OnboardingProgress;

export type ReplayCheckpoint = {
  sceneIndex: number;
  stepIndex: number;
  burden: number;
  hasRoll: boolean;
  hasKeyOfPromise: boolean;
  equipment: string[];
  onboarding: OnboardingProgress;
  sceneComplete: boolean;
  gameComplete: boolean;
};

const initialOnboarding: OnboardingProgress = {
  moved: false,
  looked: false,
  interacted: false,
  firstObjectiveCompleted: false,
};

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
  onboarding: OnboardingProgress;
  replayCheckpoint?: ReplayCheckpoint;
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
  completeOnboardingMilestone: (milestone: OnboardingMilestone) => void;
  replayScene: (sceneIndex: number, stepIndex?: number) => void;
  returnFromReplay: () => void;
};

function asFiniteInteger(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : fallback;
}

function clampSceneIndex(value: unknown) {
  return Math.max(
    0,
    Math.min(storyScenes.length - 1, asFiniteInteger(value, 0)),
  );
}

function clampStepIndex(sceneIndex: number, value: unknown) {
  return Math.max(
    0,
    Math.min(
      storyScenes[sceneIndex].steps.length - 1,
      asFiniteInteger(value, 0),
    ),
  );
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter((item): item is string => typeof item === "string"),
        ),
      ]
    : [];
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

/** Normalize untrusted replay data before it can drive a chapter lookup. */
export function normalizeReplayCheckpoint(
  value: unknown,
): ReplayCheckpoint | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Record<string, unknown>;
  const onboarding =
    candidate.onboarding && typeof candidate.onboarding === "object"
      ? (candidate.onboarding as Record<string, unknown>)
      : {};
  const sceneIndex = clampSceneIndex(candidate.sceneIndex);
  return {
    sceneIndex,
    stepIndex: clampStepIndex(sceneIndex, candidate.stepIndex),
    burden: Number(candidate.burden) > 0 ? 1 : 0,
    hasRoll: booleanValue(candidate.hasRoll),
    hasKeyOfPromise: booleanValue(candidate.hasKeyOfPromise),
    equipment: stringList(candidate.equipment),
    onboarding: {
      moved: booleanValue(onboarding.moved),
      looked: booleanValue(onboarding.looked),
      interacted: booleanValue(onboarding.interacted),
      firstObjectiveCompleted: booleanValue(onboarding.firstObjectiveCompleted),
    },
    sceneComplete: booleanValue(candidate.sceneComplete),
    gameComplete: booleanValue(candidate.gameComplete),
  };
}

function chapterStartState(sceneIndex: number, stepIndex = 0) {
  let burden = 0;
  let hasRoll = false;
  let hasKeyOfPromise = false;
  let equipment: string[] = [];
  storyScenes.slice(0, sceneIndex).forEach((scene) => {
    scene.steps.forEach((step) => {
      burden = step.burden ?? burden;
      hasRoll = step.roll ?? hasRoll;
      hasKeyOfPromise = step.keyOfPromise ?? hasKeyOfPromise;
      equipment = step.equipment ?? equipment;
    });
  });
  storyScenes[sceneIndex]?.steps.slice(0, stepIndex).forEach((step) => {
    burden = step.burden ?? burden;
    hasRoll = step.roll ?? hasRoll;
    hasKeyOfPromise = step.keyOfPromise ?? hasKeyOfPromise;
    equipment = step.equipment ?? equipment;
  });
  return { burden, hasRoll, hasKeyOfPromise, equipment: [...equipment] };
}

function restoreReplayCheckpoint(checkpoint: ReplayCheckpoint) {
  return {
    ...checkpoint,
    equipment: [...checkpoint.equipment],
    onboarding: { ...checkpoint.onboarding },
    replayCheckpoint: undefined,
    paused: false,
    journalOpen: false,
    nearby: false,
    dialogue: undefined,
    dialogueIndex: 0,
    choosing: false,
    puzzleActive: false,
    puzzleSolvedCurrent: false,
    guidedTravel: false,
  };
}

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
      onboarding: initialOnboarding,
      replayCheckpoint: undefined,
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
          onboarding: initialOnboarding,
          replayCheckpoint: undefined,
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
      completeOnboardingMilestone: (milestone) =>
        set((state) => ({
          onboarding: { ...state.onboarding, [milestone]: true },
        })),
      replayScene: (requestedSceneIndex, requestedStepIndex = 0) => {
        const s = get();
        const checkpoint = s.replayCheckpoint ?? {
          sceneIndex: s.sceneIndex,
          stepIndex: s.stepIndex,
          burden: s.burden,
          hasRoll: s.hasRoll,
          hasKeyOfPromise: s.hasKeyOfPromise,
          equipment: [...s.equipment],
          onboarding: { ...s.onboarding },
          sceneComplete: s.sceneComplete,
          gameComplete: s.gameComplete,
        };
        const maxReplayIndex = checkpoint.gameComplete
          ? storyScenes.length - 1
          : checkpoint.sceneIndex - 1;
        if (!Number.isInteger(requestedSceneIndex)) return;
        const scene = storyScenes[requestedSceneIndex];
        const stepIndex = Math.max(
          0,
          Math.min(requestedStepIndex, (scene?.steps.length ?? 1) - 1),
        );
        if (
          requestedSceneIndex < 0 ||
          requestedSceneIndex > maxReplayIndex ||
          requestedSceneIndex >= storyScenes.length
        )
          return;
        const chapterState = chapterStartState(requestedSceneIndex, stepIndex);
        set({
          ...chapterState,
          sceneIndex: requestedSceneIndex,
          stepIndex,
          replayCheckpoint: checkpoint,
          paused: false,
          journalOpen: false,
          nearby: false,
          message: `Replaying ${scene.title}. Current journey saved.`,
          dialogue: undefined,
          dialogueIndex: 0,
          choosing: false,
          sceneComplete: false,
          gameComplete: false,
          puzzleActive: false,
          puzzleSolvedCurrent: false,
          checkpointRevision: s.checkpointRevision + 1,
          guidedTravel: false,
          onboarding:
            requestedSceneIndex === 0 && stepIndex === 0
              ? { ...initialOnboarding }
              : { ...checkpoint.onboarding },
        });
      },
      returnFromReplay: () => {
        const s = get();
        if (!s.replayCheckpoint) return;
        set({
          ...restoreReplayCheckpoint(s.replayCheckpoint),
          checkpointRevision: s.checkpointRevision + 1,
          message: `Returned to ${storyScenes[s.replayCheckpoint.sceneIndex].title}.`,
        });
      },
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
        const firstObjective = s.sceneIndex === 0 && s.stepIndex === 0;
        set({
          puzzleActive: false,
          puzzleSolvedCurrent: true,
          dialogue: step.dialogue,
          dialogueIndex: 0,
          onboarding: firstObjective
            ? { ...s.onboarding, firstObjectiveCompleted: true }
            : s.onboarding,
        });
      },
      interact: () => {
        const s = get();
        if (!s.nearby || s.dialogue || s.sceneComplete) return;
        const step = storyScenes[s.sceneIndex].steps[s.stepIndex];
        const firstObjective = s.sceneIndex === 0 && s.stepIndex === 0;
        if (firstObjective)
          set({
            onboarding: {
              ...s.onboarding,
              interacted: true,
            },
          });
        const firstObjectiveAlreadyCompleted =
          firstObjective && s.onboarding.firstObjectiveCompleted;
        if (
          puzzleFor(storyScenes[s.sceneIndex].id, step.id) &&
          !s.puzzleSolvedCurrent &&
          !firstObjectiveAlreadyCompleted
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
        if (s.replayCheckpoint) {
          set({
            ...restoreReplayCheckpoint(s.replayCheckpoint),
            checkpointRevision: s.checkpointRevision + 1,
            message: `Returned to ${storyScenes[s.replayCheckpoint.sceneIndex].title}.`,
          });
          return;
        }
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
      version: 11,
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
        puzzleActive: state.puzzleActive,
        onboarding: state.onboarding,
        replayCheckpoint: state.replayCheckpoint,
      }),
      migrate: (persisted, version) => {
        const saved = persisted as Partial<GameState>;
        const priorSceneIndex = Number(saved.sceneIndex) || 0;
        const priorStepIndex = Number(saved.stepIndex) || 0;
        const palaceWasComplete =
          version === 4 && priorSceneIndex === 13 && saved.gameComplete;
        const hopefulWasComplete =
          version === 5 && priorSceneIndex === 20 && saved.gameComplete;
        const doubtingWasComplete =
          version < 10 && priorSceneIndex === 24 && saved.gameComplete;
        const migratedSceneIndex = hopefulWasComplete
          ? 21
          : palaceWasComplete
            ? 14
            : doubtingWasComplete
              ? 25
              : priorSceneIndex;
        const migratedStepIndex =
          palaceWasComplete || hopefulWasComplete || doubtingWasComplete
            ? 0
            : priorStepIndex;
        const sceneIndex = clampSceneIndex(migratedSceneIndex);
        const stepIndex = clampStepIndex(sceneIndex, migratedStepIndex);
        const passedFirstObjective = sceneIndex > 0 || stepIndex > 0;
        const onboarding =
          version < 8
            ? {
                moved: passedFirstObjective,
                looked: passedFirstObjective,
                interacted: passedFirstObjective,
                firstObjectiveCompleted: passedFirstObjective,
              }
            : { ...initialOnboarding, ...saved.onboarding };
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
          gameComplete:
            version < 6 || doubtingWasComplete
              ? false
              : (saved.gameComplete ?? false),
          soundEnabled:
            version < 7 ? false : (saved.soundEnabled ?? false),
          visibility: saved.visibility ?? "bright",
          textSize: saved.textSize ?? "normal",
          reducedMotion: saved.reducedMotion ?? false,
          cinematicCamera: saved.cinematicCamera ?? true,
          puzzleActive: saved.puzzleActive ?? false,
          onboarding,
          replayCheckpoint:
            version < 9
              ? undefined
              : normalizeReplayCheckpoint(saved.replayCheckpoint),
        };
      },
      merge: (persisted, current) => {
        const saved = persisted as Partial<GameState>;
        const sceneIndex = clampSceneIndex(saved.sceneIndex);
        const stepIndex = clampStepIndex(sceneIndex, saved.stepIndex);
        return {
          ...current,
          ...saved,
          sceneIndex,
          stepIndex,
          onboarding: { ...initialOnboarding, ...saved.onboarding },
          replayCheckpoint: normalizeReplayCheckpoint(saved.replayCheckpoint),
        };
      },
    },
  ),
);
