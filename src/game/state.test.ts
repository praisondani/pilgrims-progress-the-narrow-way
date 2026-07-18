import { beforeEach, describe, expect, it } from "vitest";
import { useGame } from "./state";
import { storyScenes } from "./story";

describe("story progression state machine", () => {
  beforeEach(() => useGame.getState().reset());

  it("does not allow remote interaction", () => {
    useGame.getState().interact();
    expect(useGame.getState().dialogue).toBeUndefined();
    expect(useGame.getState().stepIndex).toBe(0);
  });

  it("tracks first-objective onboarding through lantern completion", () => {
    expect(useGame.getState().onboarding).toEqual({
      moved: false,
      looked: false,
      interacted: false,
      firstObjectiveCompleted: false,
    });
    useGame.getState().completeOnboardingMilestone("moved");
    useGame.getState().completeOnboardingMilestone("looked");
    useGame.getState().setNearby(true);
    useGame.getState().interact();
    expect(useGame.getState().onboarding.firstObjectiveCompleted).toBe(false);
    useGame.getState().completePuzzle();
    expect(useGame.getState().onboarding).toEqual({
      moved: true,
      looked: true,
      interacted: true,
      firstObjectiveCompleted: true,
    });
  });

  it("does not repeat the lantern trial after its milestone was saved", () => {
    useGame.setState({
      nearby: true,
      puzzleSolvedCurrent: false,
      onboarding: {
        moved: true,
        looked: true,
        interacted: true,
        firstObjectiveCompleted: true,
      },
    });
    useGame.getState().interact();
    expect(useGame.getState().puzzleActive).toBe(false);
    expect(useGame.getState().dialogue).toEqual(storyScenes[0].steps[0].dialogue);
  });

  it("advances only after all dialogue is read", () => {
    useGame.setState({ stepIndex: 1 });
    useGame.getState().setNearby(true);
    useGame.getState().interact();
    const lines = storyScenes[0].steps[1].dialogue.length;
    for (let i = 0; i < lines - 1; i++) useGame.getState().advanceDialogue();
    expect(useGame.getState().stepIndex).toBe(1);
    useGame.getState().advanceDialogue();
    expect(useGame.getState().stepIndex).toBe(2);
  });

  it("requires a response at choice beats", () => {
    useGame.setState({ sceneIndex: 1, stepIndex: 2, nearby: true });
    useGame.getState().interact();
    expect(useGame.getState().choosing).toBe(true);
    useGame.getState().choose(0);
    expect(useGame.getState().dialogue?.length).toBeGreaterThan(0);
  });

  it("gates scene transitions behind the final beat", () => {
    useGame.setState({
      sceneIndex: 0,
      stepIndex: storyScenes[0].steps.length - 1,
      nearby: true,
    });
    useGame.getState().interact();
    while (useGame.getState().dialogue) useGame.getState().advanceDialogue();
    expect(useGame.getState().sceneComplete).toBe(true);
    useGame.getState().continueScene();
    expect(useGame.getState().sceneIndex).toBe(1);
    expect(useGame.getState().stepIndex).toBe(0);
  });

  it("cycles accessibility settings without changing story progress", () => {
    useGame.setState({ sceneIndex: 2, stepIndex: 3 });
    useGame.getState().cycleTextSize();
    useGame.getState().toggleReducedMotion();
    useGame.getState().toggleCinematicCamera();
    expect(useGame.getState()).toMatchObject({
      sceneIndex: 2,
      stepIndex: 3,
      textSize: "large",
      reducedMotion: true,
      cinematicCamera: false,
    });
  });

  it("recovers the current checkpoint without losing story progress", () => {
    useGame.setState({
      sceneIndex: 4,
      stepIndex: 3,
      paused: true,
      dialogue: ["stale"],
    });
    useGame.getState().recoverCheckpoint();
    expect(useGame.getState()).toMatchObject({
      sceneIndex: 4,
      stepIndex: 3,
      paused: false,
      dialogue: undefined,
      checkpointRevision: 1,
    });
  });

  it("replays a completed chapter and restores the current journey", () => {
    useGame.setState({
      sceneIndex: 6,
      stepIndex: 2,
      burden: 1,
      hasRoll: false,
      sceneComplete: false,
      gameComplete: false,
    });

    useGame.getState().replayScene(5);
    expect(useGame.getState()).toMatchObject({
      sceneIndex: 5,
      stepIndex: 0,
      sceneComplete: false,
      gameComplete: false,
      replayCheckpoint: {
        sceneIndex: 6,
        stepIndex: 2,
        burden: 1,
      },
    });

    useGame.getState().replayScene(7);
    expect(useGame.getState().sceneIndex).toBe(5);

    useGame.setState({ sceneComplete: true });
    useGame.getState().continueScene();
    expect(useGame.getState()).toMatchObject({
      sceneIndex: 6,
      stepIndex: 2,
      burden: 1,
      sceneComplete: false,
      gameComplete: false,
      replayCheckpoint: undefined,
    });
  });

  it("tracks the sealed roll through loss and recovery", () => {
    useGame.setState({
      sceneIndex: 11,
      stepIndex: 1,
      hasRoll: true,
      nearby: true,
    });
    useGame.getState().interact();
    while (useGame.getState().dialogue) useGame.getState().advanceDialogue();
    expect(useGame.getState().hasRoll).toBe(false);
    useGame.setState({ stepIndex: 6, nearby: true });
    useGame.getState().interact();
    while (useGame.getState().dialogue) useGame.getState().advanceDialogue();
    expect(useGame.getState().hasRoll).toBe(true);
  });

  it("equips Christian at Palace Beautiful", () => {
    useGame.setState({ sceneIndex: 13, stepIndex: 7, nearby: true });
    useGame.getState().interact();
    expect(useGame.getState().puzzleActive).toBe(true);
    useGame.getState().completePuzzle();
    while (useGame.getState().dialogue) useGame.getState().advanceDialogue();
    expect(useGame.getState().equipment).toEqual([
      "sword",
      "shield",
      "helmet",
      "breastplate",
      "shoes",
    ]);
  });
});
