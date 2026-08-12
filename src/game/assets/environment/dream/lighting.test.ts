import { describe, expect, it } from "vitest";
import { readNumericUniform } from "./lighting";

describe("Dream lighting uniform boundary", () => {
  it("reads a finite numeric uniform", () => {
    const uniform = { value: 0.035 };
    expect(readNumericUniform({ uniforms: { poolStrength: uniform } }, "poolStrength")).toBe(
      uniform,
    );
  });

  it.each([
    undefined,
    null,
    {},
    { uniforms: undefined },
    { uniforms: {} },
    { uniforms: { poolStrength: undefined } },
    { uniforms: { poolStrength: { value: Number.NaN } } },
    { uniforms: { poolStrength: { value: "0.14" } } },
  ])("returns no uniform for malformed material %#", (material) => {
    expect(readNumericUniform(material, "poolStrength")).toBeUndefined();
  });

  it("does not confuse a different uniform key with pool strength", () => {
    expect(
      readNumericUniform({ uniforms: { poolColor: { value: 0.14 } } }, "poolStrength"),
    ).toBeUndefined();
  });
});
