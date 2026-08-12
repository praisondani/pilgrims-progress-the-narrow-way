import { beforeEach, describe, expect, it } from "vitest";
import { mobileInput, resetMobileInput } from "./input";

describe("shared mobile movement input", () => {
  beforeEach(resetMobileInput);

  it("clears a held direction for scene and modal boundaries", () => {
    mobileInput.x = -1;
    mobileInput.z = 1;
    resetMobileInput();
    expect(mobileInput).toEqual({ x: 0, z: 0 });
  });
});
