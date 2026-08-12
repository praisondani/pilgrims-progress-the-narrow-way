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

export const focusableSelector = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable=\"true\"]",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(",");

/** Return keyboard-focusable descendants in document order for a modal. */
export function focusableElements(root: HTMLElement): HTMLElement[] {
  const elements = [
    ...(root.matches(focusableSelector) ? [root] : []),
    ...Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)),
  ];
  return elements.filter(
    (element) => element.getAttribute("aria-hidden") !== "true",
  );
}

/** Resolve the next focus position for a modal's Tab/Shift+Tab cycle. */
export function wrappedFocusIndex(
  currentIndex: number,
  count: number,
  backwards: boolean,
) {
  if (count <= 0) return -1;
  if (currentIndex < 0) return backwards ? count - 1 : 0;
  const next = currentIndex + (backwards ? -1 : 1);
  return next < 0 ? count - 1 : next >= count ? 0 : next;
}

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
