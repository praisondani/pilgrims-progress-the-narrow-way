export interface DisposableHeroResource {
  readonly disposed: boolean;
  dispose(): void;
}

type Scheduler = (callback: () => void) => void;

/**
 * React StrictMode replays effects as mount -> cleanup -> mount. Disposal must
 * wait until that synchronous replay finishes, while old runtime replacements
 * must still release independently.
 */
export function createDeferredHeroDisposer(
  schedule: Scheduler = queueMicrotask,
) {
  const retainCounts = new Map<DisposableHeroResource, number>();

  return {
    retain(resource: DisposableHeroResource) {
      retainCounts.set(resource, (retainCounts.get(resource) ?? 0) + 1);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        const nextCount = Math.max(
          0,
          (retainCounts.get(resource) ?? 1) - 1,
        );
        retainCounts.set(resource, nextCount);
        schedule(() => {
          if ((retainCounts.get(resource) ?? 0) !== 0) return;
          retainCounts.delete(resource);
          resource.dispose();
        });
      };
    },
  };
}

