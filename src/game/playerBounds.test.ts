import { describe, expect, it } from "vitest";
import { clampPlayerPosition } from "./playerBounds";

const bounds = {
  minimumX: -7.2,
  maximumX: 7.2,
  minimumZ: -7.2,
  maximumZ: 7.2,
};

describe("player position bounds", () => {
  it("leaves an in-bounds physics translation unchanged", () => {
    expect(clampPlayerPosition({ x: 1, y: 1.2, z: -3 }, bounds)).toEqual({
      x: 1,
      y: 1.2,
      z: -3,
    });
  });

  it("publishes the corrected planar coordinates after a boundary clamp", () => {
    expect(
      clampPlayerPosition({ x: -12, y: 1.2, z: 11 }, bounds),
    ).toEqual({
      x: -7.2,
      y: 1.2,
      z: 7.2,
    });
  });

  it("keeps vertical physics untouched while correcting only the playfield", () => {
    expect(
      clampPlayerPosition({ x: 8, y: 0.34, z: -8 }, bounds),
    ).toMatchObject({ y: 0.34 });
  });
});
