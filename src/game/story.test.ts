import { describe, expect, it } from "vitest";
import { storyScenes, totalStoryBeats } from "./story";
import { puzzles } from "./puzzles";

describe("Part One story journey", () => {
  it("covers the complete planned journey through Doubting Castle", () => {
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
      "humiliation",
      "shadow",
      "faithful",
      "talkative",
      "warning",
      "vanity",
      "hopeful",
      "byends",
      "demas",
      "bypath",
      "doubting",
    ]);
    expect(totalStoryBeats).toBeGreaterThanOrEqual(190);
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
    expect(Object.keys(puzzles).length).toBeGreaterThanOrEqual(47);
    expect(
      new Set(Object.keys(puzzles).map((key) => key.split(":")[0])).size,
    ).toBeGreaterThanOrEqual(22);
  });

  it("preserves the full Apollyon encounter and recovery arc", () => {
    const valley = storyScenes.find((scene) => scene.id === "humiliation")!;
    expect(valley.steps.map((step) => step.id)).toEqual([
      "valley-descent",
      "damaged-road",
      "apollyon-appears",
      "former-master",
      "catalogue-failures",
      "raise-shield",
      "truth-response",
      "lose-footing",
      "recover-sword",
      "final-resistance",
    ]);
    expect(Object.keys(puzzles).filter((key) => key.startsWith("humiliation:")))
      .toHaveLength(5);
  });

  it("keeps Vanity Fair social, judicial, restrained, and consequential", () => {
    const vanity = storyScenes.find((scene) => scene.id === "vanity")!;
    expect(vanity.steps.map((step) => step.id)).toEqual([
      "fair-gates",
      "wares-of-status",
      "merchant-pressure",
      "crowd-suspicion",
      "public-disorder",
      "arrest",
      "prison-night",
      "hategood-court",
      "witness-envy",
      "witnesses-false",
      "faithful-testimony",
      "condemnation",
      "faithful-witness",
      "christian-escape",
    ]);
    const martyrdom = vanity.steps.find(
      (step) => step.id === "faithful-witness",
    )!;
    expect(martyrdom.dialogue.join(" ")).toContain("silhouette and sound");
    expect(martyrdom.dialogue.join(" ")).not.toMatch(/\b(?:blood|gore|dismember)\b/i);
    expect(
      storyScenes.find((scene) => scene.id === "hopeful")?.steps.at(-1)?.id,
    ).toBe("road-beyond-vanity");
  });

  it("presents Doubting Castle safely and preserves the Key of Promise", () => {
    const castle = storyScenes.find((scene) => scene.id === "doubting")!;
    const text = castle.steps
      .flatMap((step) => [step.objective, ...step.dialogue])
      .join(" ");
    expect(text).not.toMatch(/\b(?:blood|gore|method|weapon against himself)\b/i);
    expect(castle.steps.find((step) => step.id === "remember-key")).toMatchObject({
      keyOfPromise: true,
    });
    expect(castle.steps.at(-1)?.id).toBe("warning-monument");
  });
});
