export function isDialogueAdvanceKey(
  event: Pick<KeyboardEvent, "key" | "code" | "repeat">,
) {
  if (event.repeat) return false;
  return (
    event.key === "Enter" ||
    event.key === "Return" ||
    event.code === "Enter" ||
    event.code === "NumpadEnter"
  );
}

export type UiShortcut = "pause" | "journal" | "storyMap";

/**
 * Return a non-destructive game-shell shortcut for an unmodified key press.
 * Browser/system shortcuts and key auto-repeat stay untouched so a held key
 * cannot repeatedly open/close a modal or steal a browser command.
 */
export function uiShortcutFor(
  event: Pick<
    KeyboardEvent,
    "key" | "repeat" | "altKey" | "ctrlKey" | "metaKey"
  >,
): UiShortcut | undefined {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "Escape" || event.key === "Esc") return "pause";
  const key = event.key.toLowerCase();
  if (key === "j") return "journal";
  if (key === "m") return "storyMap";
  return undefined;
}
