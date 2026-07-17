import { describe, expect, it } from "vitest";
import { storyScenes, totalStoryBeats } from "./story";
import { puzzles } from "./puzzles";

describe("Part One story journey", () => {
  it("covers the complete planned journey through Palace Beautiful", () => {
    expect(storyScenes.map((scene) => scene.id)).toEqual([
      "dream",
      "city",
      "field",
      "slough",
      "worldly",
      "gate",
      "interpreter",
      "cross",
      "sleepers",
      "wall",
      "hill",
      "arbor",
      "lions",
      "palace",
    ]);
    expect(totalStoryBeats).toBeGreaterThanOrEqual(90);
  });

  it("gates every beat behind a meaningful interaction", () => {
    for (const scene of storyScenes)
      for (const step of scene.steps) {
        expect(step.objective.length).toBeGreaterThan(8);
        expect(step.action.length).toBeGreaterThan(3);
        expect(
          step.dialogue.length + (step.choices?.length ?? 0),
        ).toBeGreaterThan(0);
      }
  });

  it("keeps story identifiers unique for stable saves", () => {
    const ids = storyScenes.flatMap((scene) =>
      scene.steps.map((step) => `${scene.id}:${step.id}`),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("removes the burden only at the Cross", () => {
    const changes = storyScenes.flatMap((scene) =>
      scene.steps
        .filter((step) => step.burden !== undefined)
        .map((step) => [scene.id, step.id, step.burden]),
    );
    expect(changes).toEqual([
      ["city", "read-warning", 1],
      ["cross", "reach-cross", 0],
    ]);
  });

  it("adds mechanical trials to every major journey phase", () => {
    expect(Object.keys(puzzles).length).toBeGreaterThanOrEqual(15);
    expect(
      new Set(Object.keys(puzzles).map((key) => key.split(":")[0])).size,
    ).toBeGreaterThanOrEqual(12);
  });
});
