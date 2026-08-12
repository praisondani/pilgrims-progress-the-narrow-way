import { describe, expect, it } from "vitest";
import { isDialogueAdvanceKey } from "./keyboard";

describe("dialogue keyboard controls", () => {
  it("accepts Enter, Return, and the numeric keypad Enter key", () => {
    expect(
      isDialogueAdvanceKey({ key: "Enter", code: "", repeat: false }),
    ).toBe(true);
    expect(
      isDialogueAdvanceKey({ key: "Return", code: "", repeat: false }),
    ).toBe(true);
    expect(
      isDialogueAdvanceKey({ key: "", code: "NumpadEnter", repeat: false }),
    ).toBe(true);
  });

  it("ignores auto-repeat so a held key cannot skip the whole narration", () => {
    expect(
      isDialogueAdvanceKey({ key: "Enter", code: "Enter", repeat: true }),
    ).toBe(false);
  });
});
