import { useFrame } from "@react-three/fiber";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { createPilgrimHero } from "./createHero";
import { createDeferredHeroDisposer } from "./lifecycle";
import type {
  DeepPartial,
  HeroExpressionPreset,
  HeroRuntime,
  HeroSculptSpec,
} from "./types";

export interface PilgrimHeroProps {
  /**
   * Kept for source compatibility with the existing Character call site.
   * This production asset intentionally represents Christian only.
   */
  variant?: "christian";
  walking?: boolean;
  burden?: number;
  hasRoll?: boolean;
  equipped?: boolean;
  scale?: number;
  visible?: boolean;
  reducedMotion?: boolean;
  locomotionSpeed?: number;
  seed?: string | number;
  spec?: DeepPartial<HeroSculptSpec>;
  expression?: HeroExpressionPreset;
  expressionIntensity?: number;
  onReady?: (runtime: HeroRuntime) => void;
}

export const PilgrimHero = forwardRef<HeroRuntime, PilgrimHeroProps>(
  function PilgrimHero(
    {
      variant: _variant = "christian",
      walking = false,
      burden = 0,
      hasRoll = false,
      equipped = false,
      scale = 1,
      visible = true,
      reducedMotion = false,
      locomotionSpeed = 1,
      seed,
      spec,
      expression = "concerned",
      expressionIntensity = 1,
      onReady,
    },
    forwardedRef,
  ) {
    // String key prevents an inline but value-identical spec from rebuilding geometry.
    const specKey = JSON.stringify(spec ?? {});
    const runtime = useMemo(
      () =>
        createPilgrimHero({
          spec,
          seed,
          burden,
          hasRoll,
          equipped,
          expression,
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [specKey, seed],
    );
    const disposer = useRef<ReturnType<
      typeof createDeferredHeroDisposer
    > | null>(null);
    if (!disposer.current) disposer.current = createDeferredHeroDisposer();

    useImperativeHandle(forwardedRef, () => runtime, [runtime]);

    useEffect(() => {
      const release = disposer.current!.retain(runtime);
      onReady?.(runtime);
      return release;
    }, [onReady, runtime]);

    useEffect(() => {
      runtime.setExpression(expression, expressionIntensity);
    }, [expression, expressionIntensity, runtime]);

    useFrame((_, delta) => {
      runtime.update(delta, {
        walking,
        burden,
        hasRoll,
        equipped,
        reducedMotion,
        locomotionSpeed,
      });
    });

    return (
      <primitive
        object={runtime.root}
        scale={scale}
        visible={visible}
        dispose={null}
      />
    );
  },
);
