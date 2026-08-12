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
