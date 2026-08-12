import { describe, expect, it } from "vitest";
import { BoxGeometry } from "three";
import { disposeOwnedGeometries } from "./resourceLifecycle";

describe("environment resource lifecycle", () => {
  it("disposes each owned geometry once even when references repeat", () => {
    const first = new BoxGeometry(1, 1, 1);
    const second = new BoxGeometry(1, 1, 1);
    const disposed = new Map([
      [first.uuid, 0],
      [second.uuid, 0],
    ]);
    first.addEventListener("dispose", () =>
      disposed.set(first.uuid, (disposed.get(first.uuid) ?? 0) + 1),
    );
    second.addEventListener("dispose", () =>
      disposed.set(second.uuid, (disposed.get(second.uuid) ?? 0) + 1),
    );

    disposeOwnedGeometries([first, first, undefined, second, null]);

    expect([...disposed.values()]).toEqual([1, 1]);
  });
});
