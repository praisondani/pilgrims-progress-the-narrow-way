import { describe, expect, it } from "vitest";
import {
  cameraMoodFor,
  chapterCameraProfile,
  cinematicEase,
} from "./cinematics";

describe("chapter camera direction", () => {
  it("assigns story-aware camera moods", () => {
    expect(cameraMoodFor("field")).toBe("open");
    expect(cameraMoodFor("interpreter")).toBe("intimate");
    expect(cameraMoodFor("shadow")).toBe("ominous");
    expect(cameraMoodFor("cross")).toBe("monumental");
  });

  it("composes portrait play independently from desktop", () => {
    const desktop = chapterCameraProfile("field", false);
    const portrait = chapterCameraProfile("field", true);
    expect(portrait.fov).toBeGreaterThan(desktop.fov);
    expect(portrait.playHeight).toBeGreaterThan(desktop.playHeight);
    expect(portrait.playDistance).toBeGreaterThan(desktop.playDistance);
  });

  it("eases safely and lingers at both ends", () => {
    expect(cinematicEase(-1)).toBe(0);
    expect(cinematicEase(0)).toBe(0);
    expect(cinematicEase(0.5)).toBe(0.5);
    expect(cinematicEase(1)).toBe(1);
    expect(cinematicEase(2)).toBe(1);
    expect(cinematicEase(0.1)).toBeLessThan(0.1);
    expect(cinematicEase(0.9)).toBeGreaterThan(0.9);
  });
});
