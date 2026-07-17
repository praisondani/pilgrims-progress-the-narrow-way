import { describe, expect, it } from "vitest";
import { storyScenes } from "./story";
import { ambienceUrl, audioSceneIds, dbToGain, sfxUrl } from "./audio";

describe("safe local audio assets", () => {
  it("covers every playable scene", () => {
    expect(audioSceneIds.sort()).toEqual(storyScenes.map((scene) => scene.id).sort());
  });

  it("never builds external asset URLs", () => {
    expect(ambienceUrl("dream")).toBe("/audio/ambience/dream.mp3");
    expect(sfxUrl("dialogue")).toBe("/audio/sfx/dialogue.mp3");
  });

  it("converts measured normalization levels to linear gain", () => {
    expect(dbToGain(0)).toBe(1);
    expect(dbToGain(-6)).toBeCloseTo(0.501, 3);
  });
});
