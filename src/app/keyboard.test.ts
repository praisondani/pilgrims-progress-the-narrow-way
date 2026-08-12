import { describe, expect, it } from "vitest";
import { isDialogueAdvanceKey, uiShortcutFor } from "./keyboard";

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

  it("maps unmodified shell keys to pause, journal, and story map", () => {
    const base = { repeat: false, altKey: false, ctrlKey: false, metaKey: false };
    expect(uiShortcutFor({ ...base, key: "Escape" })).toBe("pause");
    expect(uiShortcutFor({ ...base, key: "j" })).toBe("journal");
    expect(uiShortcutFor({ ...base, key: "M" })).toBe("storyMap");
    expect(uiShortcutFor({ ...base, key: "Esc" })).toBe("pause");
  });

  it("leaves modified and repeated keys available to the browser", () => {
    expect(
      uiShortcutFor({
        key: "m",
        repeat: true,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      }),
    ).toBeUndefined();
    expect(
      uiShortcutFor({
        key: "j",
        repeat: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false,
      }),
    ).toBeUndefined();
  });
});
