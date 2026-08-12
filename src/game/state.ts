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

function asFiniteNumber(value: unknown, fallback: number) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  )
    return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asFiniteInteger(value: unknown, fallback: number) {
  const number = asFiniteNumber(value, fallback);
  return Number.isFinite(number) ? Math.trunc(number) : fallback;
}

function clampSceneIndex(value: unknown, fallback = 0) {
  return Math.max(
    0,
    Math.min(storyScenes.length - 1, asFiniteInteger(value, fallback)),
  );
}

function clampStepIndex(sceneIndex: number, value: unknown, fallback = 0) {
  return Math.max(
    0,
    Math.min(
      storyScenes[sceneIndex].steps.length - 1,
      asFiniteInteger(value, fallback),
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

function burdenValue(value: unknown, fallback = 0) {
  const number = asFiniteNumber(value, fallback);
  return Number.isFinite(number)
    ? Math.max(0, Math.min(1, number))
    : fallback;
}

function onboardingValue(
  value: unknown,
  fallback: OnboardingProgress = initialOnboarding,
) {
  const candidate =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return {
    moved: booleanValue(candidate.moved, fallback.moved),
    looked: booleanValue(candidate.looked, fallback.looked),
    interacted: booleanValue(candidate.interacted, fallback.interacted),
    firstObjectiveCompleted: booleanValue(
      candidate.firstObjectiveCompleted,
      fallback.firstObjectiveCompleted,
    ),
  };
}

function visibilityValue(
  value: unknown,
  fallback: GameState["visibility"] = "bright",
): GameState["visibility"] {
  return value === "standard" || value === "bright" || value === "highContrast"
    ? value
    : fallback;
}

function textSizeValue(
  value: unknown,
  fallback: GameState["textSize"] = "normal",
): GameState["textSize"] {
  return value === "normal" || value === "large" || value === "largest"
    ? value
    : fallback;
}

function completedStepValue(
  sceneIndex: number,
  stepIndex: number,
  value: unknown,
  fallback = false,
) {
  return (
    booleanValue(value, fallback) &&
    stepIndex === storyScenes[sceneIndex].steps.length - 1
  );
}

function gameCompleteValue(
  sceneIndex: number,
  stepIndex: number,
  value: unknown,
  fallback = false,
) {
  return (
    sceneIndex === storyScenes.length - 1 &&
    stepIndex === storyScenes[sceneIndex].steps.length - 1 &&
    booleanValue(value, fallback)
  );
}

function puzzleActiveValue(
  sceneIndex: number,
  stepIndex: number,
  value: unknown,
  fallback = false,
) {
  const step = storyScenes[sceneIndex]?.steps[stepIndex];
  return Boolean(step && puzzleFor(storyScenes[sceneIndex].id, step.id)) &&
    booleanValue(value, fallback);
}

function persistedCandidate(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

/** Normalize untrusted replay data before it can drive a chapter lookup. */
export function normalizeReplayCheckpoint(
  value: unknown,
): ReplayCheckpoint | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Record<string, unknown>;
  const sceneIndex = clampSceneIndex(candidate.sceneIndex);
  const stepIndex = clampStepIndex(sceneIndex, candidate.stepIndex);
  return {
    sceneIndex,
    stepIndex,
    burden: burdenValue(candidate.burden),
    hasRoll: booleanValue(candidate.hasRoll),
    hasKeyOfPromise: booleanValue(candidate.hasKeyOfPromise),
    equipment: stringList(candidate.equipment),
    onboarding: onboardingValue(candidate.onboarding),
    sceneComplete: completedStepValue(
      sceneIndex,
      stepIndex,
      candidate.sceneComplete,
    ),
    gameComplete: gameCompleteValue(
      sceneIndex,
      stepIndex,
      candidate.gameComplete,
    ),
  };
}

/**
 * Migrate the versioned local snapshot before it is merged into live state.
 * Local storage is user-controlled input: only literal booleans are allowed
 * to unlock a later chapter or restore a completion flag.
 */
export function migratePersistedState(persisted: unknown, version: number) {
  const saved = persistedCandidate(persisted);
  const priorSceneIndex = Number(saved.sceneIndex) || 0;
  const priorStepIndex = Number(saved.stepIndex) || 0;
  const wasComplete = booleanValue(saved.gameComplete);
  const palaceWasComplete =
    version === 4 && priorSceneIndex === 13 && wasComplete;
  const hopefulWasComplete =
    version === 5 && priorSceneIndex === 20 && wasComplete;
  const doubtingWasComplete =
    version < 10 && priorSceneIndex === 24 && wasComplete;
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
      : onboardingValue(saved.onboarding);
  return {
    started: booleanValue(saved.started),
    sceneIndex,
    stepIndex,
    burden: burdenValue(saved.burden),
    hasRoll:
      version < 4
        ? sceneIndex > 7 || (sceneIndex === 7 && stepIndex >= 5)
        : booleanValue(saved.hasRoll),
    hasKeyOfPromise:
      version < 6 ? false : booleanValue(saved.hasKeyOfPromise),
    equipment:
      version < 4 || !Array.isArray(saved.equipment)
        ? []
        : stringList(saved.equipment),
    journal: stringList(saved.journal),
    sceneComplete: completedStepValue(
      sceneIndex,
      stepIndex,
      saved.sceneComplete,
    ),
    gameComplete:
      version < 6 || doubtingWasComplete
        ? false
        : gameCompleteValue(sceneIndex, stepIndex, saved.gameComplete),
    soundEnabled: version < 7 ? false : booleanValue(saved.soundEnabled),
    visibility: visibilityValue(saved.visibility),
    textSize: textSizeValue(saved.textSize),
    reducedMotion: booleanValue(saved.reducedMotion),
    cinematicCamera: booleanValue(saved.cinematicCamera, true),
    puzzleActive: puzzleActiveValue(sceneIndex, stepIndex, saved.puzzleActive),
    onboarding,
    replayCheckpoint:
      version < 9
        ? undefined
        : normalizeReplayCheckpoint(saved.replayCheckpoint),
  };
}

/** Merge a sanitized snapshot without letting missing fields erase live state. */
export function mergePersistedState(
  persisted: unknown,
  current: GameState,
): GameState {
  const saved = persistedCandidate(persisted);
  const sceneIndex = clampSceneIndex(saved.sceneIndex, current.sceneIndex);
  const stepIndex = clampStepIndex(
    sceneIndex,
    saved.stepIndex,
    current.stepIndex,
  );
  const sceneComplete = completedStepValue(
    sceneIndex,
    stepIndex,
    saved.sceneComplete,
    current.sceneComplete,
  );
  return {
    ...current,
    started: booleanValue(saved.started, current.started),
    sceneIndex,
    stepIndex,
    burden: burdenValue(saved.burden, current.burden),
    hasRoll: booleanValue(saved.hasRoll, current.hasRoll),
    hasKeyOfPromise: booleanValue(
      saved.hasKeyOfPromise,
      current.hasKeyOfPromise,
    ),
    equipment:
      saved.equipment === undefined
        ? current.equipment
        : stringList(saved.equipment),
    journal:
      saved.journal === undefined ? current.journal : stringList(saved.journal),
    sceneComplete,
    gameComplete: gameCompleteValue(
      sceneIndex,
      stepIndex,
      saved.gameComplete,
      current.gameComplete,
    ),
    soundEnabled: booleanValue(saved.soundEnabled, current.soundEnabled),
    visibility: visibilityValue(saved.visibility, current.visibility),
    textSize: textSizeValue(saved.textSize, current.textSize),
    reducedMotion: booleanValue(saved.reducedMotion, current.reducedMotion),
    cinematicCamera: booleanValue(
      saved.cinematicCamera,
      current.cinematicCamera,
    ),
    puzzleActive: puzzleActiveValue(
      sceneIndex,
      stepIndex,
      saved.puzzleActive,
      current.puzzleActive,
    ),
    onboarding: onboardingValue(saved.onboarding, current.onboarding),
    replayCheckpoint:
      saved.replayCheckpoint === undefined
        ? current.replayCheckpoint
        : normalizeReplayCheckpoint(saved.replayCheckpoint),
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
        if (
          requestedSceneIndex < 0 ||
          requestedSceneIndex > maxReplayIndex ||
          requestedSceneIndex >= storyScenes.length
        )
          return;
        const stepIndex = clampStepIndex(
          requestedSceneIndex,
          requestedStepIndex,
        );
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
        if (!s.puzzleActive) return;
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
        if (!s.nearby || s.dialogue || s.choosing || s.puzzleActive || s.sceneComplete)
          return;
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
        if (!s.choosing) return;
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
        if (!s.sceneComplete) return;
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
        sceneComplete: state.sceneComplete,
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
      migrate: migratePersistedState,
      merge: mergePersistedState,
    },
  ),
);
