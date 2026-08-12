import { describe, expect, it } from "vitest";
import { atmosphericLifeOffset, atmosphericLifeRotation } from "./motion";

describe("procedural atmospheric motion", () => {
  it("holds Chapter II atmospheric life still when reduced motion is on", () => {
    expect(atmosphericLifeRotation(12.5, true)).toBe(0);
    expect(atmosphericLifeOffset(12.5, true)).toBe(0);
  });

  it("keeps the authored drift when motion is enabled", () => {
    expect(atmosphericLifeRotation(12.5, false)).toBeCloseTo(0.15);
    expect(atmosphericLifeOffset(12.5, false)).toBeCloseTo(
      Math.sin(12.5 * 0.08) * 0.4,
    );
  });
});
