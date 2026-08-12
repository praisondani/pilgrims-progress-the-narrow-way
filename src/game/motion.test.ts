import { describe, expect, it } from "vitest";
import { comfortMotionSpeed } from "./motion";

describe("comfort motion", () => {
  it("removes authored animation speed in reduced-motion mode", () => {
    expect(comfortMotionSpeed(0.8, true)).toBe(0);
    expect(comfortMotionSpeed(-1.2, true)).toBe(0);
  });

  it("preserves authored speed when motion is enabled", () => {
    expect(comfortMotionSpeed(0.8, false)).toBe(0.8);
  });
});
