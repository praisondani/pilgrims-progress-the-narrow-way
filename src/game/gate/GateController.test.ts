import { describe, expect, it } from "vitest";
import {
  GATE_ANCHORS,
  GATE_SALVO,
  deriveGateController,
  gateArrowFrame,
  segmentCircleContact,
  segmentSegmentContact,
} from "./GateController";

describe("GateController", () => {
  it("keeps all six story beats on the authored approach and doorway", () => {
    expect(Object.keys(GATE_ANCHORS)).toEqual([
      "approach",
      "second-cover",
      "inscription",
      "knock-one",
      "knock-two",
      "goodwill",
    ]);
    expect(GATE_ANCHORS.approach[1]).toBeGreaterThan(
      GATE_ANCHORS["second-cover"][1],
    );
    expect(GATE_ANCHORS.inscription[0]).toBe(0);
    expect(GATE_ANCHORS.goodwill[1]).toBeLessThan(-8.15);
  });

  it("turns bolts on the spoken cue, then opens the doorway for Goodwill", () => {
    const turning = deriveGateController({
      stepId: "knock-two",
      dialogueActive: true,
      dialogueIndex: 1,
      sceneComplete: false,
      reducedMotion: false,
    });
    expect(turning).toMatchObject({
      knockSide: 1,
      boltsReleased: true,
      doorOpen: false,
      goodwillVisible: true,
    });
    const open = deriveGateController({
      stepId: "goodwill",
      dialogueActive: false,
      dialogueIndex: 0,
      sceneComplete: false,
      reducedMotion: false,
    });
    expect(open).toMatchObject({
      doorOpen: true,
      doorwayOpen: true,
      goodwillVisible: true,
    });
  });

  it("provides telegraph, flight, and a longer safe window", () => {
    expect(gateArrowFrame(0.2, 0)).toMatchObject({
      phase: "telegraph",
      targeted: true,
      visible: false,
    });
    expect(gateArrowFrame(GATE_SALVO.telegraphSeconds + 0.2, 0).phase).toBe(
      "flight",
    );
    expect(
      gateArrowFrame(
        GATE_SALVO.telegraphSeconds + GATE_SALVO.flightSeconds + 0.2,
        0,
      ).phase,
    ).toBe("safe");
    expect(
      GATE_SALVO.cycleSeconds -
        GATE_SALVO.telegraphSeconds -
        GATE_SALVO.flightSeconds,
    ).toBeGreaterThan(GATE_SALVO.flightSeconds);
  });

  it("detects a swept contact even when one frame leaps past the player", () => {
    expect(segmentCircleContact([-3, -0.75], [3, -0.75], [0, -0.75], 0.8)).toBe(
      true,
    );
    expect(segmentCircleContact([-3, -0.75], [3, -0.75], [0, 1.2], 0.8)).toBe(
      false,
    );
    expect(
      segmentSegmentContact([-3, -0.75], [3, -0.75], [0, 6], [0, -6], 0.8),
    ).toBe(true);
  });
});
